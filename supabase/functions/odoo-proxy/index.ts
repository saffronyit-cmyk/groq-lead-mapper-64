import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OdooConfig {
  url: string;
  database: string;
  username: string;
  apiKey: string;
}

interface OdooUploadResult {
  success: boolean;
  uploadedCount: number;
  errors: string[];
  createdRecords?: number[];
  rowErrors?: { index: number; message: string }[];
  duplicatesCount?: number;
}


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

async function authenticate(baseUrl: string, db: string, login: string, password: string) {
  const resp = await fetch(`${baseUrl}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [db, login, password, {}],
      },
      id: Date.now(),
    }),
  });

  const data = await resp.json();
  if (data?.error) throw new Error(data.error?.data?.message || data.error?.message || "Authentication failed");
  const uid = data?.result;
  if (!uid) throw new Error("Authentication failed: invalid credentials");
  return { uid } as { uid: number };
}

async function callKw(baseUrl: string, db: string, uid: number, password: string, model: string, method: string, args: any[], kwargs: any = {}) {
  const resp = await fetch(`${baseUrl}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [db, uid, password, model, method, args, kwargs],
      },
      id: Date.now(),
    }),
  });
  const data = await resp.json();
  if (data?.error) throw new Error(data.error?.data?.message || data.error?.message || "Odoo call failed");
  return data?.result;
}

// Helpers to resolve Many2one fields by name
async function resolveByName(
  baseUrl: string,
  db: string,
  uid: number,
  apiKey: string,
  model: string,
  name: string,
): Promise<number | null> {
  const term = String(name).trim();
  if (!term) return null;
  try {
    const ids: number[] = await callKw(baseUrl, db, uid, apiKey, model, "search", [[[["name", "ilike", term]]], { limit: 1 }]);
    if (Array.isArray(ids) && ids.length > 0) return ids[0];
  } catch (_) {
    // ignore search errors
  }
  try {
    const created: number = await callKw(baseUrl, db, uid, apiKey, model, "create", [[{ name: term }]]);
    return typeof created === "number" ? created : null;
  } catch (_) {
    return null;
  }
}

async function resolveCountryId(
  baseUrl: string,
  db: string,
  uid: number,
  apiKey: string,
  country: string,
): Promise<number | null> {
  const term = String(country).trim();
  if (!term) return null;
  try {
    const ids: number[] = await callKw(baseUrl, db, uid, apiKey, "res.country", "search", [[[["name", "ilike", term]]], { limit: 1 }]);
    if (ids?.length) return ids[0];
  } catch (_) {}
  try {
    const ids: number[] = await callKw(baseUrl, db, uid, apiKey, "res.country", "search", [[[["code", "ilike", term]]], { limit: 1 }]);
    if (ids?.length) return ids[0];
  } catch (_) {}
  return null;
}

async function resolveStateId(
  baseUrl: string,
  db: string,
  uid: number,
  apiKey: string,
  state: string,
  countryId?: number | null,
): Promise<number | null> {
  const term = String(state).trim();
  if (!term) return null;
  const domain: any[] = [["name", "ilike", term]];
  if (countryId) domain.push(["country_id", "=", countryId]);
  try {
    const ids: number[] = await callKw(baseUrl, db, uid, apiKey, "res.country.state", "search", [[[...domain], { limit: 1 }]]);
    if (ids?.length) return ids[0];
  } catch (_) {}
  return null;
}

function shouldSkipInNotes(key: string) {
  const skip = new Set(["External ID", "external_id", "id", "ID"]);
  return skip.has(String(key));
}

