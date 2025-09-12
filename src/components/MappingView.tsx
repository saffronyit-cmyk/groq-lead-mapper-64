import React, { useState, useCallback, useMemo } from 'react';
import { CheckCircle, ArrowRight, Edit3, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MappingEditor } from '@/components/MappingEditor';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  isNewField: boolean;
  dataPreview: string[];
}

interface MappingViewProps {
  mappings: FieldMapping[];
  onEditMapping: (index: number, updatedMapping: FieldMapping) => void;
  onNext: () => void;
  onBack?: () => void;
  isProcessing: boolean;
}

// Memoized mapping card component for better performance
const MappingCard = React.memo<{
  mapping: FieldMapping;
  index: number;
  onEditClick: (index: number) => void;
}>(({ mapping, index, onEditClick }) => (
  <Card className="shadow-elegant hover:shadow-hero transition-all duration-300 border-2 hover:border-primary/20">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-3 bg-gradient-to-r from-primary/5 to-accent/5 px-4 py-2 rounded-full border border-primary/20">
                <span className="font-semibold text-foreground text-lg">{mapping.sourceField}</span>
                <ArrowRight className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary text-lg">{mapping.targetField}</span>
              </div>
              {mapping.isNewField && (
                <Badge variant="secondary" className="bg-gradient-accent text-accent-foreground shadow-accent">
                  <Plus className="h-3 w-3 mr-1" />
                  New Field
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-muted-foreground">Confidence:</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    mapping.confidence >= 90 ? 'bg-success' : 
                    mapping.confidence >= 70 ? 'bg-warning' : 'bg-destructive'
                  }`}></div>
                  <div className={`text-sm font-bold ${
                    mapping.confidence >= 90 ? 'text-success' : 
                    mapping.confidence >= 70 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {mapping.confidence}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:col-span-2">
                <div className="text-sm font-medium text-muted-foreground">Sample:</div>
                <div className="flex flex-wrap gap-1">
                  {mapping.dataPreview.slice(0, 2).map((value, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-muted/50">
                      {value}
                    </Badge>
                  ))}
                  {mapping.dataPreview.length > 2 && (
                    <Badge variant="outline" className="text-xs bg-muted/50">
                      +{mapping.dataPreview.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mapping.confidence >= 90 ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-success/10 rounded-full border border-success/20">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">Perfect</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditClick(index)}
              className="border-primary/30 hover:bg-primary/5"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
));

MappingCard.displayName = 'MappingCard';

export const MappingView: React.FC<MappingViewProps> = ({ 
  mappings, 
  onEditMapping, 
  onNext, 
  onBack,
  isProcessing
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingMapping, setEditingMapping] = useState<FieldMapping | null>(null);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleEditClick = useCallback((index: number) => {
    setEditingIndex(index);
    setEditingMapping(mappings[index]);
  }, [mappings]);

  const handleSaveMapping = useCallback((updatedMapping: FieldMapping) => {
    if (editingIndex !== null) {
      onEditMapping(editingIndex, updatedMapping);
    }
    setEditingIndex(null);
    setEditingMapping(null);
  }, [editingIndex, onEditMapping]);

  const handleCloseEditor = useCallback(() => {
    setEditingIndex(null);
    setEditingMapping(null);
  }, []);

  // Memoize computed values
  const stats = useMemo(() => ({
    totalFields: mappings.length,
    highConfidence: mappings.filter(m => m.confidence >= 90).length,
    newFields: mappings.filter(m => m.isNewField).length
  }), [mappings]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            AI Field Mapping Results
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Review how your data fields have been intelligently mapped to the Odoo CRM template. 
            Edit any mappings that need adjustment.
          </p>
        </div>
        
        {/* Stats Summary */}
        <div className="flex flex-wrap justify-center gap-8 text-lg">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-card border border-primary/20 shadow-card">
            <div className="w-4 h-4 rounded-full bg-primary shadow-lg"></div>
            <span className="text-foreground font-semibold">{stats.totalFields} Fields Mapped</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-card border border-success/20 shadow-card">
            <div className="w-4 h-4 rounded-full bg-success shadow-lg"></div>
            <span className="text-foreground font-semibold">
              {stats.highConfidence} High Confidence
            </span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-card border border-accent/20 shadow-card">
            <div className="w-4 h-4 rounded-full bg-accent shadow-lg"></div>
            <span className="text-foreground font-semibold">
              {stats.newFields} New Fields
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {mappings.map((mapping, index) => (
          <MappingCard
            key={`${mapping.sourceField}-${index}`}
            mapping={mapping}
            index={index}
            onEditClick={handleEditClick}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-12">
        <div className="flex gap-4">
          {onBack && (
            <Button 
              onClick={onBack}
              variant="outline"
              size="lg"
              className="flex items-center gap-3 h-16 text-lg border-2 hover:border-primary/30 hover:bg-primary/5"
            >
              Back
            </Button>
          )}
          
          <Button 
            onClick={onNext}
            size="lg"
            disabled={isProcessing}
            className="min-w-80 h-16 text-xl bg-gradient-primary text-primary-foreground shadow-hero hover:shadow-accent transition-all duration-300 hover:scale-105"
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                Validating Data...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span>Validate & Process Data</span>
                <ArrowRight className="h-5 w-5" />
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Confidence Legend */}
      <div className="flex justify-center pt-8">
        <div className="flex flex-wrap items-center gap-8 text-base bg-gradient-card px-8 py-4 rounded-2xl border border-primary/10 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-success shadow-lg"></div>
            <span className="text-muted-foreground font-medium">90%+ Confidence</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-warning shadow-lg"></div>
            <span className="text-muted-foreground font-medium">70-89% Confidence</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-destructive shadow-lg"></div>
            <span className="text-muted-foreground font-medium">Below 70%</span>
          </div>
        </div>
      </div>

      <MappingEditor
        isOpen={editingIndex !== null}
        onClose={handleCloseEditor}
        mapping={editingMapping}
        onSave={handleSaveMapping}
      />
    </div>
  );
};