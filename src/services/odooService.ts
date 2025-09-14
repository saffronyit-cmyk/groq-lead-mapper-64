import { supabase } from "@/integrations/supabase/client";

export interface OdooConfig {
  url: string;
  database: string;
  username: string;
  apiKey: string;
}

export interface OdooUploadResult {
  success: boolean;
  uploadedCount: number;
  errors: string[];
  createdRecords?: number[];
  rowErrors?: { index: number; message: string }[];
  duplicatesCount?: number;
}


export class OdooService {
  private static async authenticate(config: OdooConfig): Promise<number> {
    const response = await fetch(`${config.url}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [config.database, config.username, config.apiKey, {}]
        },
        id: 1
      })
    });

    const result = await response.json();
    if (result.error) {
      throw new Error(`Authentication failed: ${result.error.message || 'Invalid credentials'}`);
    }

    if (!result.result) {
      throw new Error('Authentication failed: Invalid credentials');
    }

    return result.result;
  }

  static async testConnection(config: OdooConfig): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('odoo-proxy', {
        body: { action: 'test', config },
      });
      if (error) {
        return { success: false, message: error.message || 'Connection failed' };
      }
      return (data as { success: boolean; message: string }) ?? { success: false, message: 'No response from server' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  static async uploadLeads(
    config: OdooConfig,
    leads: any[],
    mappings: any[]
  ): Promise<OdooUploadResult> {
    try {
      const { data, error } = await supabase.functions.invoke('odoo-proxy', {
        body: { action: 'upload', config, leads, mappings },
      });
      if (error) {
        return {
          success: false,
          uploadedCount: 0,
          errors: [error.message || 'Upload failed'],
        };
      }
      return (data as OdooUploadResult) ?? { success: false, uploadedCount: 0, errors: ['No response from server'] };
    } catch (error) {
      return {
        success: false,
        uploadedCount: 0,
        errors: [error instanceof Error ? error.message : 'Upload failed'],
      };
    }
  }

  private static transformLeadToOdoo(lead: any, mappings: any[]): any {
    const odooLead: any = {
      is_company: false,
      customer_rank: 1, // Mark as customer
    };

    // Standard field mappings
    const standardFields = [
      'name', 'company_name', 'email', 'phone', 'mobile', 'street', 'street2',
      'city', 'state_id', 'zip', 'country_id', 'website', 'function'
    ];

    // Map standard fields
    mappings.forEach(mapping => {
      const sourceValue = lead[mapping.sourceField];
      if (sourceValue && sourceValue.toString().trim() !== '') {
        switch (mapping.targetField) {
          case 'Name':
            odooLead.name = sourceValue;
            break;
          case 'Company Name':
            odooLead.parent_name = sourceValue;
            // If it's a company lead, set is_company to true
            if (!odooLead.name || odooLead.name === sourceValue) {
              odooLead.is_company = true;
            }
            break;
          case 'Contact Name':
            if (!odooLead.name) odooLead.name = sourceValue;
            break;
          case 'Email':
            odooLead.email = sourceValue;
            break;
          case 'Phone':
            odooLead.phone = sourceValue;
            break;
          case 'Mobile':
            odooLead.mobile = sourceValue;
            break;
          case 'Street':
            odooLead.street = sourceValue;
            break;
          case 'Street2':
            odooLead.street2 = sourceValue;
            break;
          case 'City':
            odooLead.city = sourceValue;
            break;
          case 'State':
            // For Indian states, we need to handle the state mapping
            odooLead.state_id = this.mapStateToOdooId(sourceValue);
            break;
          case 'Zip':
            odooLead.zip = sourceValue;
            break;
          case 'Country':
            odooLead.country_id = sourceValue === 'India' ? 104 : null; // India's ID in Odoo
            break;
          case 'Website':
            odooLead.website = sourceValue;
            break;
          case 'Job Position':
            odooLead.function = sourceValue;
            break;
        }
      }
    });

    // Handle unmapped fields - combine them into notes/comment
    const unmappedFields: string[] = [];
    const mappedSources = new Set(mappings.map(m => m.sourceField));
    
    Object.keys(lead).forEach(key => {
      if (!mappedSources.has(key) && lead[key] && lead[key].toString().trim() !== '') {
        unmappedFields.push(`${key}: ${lead[key]}`);
      }
    });

    if (unmappedFields.length > 0) {
      odooLead.comment = unmappedFields.join('\n');
    }

    // Ensure we have a name (required field)
    if (!odooLead.name) {
      odooLead.name = odooLead.parent_name || odooLead.email || 'Imported Lead';
    }

    return odooLead;
  }

  private static mapStateToOdooId(stateName: string): number | null {
    // This is a simplified mapping - in a real implementation,
    // you would need to fetch the actual state IDs from Odoo
    // or maintain a comprehensive mapping
    const stateMap: Record<string, number> = {
      'Andhra Pradesh (IN)': 1,
      'Arunachal Pradesh (IN)': 2,
      'Assam (IN)': 3,
      'Bihar (IN)': 4,
      'Chhattisgarh (IN)': 5,
      'Goa (IN)': 6,
      'Gujarat (IN)': 7,
      'Haryana (IN)': 8,
      'Himachal Pradesh (IN)': 9,
      'Jharkhand (IN)': 10,
      'Karnataka (IN)': 11,
      'Kerala (IN)': 12,
      'Madhya Pradesh (IN)': 13,
      'Maharashtra (IN)': 14,
      'Manipur (IN)': 15,
      'Meghalaya (IN)': 16,
      'Mizoram (IN)': 17,
      'Nagaland (IN)': 18,
      'Odisha (IN)': 19,
      'Punjab (IN)': 20,
      'Rajasthan (IN)': 21,
      'Sikkim (IN)': 22,
      'Tamil Nadu (IN)': 23,
      'Telangana (IN)': 24,
      'Tripura (IN)': 25,
      'Uttar Pradesh (IN)': 26,
      'Uttarakhand (IN)': 27,
      'West Bengal (IN)': 28,
      'Delhi (IN)': 29,
    };

    return stateMap[stateName] || null;
  }
}