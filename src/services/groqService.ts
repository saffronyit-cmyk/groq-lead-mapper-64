interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  isNewField: boolean;
  dataPreview: string[];
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'duplicate';
  field: string;
  value: string;
  row: number;
  message: string;
}

export class GroqService {
  private static readonly API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly API_KEY = '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';

  private static readonly ODOO_TEMPLATE_FIELDS = [
    'External ID', 'Name', 'Company Name', 'Contact Name', 'Email', 'Job Position', 'Phone', 'Mobile', 'Street', 'Street2', 'City', 'State', 'Zip', 'Country', 'Website', 'Notes', 'medium_id', 'source_id', 'referred', 'campaign_id'
  ];

  private static readonly INDIAN_STATES_MAP = {
    'andhra pradesh': 'Andhra Pradesh (IN)',
    'arunachal pradesh': 'Arunachal Pradesh (IN)',
    'assam': 'Assam (IN)',
    'bihar': 'Bihar (IN)',
    'chhattisgarh': 'Chhattisgarh (IN)',
    'goa': 'Goa (IN)',
    'gujarat': 'Gujarat (IN)',
    'haryana': 'Haryana (IN)',
    'himachal pradesh': 'Himachal Pradesh (IN)',
    'jharkhand': 'Jharkhand (IN)',
    'karnataka': 'Karnataka (IN)',
    'kerala': 'Kerala (IN)',
    'madhya pradesh': 'Madhya Pradesh (IN)',
    'maharashtra': 'Maharashtra (IN)',
    'manipur': 'Manipur (IN)',
    'meghalaya': 'Meghalaya (IN)',
    'mizoram': 'Mizoram (IN)',
    'nagaland': 'Nagaland (IN)',
    'odisha': 'Odisha (IN)',
    'punjab': 'Punjab (IN)',
    'rajasthan': 'Rajasthan (IN)',
    'sikkim': 'Sikkim (IN)',
    'tamil nadu': 'Tamil Nadu (IN)',
    'telangana': 'Telangana (IN)',
    'tripura': 'Tripura (IN)',
    'uttar pradesh': 'Uttar Pradesh (IN)',
    'uttarakhand': 'Uttarakhand (IN)',
    'west bengal': 'West Bengal (IN)',
    'delhi': 'Delhi (IN)',
    'jammu and kashmir': 'Jammu and Kashmir (IN)',
    'ladakh': 'Ladakh (IN)',
    'chandigarh': 'Chandigarh (IN)',
    'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu (IN)',
    'lakshadweep': 'Lakshadweep (IN)',
    'puducherry': 'Puducherry (IN)'
  };

  private static readonly MEDIUM_MAP = {
    'banner': 'Banner',
    'direct': 'Direct',
    'email': 'Email',
    'facebook': 'Facebook',
    'google': 'Google Adwords',
    'google adwords': 'Google Adwords',
    'linkedin': 'LinkedIn',
    'phone': 'Phone',
    'television': 'Television',
    'tv': 'Television',
    'website': 'Website',
    'x': 'X',
    'twitter': 'X'
  };

  private static readonly SOURCE_MAP = {
    'search engine': 'Search engine',
    'lead recall': 'Lead Recall',
    'newsletter': 'Newsletter',
    'facebook': 'Facebook',
    'x': 'X',
    'twitter': 'X',
    'linkedin': 'LinkedIn',
    'monster': 'Monster',
    'glassdoor': 'Glassdoor',
    'craigslist': 'Craigslist',
    'referral': 'Referral'
  };

