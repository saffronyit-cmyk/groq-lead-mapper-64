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

function transformLeadToCrmLead(lead: Record<string, any>, mappings: any[]): Record<string, any> {
  // Create CRM Opportunity (crm.lead) payload so it shows in the Pipeline (kanban)
  const crmLead: Record<string, any> = {
    type: "opportunity", // ensure record appears in CRM pipeline
  };

  const mappedSources = new Set<string>();

  for (const mapping of mappings || []) {
    const src = mapping.sourceField;
    const target = mapping.targetField;
    const value = lead?.[src];
    if (value == null || String(value).trim() === "") continue;
    mappedSources.add(src);

    switch (target) {
      case "Name":
        // Use as the main opportunity name
        crmLead.name = value;
        break;
      case "Company Name":
        // Company for the lead (free text). Avoid guessing partner_id
        crmLead.partner_name = value;
        // If we don't have a title for the opportunity, use company name
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
        // Avoid invalid state_id guesses; keep the info in description
        crmLead.description = (crmLead.description ? `${crmLead.description}\n` : "") + `State: ${value}`;
        break;
      case "Zip":
        crmLead.zip = value;
        break;
      case "Country":
        // Avoid invalid country_id guesses; keep the info in description
        crmLead.description = (crmLead.description ? `${crmLead.description}\n` : "") + `Country: ${value}`;
        break;
      case "Website":
        crmLead.website = value;
        break;
      case "Job Position":
        crmLead.function = value;
        break;
      case "Notes":
        crmLead.description = (crmLead.description ? `${crmLead.description}\n` : "") + String(value);
        break;
    }
  }

  // Add any remaining fields to description
  const unmapped: string[] = [];
  for (const key of Object.keys(lead || {})) {
    if (!mappedSources.has(key)) {
      const v = lead[key];
      if (v != null && String(v).trim() !== "") unmapped.push(`${key}: ${v}`);
    }
  }
  if (unmapped.length > 0) {
    crmLead.description = (crmLead.description ? `${crmLead.description}\n` : "") + unmapped.join("\n");
  }

  // Ensure we have a name
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
      const toCreate = (Array.isArray(leads) ? leads : []).map((lead) => transformLeadToCrmLead(lead, Array.isArray(mappings) ? mappings : []));

      const batchSize = 50;
      const createdRecords: number[] = [];
      const errors: string[] = [];

      for (let i = 0; i < toCreate.length; i += batchSize) {
        const batch = toCreate.slice(i, i + batchSize);
        try {
          const result = await callKw(baseUrl, config.database, uid, config.apiKey, "crm.lead", "create", [batch], {});
          if (Array.isArray(result)) {
            createdRecords.push(...result);
          } else if (typeof result === "number") {
            createdRecords.push(result);
          } else if (Array.isArray(result?.records)) {
            createdRecords.push(...result.records);
          }
        } catch (e) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      const response: OdooUploadResult = {
        success: createdRecords.length > 0,
        uploadedCount: createdRecords.length,
        errors,
        createdRecords,
      };
      return json(response);
    }

    return json({ success: false, message: "Unknown action" }, 400);
  } catch (error) {
    console.error("odoo-proxy error:", error);
    return json({ success: false, message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
