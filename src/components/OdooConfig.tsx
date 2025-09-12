import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Database, Key, Globe, User } from 'lucide-react';
import { OdooService, type OdooConfig } from '@/services/odooService';

interface OdooConfigProps {
  onConfigSave: (config: OdooConfig) => void;
  initialConfig?: OdooConfig | null;
}

export default function OdooConfig({ onConfigSave, initialConfig }: OdooConfigProps) {
  const [config, setConfig] = useState<OdooConfig>({
    url: initialConfig?.url || '',
    database: initialConfig?.database || '',
    username: initialConfig?.username || '',
    apiKey: initialConfig?.apiKey || ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = (field: keyof OdooConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!config.url || !config.database || !config.username || !config.apiKey) {
      setTestResult({ success: false, message: 'Please fill in all fields' });
      return;
    }

    setTesting(true);
    try {
      const result = await OdooService.testConnection(config);
      setTestResult(result);
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Test failed' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (testResult?.success) {
      onConfigSave(config);
    } else {
      setTestResult({ success: false, message: 'Please test connection first' });
    }
  };

  const isFormValid = config.url && config.database && config.username && config.apiKey;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configure Odoo Connection
        </CardTitle>
        <CardDescription>
          Set up your Odoo database connection to upload leads directly from this platform.
          You'll need an API key from your Odoo settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Odoo URL
            </Label>
            <Input
              id="url"
              placeholder="https://your-domain.odoo.com"
              value={config.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Name
            </Label>
            <Input
              id="database"
              placeholder="your-database"
              value={config.database}
              onChange={(e) => handleInputChange('database', e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Username
            </Label>
            <Input
              id="username"
              placeholder="your-username"
              value={config.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="your-api-key"
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
            />
          </div>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleTestConnection}
            disabled={!isFormValid || testing}
            variant="outline"
            className="flex-1"
          >
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Test Connection
          </Button>
          <Button
            onClick={handleSave}
            disabled={!testResult?.success}
            className="flex-1"
          >
            Save Configuration
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">How to get your API Key:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to your Odoo Settings → Account Security</li>
            <li>Scroll down to "API Keys" section</li>
            <li>Click "New API Key"</li>
            <li>Enter a description (e.g., "Lead Mapper Integration")</li>
            <li>Set validity duration and click "Generate Key"</li>
            <li>Copy the generated key and paste it above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}