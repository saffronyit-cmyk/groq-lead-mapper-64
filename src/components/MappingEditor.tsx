import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus } from 'lucide-react';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  isNewField: boolean;
  dataPreview: string[];
}

interface MappingEditorProps {
  isOpen: boolean;
  onClose: () => void;
  mapping: FieldMapping | null;
  onSave: (updatedMapping: FieldMapping) => void;
}

const ODOO_TEMPLATE_FIELDS = [
  'External ID', 'Name', 'Company Name', 'Contact Name', 'Email', 'Job Position', 
  'Phone', 'Mobile', 'Street', 'Street2', 'City', 'State', 'Zip', 'Country', 
  'Website', 'Notes', 'medium_id', 'source_id', 'referred', 'campaign_id'
];

export const MappingEditor: React.FC<MappingEditorProps> = ({ 
  isOpen, 
  onClose, 
  mapping, 
  onSave 
}) => {
  const [selectedTarget, setSelectedTarget] = useState(mapping?.targetField || '');
  const [isNewField, setIsNewField] = useState(mapping?.isNewField || false);

  const handleSave = () => {
    if (!mapping) return;
    
    const updatedMapping: FieldMapping = {
      ...mapping,
      targetField: selectedTarget,
      isNewField: !ODOO_TEMPLATE_FIELDS.includes(selectedTarget),
      confidence: ODOO_TEMPLATE_FIELDS.includes(selectedTarget) ? 95 : 75
    };
    
    onSave(updatedMapping);
    onClose();
  };

  const getFieldDescription = (field: string): string => {
    const descriptions: Record<string, string> = {
      'External ID': 'Unique identifier for external systems',
      'Name': 'Primary contact or lead name',
      'Company Name': 'Organization or business name',
      'Contact Name': 'Additional contact person',
      'Email': 'Primary email address',
      'Job Position': 'Role or title',
      'Phone': 'Primary phone number',
      'Mobile': 'Mobile phone number',
      'Street': 'Street address',
      'Street2': 'Additional address line',
      'City': 'City name',
      'State': 'State or province',
      'Zip': 'Postal code',
      'Country': 'Country name',
      'Website': 'Company website URL',
      'Notes': 'Additional notes or comments',
      'medium_id': 'Marketing medium or channel',
      'source_id': 'Lead source or origin',
      'referred': 'Referral information',
      'campaign_id': 'Marketing campaign identifier'
    };
    return descriptions[field] || '';
  };

  if (!mapping) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Field Mapping</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how to map the source field to your CRM
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg">
            <div className="flex-1">
              <span className="font-semibold text-foreground text-lg">{mapping.sourceField}</span>
              <div className="text-sm text-muted-foreground mt-1">Source field from your data</div>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Source Data
            </Badge>
          </div>
          
          {mapping.dataPreview.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-foreground">Sample Data Preview</Label>
              <div className="mt-2 p-4 bg-gradient-to-r from-muted/30 to-muted/20 border border-muted rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {mapping.dataPreview.map((value, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-accent/10 text-accent">
                      {value}
                    </Badge>
                  ))}
                </div>
                {mapping.dataPreview.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">No sample data available</span>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Label htmlFor="target-field" className="text-sm font-medium text-foreground">
              Map to CRM Field
            </Label>
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger className="w-full h-12 border-2 border-muted focus:border-primary">
                <SelectValue placeholder="Choose target CRM field..." />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <div className="p-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Standard CRM Fields</div>
                  {ODOO_TEMPLATE_FIELDS.map((field) => (
                    <SelectItem key={field} value={field} className="py-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{field}</span>
                        {getFieldDescription(field) && (
                          <span className="text-xs text-muted-foreground">{getFieldDescription(field)}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="border-t my-2"></div>
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Custom Fields</div>
                  <SelectItem value={mapping.sourceField} className="py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">Create New Field: {mapping.sourceField}</span>
                      <span className="text-xs text-muted-foreground">Add as custom field to your CRM</span>
                    </div>
                  </SelectItem>
                </div>
              </SelectContent>
            </Select>
          </div>
          
          {selectedTarget && !ODOO_TEMPLATE_FIELDS.includes(selectedTarget) && (
            <div className="p-4 bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Custom Field Creation</div>
                  <div className="text-sm text-muted-foreground">
                    This will create a new custom field in your CRM system
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedTarget}
            className="bg-primary hover:bg-primary/90"
          >
            Save Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};