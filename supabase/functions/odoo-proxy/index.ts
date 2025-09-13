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
  const resp = await fetch(`${baseUrl}/web/session/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { db, login, password },
      id: Date.now(),
    }),
  });

  const setCookie = resp.headers.get("set-cookie") || "";
  // Try to extract the session cookie
  let cookieHeader = "";
  const sessionCookie = setCookie.split(",").find((c) => c.includes("session_id="));
  if (sessionCookie) cookieHeader = sessionCookie.split(";")[0];

  const data = await resp.json();
  if (data?.error) throw new Error(data.error?.data?.message || data.error?.message || "Authentication failed");
  const uid = data?.result?.uid;
  if (!uid) throw new Error("Authentication failed: invalid credentials");
  return { uid, cookie: cookieHeader } as { uid: number; cookie: string };
}

async function callKw(baseUrl: string, cookie: string, model: string, method: string, args: any[], kwargs: any = {}) {
  const resp = await fetch(`${baseUrl}/web/dataset/call_kw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        model,
        method,
        args,
        kwargs,
      },
      id: Date.now(),
    }),
  });
  const data = await resp.json();
  if (data?.error) throw new Error(data.error?.data?.message || data.error?.message || "Odoo call failed");
  return data?.result;
}

function transformLeadToOdoo(lead: Record<string, any>, mappings: any[]): Record<string, any> {
  const odooLead: Record<string, any> = {
    is_company: false,
    customer_rank: 1,
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
        odooLead.name = value;
        break;
      case "Company Name":
        odooLead.parent_name = value;
        if (!odooLead.name || odooLead.name === value) {
          odooLead.is_company = true;
        }
        break;
      case "Contact Name":
        if (!odooLead.name) odooLead.name = value;
        break;
      case "Email":
        odooLead.email = value;
        break;
      case "Phone":
        odooLead.phone = value;
        break;
      case "Mobile":
        odooLead.mobile = value;
        break;
      case "Street":
        odooLead.street = value;
        break;
      case "Street2":
        odooLead.street2 = value;
        break;
      case "City":
        odooLead.city = value;
        break;
      case "State":
        // Avoid invalid state_id guesses; keep the info in notes
        odooLead.comment = (odooLead.comment ? `${odooLead.comment}\n` : "") + `State: ${value}`;
        break;
      case "Zip":
        odooLead.zip = value;
        break;
      case "Country":
        // Avoid invalid country_id guesses; keep the info in notes
        odooLead.comment = (odooLead.comment ? `${odooLead.comment}\n` : "") + `Country: ${value}`;
        break;
      case "Website":
        odooLead.website = value;
        break;
      case "Job Position":
        odooLead.function = value;
        break;
    }
  }

  // Add any remaining fields to notes
  const unmapped: string[] = [];
  for (const key of Object.keys(lead || {})) {
    if (!mappedSources.has(key)) {
      const v = lead[key];
      if (v != null && String(v).trim() !== "") unmapped.push(`${key}: ${v}`);
    }
  }
  if (unmapped.length > 0) {
    odooLead.comment = (odooLead.comment ? `${odooLead.comment}\n` : "") + unmapped.join("\n");
  }

  if (!odooLead.name) {
    odooLead.name = odooLead.parent_name || odooLead.email || "Imported Lead";
  }

  return odooLead;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, config, leads, mappings } = await req.json();

    if (!config || !config.url || !config.database || !config.username || !config.apiKey) {
      return json({ success: false, message: "Missing Odoo configuration" }, 400);
    }

    const baseUrl = sanitizeUrl(String(config.url));
    const { uid, cookie } = await authenticate(baseUrl, config.database, config.username, config.apiKey);

    if (action === "test") {
      return json({ success: true, message: `Connection successful (uid ${uid})` });
    }

    if (action === "upload") {
      const toCreate = (Array.isArray(leads) ? leads : []).map((lead) => transformLeadToOdoo(lead, Array.isArray(mappings) ? mappings : []));

      const batchSize = 50;
      const createdRecords: number[] = [];
      const errors: string[] = [];

      for (let i = 0; i < toCreate.length; i += batchSize) {
        const batch = toCreate.slice(i, i + batchSize);
        try {
          const result = await callKw(baseUrl, cookie, "res.partner", "create", [batch], {});
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
