import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { OdooService, type OdooConfig, type OdooUploadResult } from '@/services/odooService';

interface OdooUploaderProps {
  config: OdooConfig;
  data: any[];
  mappings: any[];
  onUploadComplete: (result: OdooUploadResult) => void;
}

export default function OdooUploader({ config, data, mappings, onUploadComplete }: OdooUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<OdooUploadResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await OdooService.uploadLeads(config, data, mappings);
      setProgress(100);
      setUploadResult(result);
      onUploadComplete(result);
    } catch (error) {
      const errorResult: OdooUploadResult = {
        success: false,
        uploadedCount: 0,
        errors: [error instanceof Error ? error.message : 'Upload failed']
      };
      setUploadResult(errorResult);
      onUploadComplete(errorResult);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Upload to Odoo
        </CardTitle>
        <CardDescription>
          Upload {data.length} leads directly to your Odoo database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Connection Details:</p>
            <div className="text-sm text-muted-foreground">
              <p>URL: {config.url}</p>
              <p>Database: {config.database}</p>
              <p>User: {config.username}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Upload Summary:</p>
            <div className="text-sm text-muted-foreground">
              <p>Total Records: {data.length}</p>
              <p>Mapped Fields: {mappings.filter(m => !m.isNewField).length}</p>
              <p>Custom Fields: {mappings.filter(m => m.isNewField).length}</p>
            </div>
          </div>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading leads...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {uploadResult && (
          <Alert variant={uploadResult.success ? "default" : "destructive"}>
            {uploadResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {uploadResult.success ? (
                <div>
                  <p>Successfully uploaded {uploadResult.uploadedCount} leads to Odoo!</p>
                  {uploadResult.errors.length > 0 && (
                    <p className="mt-2 text-sm">
                      {uploadResult.errors.length} warnings/errors occurred during upload.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p>Upload failed. Please check your configuration and try again.</p>
                  {uploadResult.errors.length > 0 && (
                    <div className="mt-2 text-sm">
                      <p>Errors:</p>
                      <ul className="list-disc list-inside">
                        {uploadResult.errors.slice(0, 3).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {uploadResult.errors.length > 3 && (
                          <li>... and {uploadResult.errors.length - 3} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={uploading || data.length === 0}
            className="flex-1"
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload to Odoo
          </Button>
          
          {uploadResult?.success && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {uploadResult.uploadedCount} uploaded
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> Standard fields (Name, Email, Phone, etc.) will be mapped to corresponding Odoo fields. 
          Any unmapped custom fields will be added to the Notes/Comments field.</p>
        </div>
      </CardContent>
    </Card>
  );
}