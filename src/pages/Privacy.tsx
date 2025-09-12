import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-card/80 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-gradient-card rounded-3xl shadow-hero p-8 md:p-12 border border-primary/10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-success" />
              <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Privacy Policy
              </h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 rounded-full bg-success/10 border border-success/20">
              <Lock className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Your Privacy is Protected</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                1. Information We Collect
              </h2>
              <p className="text-muted-foreground mb-4">
                Lead Mapper Pro is designed with privacy in mind. We collect minimal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>File Data:</strong> The files you upload for processing (processed temporarily only)</li>
                <li><strong>Usage Analytics:</strong> Basic usage statistics to improve our service</li>
                <li><strong>Technical Data:</strong> Browser type, IP address for security and functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                2. How We Use Your Data
              </h2>
              <p className="text-muted-foreground mb-4">
                Your data is used exclusively for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Processing and transforming your lead data as requested</li>
                <li>Providing AI-powered field mapping and validation</li>
                <li>Generating downloadable files in your chosen format</li>
                <li>Improving our service quality and performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-success" />
                3. Data Security and Retention
              </h2>
              <div className="bg-success/5 border border-success/20 rounded-xl p-6 mb-4">
                <h3 className="font-semibold text-success mb-2">🔒 Zero Permanent Storage</h3>
                <p className="text-muted-foreground text-sm">
                  Your uploaded files are processed in memory and automatically deleted after processing. We do not store your business data permanently.
                </p>
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Files are processed temporarily during your session</li>
                <li>Data is automatically purged after processing completion</li>
                <li>All connections use industry-standard encryption (HTTPS)</li>
                <li>No long-term storage of your business information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                We use select third-party services to provide our functionality:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>AI Processing:</strong> Groq AI for intelligent field mapping (data processed securely)</li>
                <li><strong>Analytics:</strong> Basic usage analytics for service improvement</li>
                <li><strong>Hosting:</strong> Secure cloud hosting providers with enterprise-grade security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Know what data we process (as outlined in this policy)</li>
                <li>Request information about our data practices</li>
                <li>Use our service without creating accounts or providing personal information</li>
                <li>Contact us with privacy concerns or questions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use minimal cookies and tracking technologies only for essential functionality and basic analytics. No personal data is tracked or stored in cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this privacy policy or our data practices, please contact us through our LinkedIn profile or the contact information provided on our website.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-primary/10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-success" />
              <p className="text-sm font-semibold text-success">
                Your data privacy is our commitment
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Built with privacy-first principles for the Odoo ecosystem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;