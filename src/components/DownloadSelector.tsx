import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, File } from 'lucide-react';
import { FileProcessor } from '@/services/fileProcessor';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  isNewField: boolean;
  dataPreview: string[];
}

interface DownloadSelectorProps {
  validRecords: any[];
  mappings: FieldMapping[];
  stats: {
    totalRecords: number;
    validRecords: number;
    errorRecords: number;
    warningRecords: number;
    duplicateRecords: number;
  };
  onDownloadComplete: () => void;
}

const formatOptions = [
  {
    format: 'csv' as const,
    name: 'CSV',
    description: 'Comma-separated values - Universal compatibility',
    icon: FileText,
    extension: 'csv'
  },
  {
    format: 'xlsx' as const,
    name: 'Excel (XLSX)',
    description: 'Modern Excel format - Best for Excel 2007+',
    icon: Table,
    extension: 'xlsx'
  },
  {
    format: 'xls' as const,
    name: 'Excel (XLS)',
    description: 'Classic Excel format - Compatible with older versions',
    icon: File,
    extension: 'xls'
  }
];

export const DownloadSelector: React.FC<DownloadSelectorProps> = ({
  validRecords,
  mappings,
  stats,
  onDownloadComplete
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx' | 'xls'>('csv');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const content = FileProcessor.generateCRMFile(validRecords, mappings, selectedFormat);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `odoo_crm_import_${timestamp}.${formatOptions.find(f => f.format === selectedFormat)?.extension}`;
      
      FileProcessor.downloadFile(content, filename, selectedFormat);
      onDownloadComplete();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedOption = formatOptions.find(f => f.format === selectedFormat);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Choose Download Format
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your data is ready! Select your preferred format and download your CRM-ready file.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gradient-card rounded-2xl border-2 border-primary/10 shadow-card">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-primary">{stats.totalRecords}</div>
          <div className="text-sm font-medium text-muted-foreground">Total Records</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-success">{stats.validRecords}</div>
          <div className="text-sm font-medium text-muted-foreground">Valid Records</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-destructive">{stats.errorRecords}</div>
          <div className="text-sm font-medium text-muted-foreground">Errors</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-warning">{stats.warningRecords}</div>
          <div className="text-sm font-medium text-muted-foreground">Warnings</div>
        </div>
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-accent">{stats.duplicateRecords}</div>
          <div className="text-sm font-medium text-muted-foreground">Duplicates</div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-foreground text-center">Select File Format</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {formatOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedFormat === option.format;
            
            return (
              <Card
                key={option.format}
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'border-2 border-primary shadow-hero bg-primary/5' 
                    : 'border hover:border-primary/30 hover:shadow-card'
                }`}
                onClick={() => setSelectedFormat(option.format)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-gradient-primary' : 'bg-muted'
                  }`}>
                    <Icon className={`h-8 w-8 ${
                      isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <h4 className={`text-lg font-bold ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}>
                        {option.name}
                      </h4>
                      {isSelected && (
                        <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center space-y-4">
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          size="lg"
          className="min-w-80 h-16 text-xl bg-gradient-primary text-primary-foreground shadow-hero hover:shadow-accent transition-all duration-300 hover:scale-105"
        >
          {isDownloading ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              Generating {selectedOption?.name} File...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6" />
              Download {selectedOption?.name} File
            </div>
          )}
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Ready for Odoo CRM import • {stats.validRecords} valid records</span>
          </div>
        </div>
      </div>
    </div>
  );
};