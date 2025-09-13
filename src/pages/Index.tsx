import React, { useState, useCallback, useMemo } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { MappingView } from '@/components/MappingView';
import { ValidationResults } from '@/components/ValidationResults';
import { ProgressStepper } from '@/components/ProgressStepper';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { GroqService } from '@/services/groqService';
import { FileProcessor, ParsedData } from '@/services/fileProcessor';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedDataProcessing } from '@/hooks/useOptimizedDataProcessing';
import { Sparkles, Shield, Zap } from 'lucide-react';
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
interface ValidationStats {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  warningRecords: number;
  duplicateRecords: number;
}
const Index = () => {
  const {
    toast
  } = useToast();
  const {
    debounce
  } = useOptimizedDataProcessing();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [validationResults, setValidationResults] = useState<{
    validRecords: any[];
    issues: ValidationIssue[];
    stats: ValidationStats;
  } | null>(null);

  // Memoized file upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await FileProcessor.processFile(file);
      setParsedData(data);
      toast({
        title: "File uploaded successfully",
        description: `Processed ${data.data.length - 1} records from ${file.name}`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // Memoized mapping handler with debouncing
  const handleStartMapping = useCallback(async () => {
    if (!parsedData) return;
    setIsProcessing(true);
    setCurrentStep(1);
    try {
      const fieldMappings = await GroqService.analyzeAndMapFields(parsedData.data);
      setMappings(fieldMappings);

      // Check if AI mapping was successful or if we're using fallback
      const hasHighConfidenceMappings = fieldMappings.some(m => m.confidence >= 85);
      toast({
        title: hasHighConfidenceMappings ? "AI mapping complete" : "Smart mapping applied",
        description: hasHighConfidenceMappings ? `Mapped ${fieldMappings.length} fields with AI analysis` : `Applied automatic mapping for ${fieldMappings.length} fields. Review and edit as needed.`,
        variant: hasHighConfidenceMappings ? "default" : "default"
      });
    } catch (error) {
      // This should rarely happen now since we have fallback in the service
      toast({
        title: "Mapping service error",
        description: "Please try again or contact support if the issue persists",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [parsedData, toast]);

  // Memoized validation handler
  const handleValidateData = useCallback(async () => {
    if (!parsedData || !mappings.length) return;
    setIsProcessing(true);
    try {
      // Transform data according to mappings
      const transformedData = parsedData.data.slice(1).map(row => {
        const record: any = {};
        mappings.forEach(mapping => {
          const sourceIndex = parsedData.headers.indexOf(mapping.sourceField);
          if (sourceIndex >= 0) {
            record[mapping.targetField] = row[sourceIndex] || '';
          }
        });
        return record;
      });
      const results = await GroqService.validateData(transformedData);
      setValidationResults(results);
      setCurrentStep(2); // Move to validation results step with download

      toast({
        title: "Validation complete",
        description: `${results.stats.validRecords} valid records out of ${results.stats.totalRecords} total - Ready for download!`
      });
    } catch (error) {
      toast({
        title: "Validation failed",
        description: error instanceof Error ? error.message : "Failed to validate data",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [parsedData, mappings, toast]);

  // Memoized download completion handler
  const handleDownloadComplete = useCallback(() => {
    setCurrentStep(3); // Move to success step

    toast({
      title: "Download successful!",
      description: `Your CRM file is ready for Odoo import with ${validationResults?.stats.validRecords} records`
    });
  }, [validationResults, toast]);

  // Memoized edit mapping handler
  const handleEditMapping = useCallback((index: number, updatedMapping: FieldMapping) => {
    const updatedMappings = [...mappings];
    updatedMappings[index] = updatedMapping;
    setMappings(updatedMappings);
    toast({
      title: "Mapping updated",
      description: `${updatedMapping.sourceField} → ${updatedMapping.targetField}`
    });
  }, [mappings, toast]);

  // Memoized back handlers
  const handleBackToMapping = useCallback(() => {
    setCurrentStep(1); // Go back to mapping step
  }, []);

  // Memoized reset handler
  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setParsedData(null);
    setMappings([]);
    setValidationResults(null);
  }, []);

  // Memoize step content to prevent unnecessary re-renders
  const stepContent = useMemo(() => {
    if (currentStep === 0) {
      return <FileUpload onFileUpload={handleFileUpload} onNext={handleStartMapping} isProcessing={isProcessing} />;
    }
    if (currentStep === 1 && mappings.length > 0) {
      return <MappingView mappings={mappings} onEditMapping={handleEditMapping} onNext={handleValidateData} onBack={() => setCurrentStep(0)} isProcessing={isProcessing} />;
    }
    if (currentStep === 2 && validationResults) {
      return <ValidationResults stats={validationResults.stats} issues={validationResults.issues} onNext={handleDownloadComplete} onBack={handleBackToMapping} isProcessing={isProcessing} validRecords={validationResults.validRecords} mappings={mappings} />;
    }
    if (currentStep === 3) {
      return <div className="text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-accent flex items-center justify-center shadow-hero">
                <svg className="w-12 h-12 text-accent-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 p-2 bg-success rounded-full shadow-lg">
                <Sparkles className="w-4 h-4 text-success-foreground" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              Perfect! Your Data is Ready
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Your leads have been successfully processed and are ready for use in your Odoo CRM system.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <button onClick={handleReset} className="px-6 py-3 bg-gradient-primary text-primary-foreground rounded-xl font-medium shadow-elegant hover:shadow-hero transition-all duration-300 hover:scale-105">
              Process Another File
            </button>
            <span className="text-sm text-muted-foreground">
              Ready for more data transformation magic?
            </span>
          </div>
        </div>;
    }
    return null;
  }, [currentStep, mappings, validationResults, isProcessing, handleFileUpload, handleStartMapping, handleEditMapping, handleValidateData, handleDownloadComplete, handleBackToMapping, handleReset]);
  return <div className="min-h-screen bg-gradient-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="relative z-10">
          {/* Navigation Bar */}
          <nav className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light/20 border border-primary/20">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Enterprise Ready</span>
                </div>
              </div>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-12 space-y-6">
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-accent text-accent-foreground text-sm font-medium shadow-accent">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Data Transformation • 100% FREE
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
                Transform Your Leads
                <br />
                <span className="text-3xl md:text-4xl">into Odoo CRM Gold</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Experience the most intelligent lead data transformation platform. 
                Upload any file format and watch our advanced AI create perfect Odoo CRM imports with zero configuration.
              </p>

               <div className="flex flex-wrap justify-center gap-4 mt-8">
                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-card border">
                   <Zap className="w-4 h-4 text-primary" />
                   <span className="text-sm font-medium">Lightning Fast</span>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-card border">
                   <Shield className="w-4 h-4 text-success" />
                   <span className="text-sm font-medium">99.9% Accuracy</span>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-card border">
                   <Sparkles className="w-4 h-4 text-primary" />
                   <span className="text-sm font-medium">Smart Mapping</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="container mx-auto px-4 pb-16 max-w-5xl">
        {/* Progress Stepper */}
        <div className="mb-12">
          <ProgressStepper currentStep={currentStep} />
        </div>

        {/* Main Content Card */}
        <div className="bg-gradient-card rounded-3xl shadow-hero p-8 md:p-12 border border-primary/10 backdrop-blur-sm">
          {stepContent}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Advanced AI Technology</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                <span>Enterprise Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Odoo CRM Optimized</span>
              </div>
            </div>
            
            {/* Amazing Tool Description */}
            <div className="mt-8 p-8 bg-gradient-card rounded-2xl border border-primary/10 shadow-elegant max-w-4xl mx-auto">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    What is Lead Mapper Pro?
                  </h2>
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      <h3 className="font-semibold text-lg">Upload Any File</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Drop your messy CSV, Excel, or any data file. No matter how chaotic your lead data is, we handle it all.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      <h3 className="font-semibold text-lg">AI Magic Happens</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Our smart AI analyzes your data, maps fields automatically, and cleans everything perfectly for Odoo CRM.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      <h3 className="font-semibold text-lg">Perfect Import</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Download your perfectly formatted file and import directly into Odoo CRM. It just works!
                    </p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-primary/10">
                  <p className="text-lg font-medium text-center text-muted-foreground">
                    Transform hours of manual work into 
                    <span className="text-primary font-bold"> 3 simple clicks</span>
                    ✨
                  </p>
                </div>
              </div>
            </div>
            
            {/* Professional separator */}
            <div className="w-32 h-px bg-gradient-primary opacity-40"></div>
            
            {/* Developer Attribution - Premium Style */}
            <div className="space-y-6">
              <div className="relative">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-2xl rounded-3xl"></div>
                
                {/* Main developer card */}
                <div className="relative bg-gradient-card backdrop-blur-sm border border-primary/20 rounded-2xl p-6 shadow-hero">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-primary animate-pulse"></div>
                      <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
                        Created by
                      </span>
                      <div className="w-2 h-2 rounded-full bg-gradient-primary animate-pulse"></div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                      <div className="text-center md:text-left">
                        <h3 className="text-2xl md:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                          Devarsh Patel
                        </h3>
                        <p className="text-sm text-primary/70 font-medium">
                          Sales Consultant at Odoo ERP
                        </p>
                      </div>
                      
                      <a href="https://www.linkedin.com/in/it-devarsh-patel/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        Connect on LinkedIn
                      </a>
                    </div>
                    
                    
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground/60 max-w-md mx-auto">
                Built with ❤️ for the Odoo ecosystem. Transform your lead data with confidence and precision.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>;
};
export default Index;