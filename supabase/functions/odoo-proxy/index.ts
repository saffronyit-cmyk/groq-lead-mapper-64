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
  createdContacts?: number[];
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

async function createContactAndOpportunity(
  baseUrl: string,
  db: string,
  uid: number,
  apiKey: string,
  lead: Record<string, any>,
  mappings: any[],
): Promise<{ contactId?: number; opportunityId?: number }> {
  const mappedSources = new Set<string>();
  
  // Prepare contact data
  const contactData: Record<string, any> = {
    is_company: false,
    customer_rank: 1,
  };
  
  // Prepare opportunity data
  const opportunityData: Record<string, any> = {
    type: "opportunity",
  };

  let pendingStateName: string | null = null;

  // Process all mappings and field data without validation
  for (const mapping of mappings || []) {
    const src = mapping.sourceField;
    const target = mapping.targetField;
    const value = lead?.[src];
    if (value == null) continue; // Allow empty strings through
    mappedSources.add(src);

    const strValue = String(value);

    switch (target) {
      case "Name":
        contactData.name = strValue;
        if (!opportunityData.name) opportunityData.name = strValue;
        break;
      case "Contact Name":
        // Use Contact Name as the primary contact name if Name is not available
        if (!contactData.name) contactData.name = strValue;
        if (!opportunityData.name) opportunityData.name = strValue;
        break;
      case "Company Name":
        contactData.parent_name = strValue;
        opportunityData.partner_name = strValue;
        // Only use company name as contact name if no other name is available
        if (!contactData.name) contactData.name = strValue;
        if (!opportunityData.name) opportunityData.name = strValue;
        break;
      case "Email":
        contactData.email = strValue;
        opportunityData.email_from = strValue;
        break;
      case "Phone":
        contactData.phone = strValue;
        opportunityData.phone = strValue;
        break;
      case "Mobile":
        contactData.mobile = strValue;
        opportunityData.mobile = strValue;
        break;
      case "Street":
        contactData.street = strValue;
        opportunityData.street = strValue;
        break;
      case "Street2":
        contactData.street2 = strValue;
        opportunityData.street2 = strValue;
        break;
      case "City":
        contactData.city = strValue;
        opportunityData.city = strValue;
        break;
      case "State":
        pendingStateName = strValue;
        break;
      case "Zip":
        contactData.zip = strValue;
        opportunityData.zip = strValue;
        break;
      case "Country": {
        const asNum = Number(strValue);
        if (!Number.isNaN(asNum) && asNum > 0) {
          contactData.country_id = asNum;
          opportunityData.country_id = asNum;
        } else {
          try {
            const cid = await resolveCountryId(baseUrl, db, uid, apiKey, strValue);
            if (cid) {
              contactData.country_id = cid;
              opportunityData.country_id = cid;
            }
          } catch (e) {
            // Ignore country resolution errors
          }
        }
        break;
      }
      case "Website":
        contactData.website = strValue;
        opportunityData.website = strValue;
        break;
      case "Job Position":
        contactData.function = strValue;
        opportunityData.function = strValue;
        break;
      case "Medium": {
        try {
          const id = await resolveByName(baseUrl, db, uid, apiKey, "utm.medium", strValue);
          if (id) opportunityData.medium_id = id;
        } catch (e) {
          // Ignore UTM resolution errors
        }
        break;
      }
      case "Source": {
        try {
          const id = await resolveByName(baseUrl, db, uid, apiKey, "utm.source", strValue);
          if (id) opportunityData.source_id = id;
        } catch (e) {
          // Ignore UTM resolution errors
        }
        break;
      }
      case "Campaign": {
        try {
          const id = await resolveByName(baseUrl, db, uid, apiKey, "utm.campaign", strValue);
          if (id) opportunityData.campaign_id = id;
        } catch (e) {
          // Ignore UTM resolution errors
        }
        break;
      }
      case "Opportunity":
        opportunityData.name = strValue;
        break;
      default:
        break;
    }
  }

  // Resolve state if provided
  if (pendingStateName) {
    try {
      const sid = await resolveStateId(baseUrl, db, uid, apiKey, pendingStateName, contactData.country_id);
      if (sid) {
        contactData.state_id = sid;
        opportunityData.state_id = sid;
      }
    } catch (e) {
      // Ignore state resolution errors
    }
  }

  // Add unmapped fields to description
  const unmapped: string[] = [];
  for (const key of Object.keys(lead || {})) {
    if (!mappedSources.has(key) && !shouldSkipInNotes(key)) {
      const v = lead[key];
      if (v != null && String(v).trim() !== "") unmapped.push(`${key}: ${v}`);
    }
  }
  if (unmapped.length > 0) {
    const description = unmapped.join("\n");
    contactData.comment = description;
    opportunityData.description = description;
  }

  // Set default names if missing
  if (!contactData.name) {
    contactData.name = contactData.parent_name || contactData.email || "Imported Contact";
  }
  if (!opportunityData.name) {
    opportunityData.name = contactData.name || "Imported Opportunity";
  }

  let contactId: number | undefined;
  let opportunityId: number | undefined;

  // Create contact first
  try {
    const createdContact = await callKw(baseUrl, db, uid, apiKey, "res.partner", "create", [[contactData]], {});
    contactId = Array.isArray(createdContact) ? createdContact[0] : createdContact;
  } catch (e) {
    console.error("Failed to create contact:", e);
  }

  // Link contact to opportunity if contact was created successfully
  if (contactId) {
    opportunityData.partner_id = contactId;
  }

  // Create opportunity
  try {
    const createdOpportunity = await callKw(baseUrl, db, uid, apiKey, "crm.lead", "create", [[opportunityData]], {});
    opportunityId = Array.isArray(createdOpportunity) ? createdOpportunity[0] : createdOpportunity;
  } catch (e) {
    console.error("Failed to create opportunity:", e);
  }

  return { contactId, opportunityId };
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

      const createdRecords: number[] = [];
      const createdContacts: number[] = [];
      let uploadedCount = 0;

      // Process all leads without validation or duplicate checking
      for (let i = 0; i < rawLeads.length; i++) {
        try {
          const result = await createContactAndOpportunity(baseUrl, config.database, uid, config.apiKey, rawLeads[i], mapDefs);
          
          if (result.contactId) {
            createdContacts.push(result.contactId);
          }
          if (result.opportunityId) {
            createdRecords.push(result.opportunityId);
          }
          
          // Count as uploaded if either contact or opportunity was created
          if (result.contactId || result.opportunityId) {
            uploadedCount++;
          }
        } catch (e) {
          // Log error but continue processing other records
          console.error(`Error processing lead ${i + 1}:`, e);
        }
      }

      const response: OdooUploadResult = {
        success: uploadedCount > 0,
        uploadedCount,
        errors: [], // No errors reported as requested
        createdRecords,
        createdContacts,
      };
      return json(response);
    }

    return json({ success: false, message: "Unknown action" }, 400);
  } catch (error) {
    console.error("odoo-proxy error:", error);
    return json({ success: false, message: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
