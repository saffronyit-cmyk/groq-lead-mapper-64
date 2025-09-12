import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DownloadSelector } from '@/components/DownloadSelector';

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
  const validationRate = (stats.validRecords / stats.totalRecords) * 100;
  const showDownloadSelector = validRecords.length > 0 && mappings.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Data Validation Complete</h2>
        <p className="text-muted-foreground">
          Your CRM data has been processed and validated. Review the results below.
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

      {/* Download Selector or Action Buttons */}
      {showDownloadSelector ? (
        <div className="space-y-6">
          <div className="flex justify-center">
            <Button 
              onClick={onBack}
              variant="outline"
              size="lg"
            >
              Back to Mapping
            </Button>
          </div>
          
          <DownloadSelector
            validRecords={validRecords}
            mappings={mappings}
            stats={stats}
            onDownloadComplete={onNext}
          />
        </div>
      ) : (
        <div className="flex justify-center gap-4">
          <Button 
            onClick={onBack}
            variant="outline"
            size="lg"
          >
            Back to Mapping
          </Button>
          
          <Button 
            onClick={onNext}
            size="lg"
            disabled={isProcessing}
            className="min-w-48 bg-gradient-primary text-primary-foreground"
          >
            {isProcessing ? "Processing..." : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
};