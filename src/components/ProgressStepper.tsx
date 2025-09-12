import React from 'react';
import { Check, Upload, MapPin, ShieldCheck, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ProgressStepperProps {
  currentStep: number;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep }) => {
  const steps: Step[] = [
    {
      id: 'upload',
      title: 'Upload File',
      description: 'Upload your leads data',
      icon: <Upload className="h-5 w-5" />
    },
    {
      id: 'mapping',
      title: 'AI Mapping',
      description: 'Intelligent field mapping',
      icon: <MapPin className="h-5 w-5" />
    },
    {
      id: 'validation',
      title: 'Validation',
      description: 'Data quality check',
      icon: <ShieldCheck className="h-5 w-5" />
    },
    {
      id: 'download',
      title: 'Download',
      description: 'Get your CRM file',
      icon: <Download className="h-5 w-5" />
    }
  ];

  return (
    <div className="w-full py-12">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gradient-to-r from-border to-border/50 rounded-full z-0">
          <div 
            className="h-full bg-gradient-primary rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center space-y-3 relative z-10 group">
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 relative",
                index < currentStep
                  ? "bg-gradient-primary text-primary-foreground shadow-hero scale-110"
                  : index === currentStep
                  ? "bg-gradient-accent text-accent-foreground shadow-accent scale-110 animate-pulse"
                  : "bg-card text-muted-foreground shadow-card border-2 border-border hover:border-primary/30"
              )}
            >
              {/* Ring animation for current step */}
              {index === currentStep && (
                <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" />
              )}

              {/* Success checkmark animation */}
              {index < currentStep ? (
                <div className="relative">
                  <Check className="h-6 w-6 relative z-10" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                </div>
              ) : (
                <div className="relative">
                  {step.icon}
                  {index === currentStep && (
                    <div className="absolute inset-0 bg-accent/10 rounded-full animate-pulse" />
                  )}
                </div>
              )}
            </div>
            
            <div className="text-center max-w-24">
              <div 
                className={cn(
                  "text-sm font-semibold transition-all duration-300",
                  index <= currentStep 
                    ? "text-foreground" 
                    : "text-muted-foreground group-hover:text-foreground/70"
                )}
              >
                {step.title}
              </div>
              <div 
                className={cn(
                  "text-xs transition-all duration-300 mt-1",
                  index <= currentStep 
                    ? "text-muted-foreground" 
                    : "text-muted-foreground/60 group-hover:text-muted-foreground/80"
                )}
              >
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};