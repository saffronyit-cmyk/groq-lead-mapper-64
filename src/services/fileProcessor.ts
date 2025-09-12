import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedData {
  data: string[][];
  headers: string[];
  filename: string;
}

export class FileProcessor {
  static async processFile(file: File): Promise<ParsedData> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'csv':
        return this.processCSV(file);
      case 'xlsx':
      case 'xls':
        return this.processExcel(file);
      default:
        throw new Error('Unsupported file format. Please use CSV, XLS, or XLSX files.');
    }
  }

  private static async processCSV(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            return;
          }

          const data = results.data as string[][];
          const cleanData = data.filter(row => row.some(cell => cell.trim() !== ''));
          
          if (cleanData.length === 0) {
            reject(new Error('CSV file is empty or contains no valid data'));
            return;
          }

          resolve({
            data: cleanData,
            headers: cleanData[0] || [],
            filename: file.name
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
        header: false,
        skipEmptyLines: true
      });
    });
  }

  private static async processExcel(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            reject(new Error('Excel file contains no worksheets'));
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: ''
          }) as string[][];

          const cleanData = jsonData.filter(row => row.some(cell => String(cell).trim() !== ''));
          
          if (cleanData.length === 0) {
            reject(new Error('Excel file is empty or contains no valid data'));
            return;
          }

          resolve({
            data: cleanData,
            headers: cleanData[0] || [],
            filename: file.name
          });
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static generateCRMFile(data: any[], mappings: any[], format: 'csv' | 'xlsx' | 'xls' = 'csv'): string | ArrayBuffer {
    const BASE_HEADERS = ['External ID','Name','Company Name','Contact Name','Email','Job Position','Phone','Mobile','Street','Street2','City','State','Zip','Country','Website','Notes','medium_id','source_id','referred','campaign_id'];
    const mappedTargets = Array.from(new Set(mappings.map((m: any) => m.targetField)));
    const extraHeaders = mappedTargets.filter((h: string) => !BASE_HEADERS.includes(h));
    const headers = [...BASE_HEADERS, ...extraHeaders];

    // Process data in chunks for better performance
    const processChunk = (chunk: any[]) => {
      return chunk.map((orig) => {
        const row = { ...orig };
        // Enforce rules
        row['External ID'] = '';
        if ((!row['Name'] || String(row['Name']).trim() === '') && row['Company Name']) {
          row['Name'] = row['Company Name'];
        }
        return headers.map((h) => row[h] ?? '');
      });
    };

    // Process in chunks of 1000 records for large datasets
    const chunkSize = 1000;
    const rows: string[][] = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      rows.push(...processChunk(chunk));
    }

    if (format === 'csv') {
      return Papa.unparse([headers, ...rows]);
    } else {
      // Generate Excel file
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM Data');
      
      return XLSX.write(workbook, { 
        bookType: format as 'xlsx' | 'xls', 
        type: 'array' 
      });
    }
  }

  static downloadFile(content: string | ArrayBuffer, filename: string, format: 'csv' | 'xlsx' | 'xls' = 'csv') {
    let mimeType: string;
    
    switch (format) {
      case 'xlsx':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'xls':
        mimeType = 'application/vnd.ms-excel';
        break;
      default:
        mimeType = 'text/csv;charset=utf-8;';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}