import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Users, ArrowLeft, Download, Database, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DownloadSelector } from '@/components/DownloadSelector';
import OdooConfig from '@/components/OdooConfig';
import OdooUploader from '@/components/OdooUploader';
import { type OdooConfig as OdooConfigType } from '@/services/odooService';

interface ValidationIssue {
  type: 'error' | 'warning' | 'duplicate';
  field: string;
  value: string;
  row: number;
  message: string;
}

interface ValidationStats {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  warningRecords: number;
  duplicateRecords: number;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  isNewField: boolean;
  dataPreview: string[];
}

interface ValidationResultsProps {
  stats: ValidationStats;
  issues: ValidationIssue[];
  onNext: () => void;
  onBack: () => void;
  isProcessing: boolean;
  validRecords?: any[];
  mappings?: FieldMapping[];
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({
  stats,
  issues,
  onNext,
  onBack,
  isProcessing,
  validRecords = [],
  mappings = []
}) => {
  const [uploadMode, setUploadMode] = useState<'download' | 'odoo'>('download');
  const [odooConfig, setOdooConfig] = useState<OdooConfigType | null>(null);
  const [showOdooConfig, setShowOdooConfig] = useState(false);

  const validationRate = (stats.validRecords / stats.totalRecords) * 100;
  const showDownloadSelector = validRecords.length > 0 && mappings.length > 0;

  const handleOdooConfigSave = (config: OdooConfigType) => {
    setOdooConfig(config);
    setShowOdooConfig(false);
    setUploadMode('odoo');
  };

  const handleOdooUploadComplete = () => {
    onNext(); // Move to success step
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-success text-success-foreground shadow-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Validation Complete</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground">
          Data Quality Report
        </h2>
        <p className="text-muted-foreground">
          Your data has been validated and is ready for processing
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalRecords}</div>
            <div className="text-sm text-muted-foreground">Total Records</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="text-2xl font-bold text-success">{stats.validRecords}</div>
            <div className="text-sm text-muted-foreground">Valid Records</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <div className="text-2xl font-bold text-warning">{stats.warningRecords}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-2xl font-bold text-destructive">{stats.errorRecords}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Validation Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Data Quality</span>
              <span className="font-medium">{validationRate.toFixed(1)}%</span>
            </div>
            <Progress value={validationRate} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {stats.validRecords} out of {stats.totalRecords} records are ready for import
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {issues.slice(0, 10).map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 mt-0.5">
                    {issue.type === 'error' ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : issue.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        Row {issue.row}
                      </Badge>
                      <span className="text-sm font-medium">{issue.field}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.message}</p>
                    {issue.value && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        Value: "{issue.value}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {issues.length > 10 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  And {issues.length - 10} more issues...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Mode Selection */}
      {showDownloadSelector && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Choose Upload Method
            </CardTitle>
            <CardDescription>
              Download the file or upload directly to your Odoo database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant={uploadMode === 'download' ? 'default' : 'outline'}
                onClick={() => setUploadMode('download')}
                className="h-auto p-6 flex-col gap-2"
              >
                <Download className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Download File</div>
                  <div className="text-xs text-muted-foreground">Export and import manually</div>
                </div>
              </Button>
              
              <Button
                variant={uploadMode === 'odoo' ? 'default' : 'outline'}
                onClick={() => {
                  if (!odooConfig) {
                    setShowOdooConfig(true);
                  } else {
                    setUploadMode('odoo');
                  }
                }}
                className="h-auto p-6 flex-col gap-2"
              >
                <Database className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Upload to Odoo</div>
                  <div className="text-xs text-muted-foreground">Direct database upload</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Odoo Configuration Modal */}
      {showOdooConfig && (
        <div className="mt-6">
          <OdooConfig
            onConfigSave={handleOdooConfigSave}
            initialConfig={odooConfig}
          />
        </div>
      )}

      {/* Upload Actions */}
      {showDownloadSelector && uploadMode === 'download' && (
        <DownloadSelector
          validRecords={validRecords}
          mappings={mappings}
          stats={stats}
          onDownloadComplete={onNext}
        />
      )}

      {showDownloadSelector && uploadMode === 'odoo' && odooConfig && (
        <OdooUploader
          config={odooConfig}
          data={validRecords}
          mappings={mappings}
          onUploadComplete={handleOdooUploadComplete}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={isProcessing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Mapping
        </Button>
        
        {odooConfig && uploadMode === 'odoo' && (
          <Button
            onClick={() => setShowOdooConfig(true)}
            variant="ghost"
            size="sm"
          >
            Edit Odoo Config
          </Button>
        )}
        
        {!showDownloadSelector && (
          <Button 
            onClick={onNext}
            size="lg"
            disabled={isProcessing}
            className="min-w-48 bg-gradient-primary text-primary-foreground"
          >
            {isProcessing ? "Processing..." : "Continue"}
          </Button>
        )}
      </div>
    </div>
  );
};