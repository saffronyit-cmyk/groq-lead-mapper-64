import React from 'react';
import { Building2, MapPin, TrendingUp } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizes = {
    sm: { container: 'h-8', icon: 'w-6 h-6', text: 'text-lg' },
    md: { container: 'h-12', icon: 'w-8 h-8', text: 'text-2xl' },
    lg: { container: 'h-16', icon: 'w-12 h-12', text: 'text-4xl' }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Mark */}
      <div className={`${currentSize.container} relative flex items-center justify-center`}>
        <div className="relative">
          {/* Background Circle with Gradient */}
          <div className="absolute inset-0 bg-gradient-hero rounded-2xl shadow-hero opacity-90" />
          
          {/* Icon Container */}
          <div className="relative z-10 p-2 rounded-2xl bg-gradient-hero">
            <div className="relative flex items-center justify-center">
              {/* Main Building/CRM Icon */}
              <Building2 className={`${currentSize.icon} text-primary-foreground relative z-20`} />
              
              {/* Overlay Icons for "Mapping" concept */}
              <MapPin className="w-3 h-3 text-accent-foreground absolute -top-1 -right-1 z-30" />
              <TrendingUp className="w-3 h-3 text-success-foreground absolute -bottom-1 -left-1 z-30" />
            </div>
          </div>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${currentSize.text} font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight`}>
            Lead Mapper
          </h1>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-primary tracking-wider uppercase">PRO</span>
            <span className="text-xs text-muted-foreground">by ODOO</span>
          </div>
        </div>
      )}
    </div>
  );
};