async function transformLeadToCrmLeadAsync(
  baseUrl: string,
  db: string,
  uid: number,
  apiKey: string,
  lead: Record<string, any>,
  mappings: any[],
): Promise<Record<string, any>> {
  const crmLead: Record<string, any> = { type: "opportunity" };
  const mappedSources = new Set<string>();

  let pendingStateName: string | null = null;

  for (const mapping of mappings || []) {
    const src = mapping.sourceField;
    const target = mapping.targetField;
    const value = lead?.[src];
    if (value == null || String(value).trim() === "") continue;
    mappedSources.add(src);

    switch (target) {
      case "External ID":
        // Intentionally ignored as requested
        break;
      case "Name":
        crmLead.name = value;
        break;
      case "Company Name":
        crmLead.partner_name = value;
        if (!crmLead.name) crmLead.name = String(value);
        break;
      case "Contact Name":
        crmLead.contact_name = value;
        if (!crmLead.name) crmLead.name = String(value);
        break;
      case "Email":
        crmLead.email_from = value;
        break;
      case "Phone":
        crmLead.phone = value;
        break;
      case "Mobile":
        crmLead.mobile = value;
        break;
      case "Street":
        crmLead.street = value;
        break;
      case "Street2":
        crmLead.street2 = value;
        break;
      case "City":
        crmLead.city = value;
        break;
      case "State":
        pendingStateName = String(value);
        break;
      case "Zip":
        crmLead.zip = value;
        break;
      case "Country": {
        const str = String(value).trim();
        const asNum = Number(str);
        if (!Number.isNaN(asNum) && asNum > 0) {
          crmLead.country_id = asNum;
        } else {
          const cid = await resolveCountryId(baseUrl, db, uid, apiKey, str);
          if (cid) crmLead.country_id = cid;
        }
        break;
      }
      case "Website":
        crmLead.website = value;
        break;
      case "Job Position":
        crmLead.function = value;
        break;
      case "Notes":
        crmLead.description = (crmLead.description ? `${crmLead.description}\n` : "") + String(value);
        break;
      case "medium_id":
      case "Medium": {
        const id = await resolveByName(baseUrl, db, uid, apiKey, "utm.medium", String(value));
        if (id) crmLead.medium_id = id;
        break;
      }
      case "source_id":
      case "Source": {
        const id = await resolveByName(baseUrl, db, uid, apiKey, "utm.source", String(value));
        if (id) crmLead.source_id = id;
        break;
      }
      case "campaign_id":
      case "Campaign": {
        const id = await resolveByName(baseUrl, db, uid, apiKey, "utm.campaign", String(value));
        if (id) crmLead.campaign_id = id;
        break;
      }
      case "referred":
      case "Referred":
        crmLead.referred = value;
        break;
      default:
        break;
    }
  }

  // Resolve state if provided
  if (pendingStateName) {
    const sid = await resolveStateId(baseUrl, db, uid, apiKey, pendingStateName, crmLead.country_id);
    if (sid) crmLead.state_id = sid;
    else crmLead.description = (crmLead.description ? `${crmLead.description}\n` : "") + `State: ${pendingStateName}`;
  }

  // Add any remaining unmapped fields to description (except skipped)
  const unmapped: string[] = [];
  for (const key of Object.keys(lead || {})) {
    if (!mappedSources.has(key) && !shouldSkipInNotes(key)) {
      const v = lead[key];
      if (v != null && String(v).trim() !== "") unmapped.push(`${key}: ${v}`);
    }
  }
  if (unmapped.length > 0) {
    crmLead.description = (crmLead.description ? `${crmLead.description}\n` : "") + unmapped.join("\n");
  }

  if (!crmLead.name) {
    crmLead.name = crmLead.contact_name || crmLead.partner_name || crmLead.email_from || "Imported Opportunity";
  }

  return crmLead;
}


serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, config, leads, mappings } = await req.json();

    if (!config || !config.url || !config.database || !config.username || !config.apiKey) {
      return json({ success: false, message: "Missing Odoo configuration" }, 400);
    }

    const baseUrl = sanitizeUrl(String(config.url));
    const { uid } = await authenticate(baseUrl, config.database, config.username, config.apiKey);

    if (action === "test") {
      return json({ success: true, message: `Connection successful (uid ${uid})` });
    }

    if (action === "upload") {
      const rawLeads = Array.isArray(leads) ? leads : [];
      const mapDefs = Array.isArray(mappings) ? mappings : [];

      // Simple duplicate count (by Email/Phone/Mobile based on mapping)
      const emailMap = mapDefs.find((m: any) => m.targetField === "Email");
      const phoneMap = mapDefs.find((m: any) => m.targetField === "Phone") || mapDefs.find((m: any) => m.targetField === "Mobile");
      const seen = new Map<string, number>();
      let duplicatesCount = 0;
      for (const lead of rawLeads) {
        const key = String(
          (emailMap ? lead[emailMap.sourceField] : "") ||
          (phoneMap ? lead[phoneMap.sourceField] : "") ||
          ""
        ).toLowerCase().trim();
        if (!key) continue;
        const prev = seen.get(key) || 0;
        if (prev >= 1) duplicatesCount++;
        seen.set(key, prev + 1);
      }

      const createdRecords: number[] = [];
      const rowErrors: { index: number; message: string }[] = [];

      for (let i = 0; i < rawLeads.length; i++) {
        try {
          const payload = await transformLeadToCrmLeadAsync(baseUrl, config.database, uid, config.apiKey, rawLeads[i], mapDefs);
          const created: number | number[] = await callKw(baseUrl, config.database, uid, config.apiKey, "crm.lead", "create", [[payload]], {});
          if (Array.isArray(created)) {
            if (created.length) createdRecords.push(created[0]);
          } else if (typeof created === "number") {
            createdRecords.push(created);
          }
        } catch (e) {
          rowErrors.push({ index: i, message: e instanceof Error ? e.message : String(e) });
        }
      }

      const response: OdooUploadResult = {
        success: createdRecords.length > 0,
        uploadedCount: createdRecords.length,
        errors: rowErrors.slice(0, 3).map((e) => `Row ${e.index + 2}: ${e.message}`),
        createdRecords,
        rowErrors,
        duplicatesCount,
      };
      return json(response);
    }

    return json({ success: false, message: "Unknown action" }, 400);
  } catch (error) {
    console.error("odoo-proxy error:", error);
    return json({ success: false, message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
