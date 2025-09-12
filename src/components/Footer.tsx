import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Sparkles, Shield, Zap, Mail, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gradient-card border-t border-primary/10 mt-24">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Transform your lead data with AI precision. Built for the Odoo ecosystem with enterprise-grade security.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary">
              <Sparkles className="w-3 h-3" />
              <span>100% Free Tool</span>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Product</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                <span>AI Field Mapping</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-success" />
                <span>Data Validation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Multiple Formats</span>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Legal</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/terms" className="block hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="block hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="block hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Connect</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a 
                href="https://www.linkedin.com/in/it-devarsh-patel/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                LinkedIn Profile
              </a>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Business Inquiries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Lead Mapper Pro. Built with ❤️ for the Odoo ecosystem.
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span>All systems operational</span>
              </div>
              <span>•</span>
              <span>Enterprise ready</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};