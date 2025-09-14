import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/Logo';
import OdooConfig from '@/components/OdooConfig';
import OdooUploader from '@/components/OdooUploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Database, Upload, User, LogOut, Settings, Trash2, Edit, CheckCircle } from 'lucide-react';

interface OdooConfiguration {
  id: string;
  name: string;
  url: string;
  database: string;
  username: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ParsedData {
  headers: string[];
  data: any[][];
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  isNewField: boolean;
  dataPreview: string[];
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [configurations, setConfigurations] = useState<OdooConfiguration[]>([]);
  const [activeConfig, setActiveConfig] = useState<OdooConfiguration | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<OdooConfiguration | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load user's Odoo configurations
  useEffect(() => {
    if (user) {
      loadConfigurations();
    }
  }, [user]);

  const loadConfigurations = async () => {
    try {
      // Using any type to bypass TypeScript errors until migration is run
      const { data, error } = await (supabase as any)
        .from('odoo_configurations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConfigurations(data || []);
      
      // Set the first active configuration as default
      const active = data?.find((config: any) => config.is_active);
      if (active) {
        setActiveConfig(active);
      }
    } catch (error) {
      toast({
        title: "Failed to load configurations",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleConfigSave = async (config: any) => {
    try {
      if (editingConfig) {
        // Update existing configuration
        const { error } = await (supabase as any)
          .from('odoo_configurations')
          .update({
            name: config.name,
            url: config.url,
            database: config.database,
            username: config.username,
            api_key: config.apiKey,
          })
          .eq('id', editingConfig.id);

        if (error) throw error;

        toast({
          title: "Configuration updated",
          description: `${config.name} has been updated successfully.`
        });
      } else {
        // Create new configuration
        const { error } = await (supabase as any)
          .from('odoo_configurations')
          .insert({
            user_id: user?.id,
            name: config.name,
            url: config.url,
            database: config.database,
            username: config.username,
            api_key: config.apiKey,
            is_active: configurations.length === 0, // First config is active by default
          });

        if (error) throw error;

        toast({
          title: "Configuration saved",
          description: `${config.name} has been saved successfully.`
        });
      }

      setShowConfigForm(false);
      setEditingConfig(null);
      loadConfigurations();
    } catch (error) {
      toast({
        title: "Failed to save configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleSetActive = async (configId: string) => {
    try {
      // Deactivate all configurations
      await (supabase as any)
        .from('odoo_configurations')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      // Activate selected configuration
      const { error } = await (supabase as any)
        .from('odoo_configurations')
        .update({ is_active: true })
        .eq('id', configId);

      if (error) throw error;

      loadConfigurations();
      toast({
        title: "Active configuration updated",
        description: "Configuration has been set as active."
      });
    } catch (error) {
      toast({
        title: "Failed to update configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('odoo_configurations')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: "Configuration deleted",
        description: "Configuration has been deleted successfully."
      });

      loadConfigurations();
    } catch (error) {
      toast({
        title: "Failed to delete configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || loadingConfigs) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="border-b border-primary/10 bg-gradient-card backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Lead Mapper Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your Odoo integrations
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Configuration Management */}
        <div className="space-y-8">
          {/* Configurations Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Odoo Configurations</h2>
                <p className="text-muted-foreground">
                  Manage your Odoo database connections
                </p>
              </div>
              <Button
                onClick={() => setShowConfigForm(true)}
                className="bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-hero transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Configuration
              </Button>
            </div>

            {/* Configurations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configurations.map((config) => (
                <Card key={config.id} className="bg-gradient-card border-primary/10 shadow-card hover:shadow-elegant transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                        {config.is_active && (
                          <Badge variant="secondary" className="bg-success-light text-success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">Database:</span> {config.database}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">User:</span> {config.username}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex gap-2 flex-wrap">
                      {!config.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActive(config.id)}
                          className="flex-1"
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingConfig(config);
                          setShowConfigForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfig(config.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {configurations.length === 0 && (
              <Card className="bg-gradient-card border-primary/10 shadow-card text-center py-12">
                <CardContent>
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No configurations yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first Odoo configuration to get started
                  </p>
                  <Button
                    onClick={() => setShowConfigForm(true)}
                    className="bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-hero transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Configuration
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Data Upload Section */}
          {activeConfig && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Data Upload</h2>
                  <p className="text-muted-foreground">
                    Upload and transform your lead data for {activeConfig.name}
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Use Lead Mapper
                </Button>
              </div>

              <Card className="bg-gradient-card border-primary/10 shadow-card">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <Upload className="w-16 h-16 text-primary mx-auto" />
                    <h3 className="text-xl font-semibold">Ready to Upload</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Use the Lead Mapper tool to transform and upload your lead data directly to {activeConfig.name}
                    </p>
                    <Button
                      onClick={() => navigate('/')}
                      className="bg-gradient-accent text-accent-foreground shadow-accent hover:shadow-hero transition-all duration-300"
                    >
                      Start Upload Process
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Form Modal */}
      {showConfigForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-card rounded-2xl shadow-hero border border-primary/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowConfigForm(false);
                    setEditingConfig(null);
                  }}
                >
                  ×
                </Button>
              </div>
              
              <OdooConfig
                onConfigSave={handleConfigSave}
                initialConfig={editingConfig ? {
                  name: editingConfig.name,
                  url: editingConfig.url,
                  database: editingConfig.database,
                  username: editingConfig.username,
                  apiKey: editingConfig.api_key,
                } : null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;