  static async analyzeAndMapFields(csvData: string[][]): Promise<FieldMapping[]> {
    try {
      const headers = csvData[0];
      const sampleData = csvData.slice(1, 6); // First 5 rows for analysis

        const prompt = `
        You are an expert CRM data mapper. Analyze the provided CSV headers and sample data, then map them to the Target CRM Template fields below.

        CSV Headers: ${JSON.stringify(headers)}
        Sample Data: ${JSON.stringify(sampleData)}

        Target CRM Template Fields (use these exact names): ${JSON.stringify(this.ODOO_TEMPLATE_FIELDS)}

        Critical rules:
        1) External ID must always be an empty string in the final output. Do not try to infer or generate it.
        2) Name is mandatory and must contain the contact person's name. If the source provides only a company name (or similar), copy that value into Name.
        3) Company Name should contain the organization/business name when available.
        4) Contact Name can be used for an additional contact person name if the source has both a primary "Name" and a separate contact name; otherwise it may be blank.
        5) Map phone-like columns (e.g., "Contact", "Phone", "Mobile", "WhatsApp") to Phone or Mobile appropriately. If it's a single phone field, prefer Phone.
        6) Map address-like columns (Street/Street2/City/State/Zip/Country) and common synonyms accordingly. Location fields should map to Street, not City.
        7) Email should be mapped from any email-like column (e.g., "Email", "E-mail", "Mail").
        8) Job Position should map from role/title-like columns.
        9) medium_id should map from marketing medium/channel fields (e.g., "Medium", "Channel", "Marketing Medium").
        10) source_id should map from lead source fields (e.g., "Source", "Lead Source", "Origin").
        11) campaign_id should map from campaign-related fields (e.g., "Campaign", "Campaign Name", "UTM Campaign").
        12) referred should map from referral fields (e.g., "Referred By", "Referrer", "Reference").
        13) If a source column does not correspond to any of the target fields, set isNewField to true and use the original header text as targetField so a new column can be created.
        14) Provide a confidence score (0-100) based on field name similarity and data content.
        15) Include a short data preview.

        Note: The system will automatically normalize state names to Odoo format (e.g., "Gujarat" → "Gujarat (IN)"), medium values, and source values.

        Return ONLY a valid JSON array of mappings in this exact format:
        [
          {
            "sourceField": "csv_header_name",
            "targetField": "one_of_the_target_fields_or_new_column_name",
            "confidence": 95,
            "isNewField": false,
            "dataPreview": ["sample1", "sample2", "sample3"]
          }
        ]
      `;

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data: GroqResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from Groq AI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const mappings: FieldMapping[] = JSON.parse(jsonMatch[0]);

      // Add data previews from actual CSV data
      return mappings.map(mapping => {
        const sourceIndex = headers.indexOf(mapping.sourceField);
        const preview = sourceIndex >= 0 
          ? sampleData.map(row => row[sourceIndex]).filter(Boolean).slice(0, 3)
          : [];
        
        return {
          ...mapping,
          dataPreview: preview
        };
      });

    } catch (error) {
      console.error('Error in field mapping:', error);
      console.log('Falling back to automatic mapping...');
      // Always provide fallback mapping for robustness
      const fallbackMappings = this.createFallbackMapping(csvData);
      
      // Show user that AI mapping failed but we have a fallback
      if (typeof window !== 'undefined') {
        console.warn('AI mapping service unavailable, using smart fallback mapping');
      }
      
      return fallbackMappings;
    }
  }

  static async validateData(mappedData: any[]): Promise<{
    validRecords: any[];
    issues: ValidationIssue[];
    stats: {
      totalRecords: number;
      validRecords: number;
      errorRecords: number;
      warningRecords: number;
      duplicateRecords: number;
    };
  }> {
    const issues: ValidationIssue[] = [];
    const validRecords: any[] = [];

    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();

    const getVal = (record: any, keys: string[]): string => {
      for (const k of keys) {
        const v = record[k];
        if (v !== undefined && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    };

    const normEmail = (e: string) => e.toLowerCase();
    const normPhone = (p: string) => p.replace(/[^\d+]/g, '');

    mappedData.forEach((record, index) => {
      let hasError = false;
      const rowNum = index + 2; // Account for header row

      // Auto-correct and normalize data
      this.normalizeRecordData(record);

      // Enforce Name rule: if missing but Company Name exists, copy it
      let nameVal = getVal(record, ['Name', 'name', 'Contact Name']);
      const companyVal = getVal(record, ['Company Name', 'company_name']);
      if (!nameVal && companyVal) {
        record['Name'] = companyVal;
        record['name'] = companyVal; // keep legacy alias
        nameVal = companyVal;
      }

      // Email validation
      const emailVal = getVal(record, ['Email', 'email']);
      if (emailVal) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
          issues.push({
            type: 'error',
            field: 'Email',
            value: emailVal,
            row: rowNum,
            message: 'Invalid email format'
          });
          hasError = true;
        } else if (seenEmails.has(normEmail(emailVal))) {
          issues.push({
            type: 'duplicate',
            field: 'Email',
            value: emailVal,
            row: rowNum,
            message: 'Duplicate email address'
          });
        } else {
          seenEmails.add(normEmail(emailVal));
        }
      }

      // Phone validation (Phone and Mobile)
      const phoneVal = getVal(record, ['Phone', 'phone']);
      const mobileVal = getVal(record, ['Mobile', 'mobile']);

      const validatePhone = (val: string, fieldLabel: string) => {
        const digits = normPhone(val);
        const phoneRegex = /^[+]?\d{7,16}$/; // lenient but sane
        if (!phoneRegex.test(digits)) {
          issues.push({
            type: 'warning',
            field: fieldLabel,
            value: val,
            row: rowNum,
            message: 'Phone number format may be invalid'
          });
        } else if (seenPhones.has(digits)) {
          issues.push({
            type: 'duplicate',
            field: fieldLabel,
            value: val,
            row: rowNum,
            message: 'Duplicate phone number'
          });
        } else {
          seenPhones.add(digits);
        }
      };

      if (phoneVal) validatePhone(phoneVal, 'Phone');
      if (mobileVal) validatePhone(mobileVal, 'Mobile');

      // Required field validation
      if (!nameVal && !companyVal) {
        issues.push({
          type: 'error',
          field: 'Name',
          value: '',
          row: rowNum,
          message: 'Name is required (copy Company Name if Name missing)'
        });
        hasError = true;
      }

      if (!hasError) {
        validRecords.push(record);
      }
    });

    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const duplicateCount = issues.filter(i => i.type === 'duplicate').length;

    return {
      validRecords,
      issues,
      stats: {
        totalRecords: mappedData.length,
        validRecords: validRecords.length,
        errorRecords: errorCount,
        warningRecords: warningCount,
        duplicateRecords: duplicateCount
      }
    };
  }

