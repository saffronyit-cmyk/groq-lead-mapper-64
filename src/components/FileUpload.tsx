import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onNext: () => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onNext, isProcessing }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setUploadStatus('success');
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Upload Your Leads Data
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Upload your Excel or CSV file and let our AI create perfect Odoo CRM field mappings instantly
        </p>
      </div>

      <Card className="border-2 border-dashed border-primary/20 bg-gradient-card transition-all duration-300 hover:shadow-card hover:border-primary/30">
        <CardContent className="p-10">
          <div
            {...getRootProps()}
            className={cn(
              "cursor-pointer transition-all duration-300 rounded-2xl p-12 text-center space-y-6",
              isDragActive ? "bg-primary/10 border-primary/30 scale-[1.02]" : "hover:bg-muted/30",
              uploadStatus === 'success' && "bg-success/10 border-success/30"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex justify-center">
              {uploadStatus === 'success' ? (
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center shadow-accent">
                    <CheckCircle className="h-10 w-10 text-accent-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center">
                    <span className="text-xs text-success-foreground">✓</span>
                  </div>
                </div>
              ) : uploadStatus === 'error' ? (
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/20">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
              ) : (
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isDragActive 
                    ? "bg-primary/10 border-primary/30 text-primary scale-110" 
                    : "bg-muted/50 border-muted text-muted-foreground hover:border-primary/20 hover:bg-primary/5"
                )}>
                  <Upload className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              {uploadedFile ? (
                <>
                  <div className="flex items-center justify-center gap-3 text-success">
                    <div className="p-2 rounded-lg bg-success/10">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-lg block">{uploadedFile.name}</span>
                      <span className="text-sm text-success/80">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for processing
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-foreground">
                      {isDragActive ? "Perfect! Drop it right here" : "Drop your file here or click to browse"}
                    </p>
                    <p className="text-muted-foreground">
                      Supports CSV, XLS, and XLSX files • Maximum size: 10MB
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">.CSV</span>
                    <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">.XLS</span>
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">.XLSX</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadedFile && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={onNext}
            variant="hero"
            size="lg"
            disabled={isProcessing}
            className="min-w-56 group"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processing File...
              </>
            ) : (
              <>
                <span>Start AI Mapping</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};