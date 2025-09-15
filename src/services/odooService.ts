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
  createdContacts?: number[];
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

}