  private static normalizeRecordData(record: any): void {
    // Normalize State field to Odoo format
    const stateFields = ['State', 'state'];
    for (const field of stateFields) {
      if (record[field]) {
        const stateValue = String(record[field]).toLowerCase().trim();
        const normalizedState = this.INDIAN_STATES_MAP[stateValue];
        if (normalizedState) {
          record[field] = normalizedState;
        }
      }
    }

    // Normalize Medium field
    const mediumFields = ['medium_id', 'Medium', 'medium', 'Marketing Medium', 'Channel'];
    for (const field of mediumFields) {
      if (record[field]) {
        const mediumValue = String(record[field]).toLowerCase().trim();
        const normalizedMedium = this.MEDIUM_MAP[mediumValue];
        if (normalizedMedium) {
          record['medium_id'] = normalizedMedium;
          record[field] = normalizedMedium;
        }
      }
    }

    // Normalize Source field
    const sourceFields = ['source_id', 'Source', 'source', 'Lead Source', 'Origin'];
    for (const field of sourceFields) {
      if (record[field]) {
        const sourceValue = String(record[field]).toLowerCase().trim();
        const normalizedSource = this.SOURCE_MAP[sourceValue];
        if (normalizedSource) {
          record['source_id'] = normalizedSource;
          record[field] = normalizedSource;
        }
      }
    }

    // Normalize Country to proper format if India
    const countryFields = ['Country', 'country'];
    for (const field of countryFields) {
      if (record[field]) {
        const countryValue = String(record[field]).toLowerCase().trim();
        if (countryValue === 'india' || countryValue === 'in') {
          record[field] = 'India';
        }
      }
    }
  }

  private static createFallbackMapping(csvData: string[][]): FieldMapping[] {
    const headers = csvData[0];
    const sampleData = csvData.slice(1, 4);

    const mapHeader = (header: string) => {
      const h = header.toLowerCase().trim();

      const rules: Array<{ keys: string[]; target: string; confidence: number }> = [
        { keys: ['client name', 'contact name', 'contact person', 'lead name', 'people', 'person', 'name'], target: 'Name', confidence: 92 },
        { keys: ['company', 'company name', 'business', 'org', 'organization'], target: 'Company Name', confidence: 90 },
        { keys: ['email', 'e-mail', 'mail'], target: 'Email', confidence: 95 },
        { keys: ['job', 'position', 'role', 'title'], target: 'Job Position', confidence: 80 },
        { keys: ['mobile', 'cell', 'whatsapp'], target: 'Mobile', confidence: 88 },
        { keys: ['contact', 'phone', 'telephone', 'tel'], target: 'Phone', confidence: 88 },
        { keys: ['street2', 'address line 2', 'addr2', 'line2'], target: 'Street2', confidence: 80 },
        { keys: ['street', 'address', 'address line 1', 'addr1', 'line1', 'location'], target: 'Street', confidence: 80 },
        { keys: ['city', 'town'], target: 'City', confidence: 80 },
        { keys: ['state', 'province', 'region'], target: 'State', confidence: 80 },
        { keys: ['zip', 'postal', 'pincode', 'pin code', 'postcode'], target: 'Zip', confidence: 80 },
        { keys: ['country'], target: 'Country', confidence: 80 },
        { keys: ['website', 'url', 'site'], target: 'Website', confidence: 80 },
        { keys: ['notes', 'remark', 'remarks', 'comment', 'comments', 'note'], target: 'Notes', confidence: 75 },
        { keys: ['medium', 'marketing medium', 'channel', 'advertising medium'], target: 'medium_id', confidence: 85 },
        { keys: ['source', 'lead source', 'origin', 'referral source'], target: 'source_id', confidence: 85 },
        { keys: ['campaign', 'campaign name', 'marketing campaign', 'utm campaign'], target: 'campaign_id', confidence: 85 },
        { keys: ['referred by', 'referrer', 'referred', 'reference'], target: 'referred', confidence: 80 },
      ];

      for (const rule of rules) {
        if (rule.keys.some(k => h.includes(k))) {
          return { targetField: rule.target, confidence: rule.confidence, isNewField: false };
        }
      }

      return { targetField: header, confidence: 50, isNewField: true };
    };

    return headers.map(header => {
      const mapped = mapHeader(header);
      const sourceIndex = headers.indexOf(header);
      const preview = sampleData.map(row => row[sourceIndex]).filter(Boolean);

      return {
        sourceField: header,
        targetField: mapped.targetField,
        confidence: mapped.confidence,
        isNewField: mapped.isNewField,
        dataPreview: preview.slice(0, 3)
      };
    });
  }
}