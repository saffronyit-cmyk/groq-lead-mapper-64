import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Shield, FileText, Clock } from 'lucide-react';

const Terms = () => {
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
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Terms of Service
              </h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Effective from publication date</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing and using Lead Mapper Pro ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                Lead Mapper Pro is a free web-based tool that helps users transform their lead data for import into Odoo CRM systems. Our service includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>AI-powered field mapping and data transformation</li>
                <li>Data validation and quality checking</li>
                <li>Export capabilities in multiple formats (CSV, XLS, XLSX)</li>
                <li>Odoo CRM-optimized output formatting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Responsibilities</h2>
              <p className="text-muted-foreground mb-4">You agree to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the service only for lawful purposes</li>
                <li>Not upload any malicious, harmful, or inappropriate content</li>
                <li>Respect intellectual property rights</li>
                <li>Not attempt to reverse engineer or disrupt the service</li>
                <li>Ensure you have rights to any data you upload</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Processing and Privacy</h2>
              <p className="text-muted-foreground">
                We process your data solely for the purpose of providing the transformation service. All uploaded data is processed temporarily and is not stored permanently on our servers. For detailed information about data handling, please refer to our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Service Availability</h2>
              <p className="text-muted-foreground">
                While we strive to maintain high availability, we do not guarantee uninterrupted access to the service. We reserve the right to modify, suspend, or discontinue the service at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Lead Mapper Pro is provided "as is" without any warranties. We are not liable for any direct, indirect, incidental, or consequential damages resulting from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these terms, please contact us through our LinkedIn profile or the contact information provided on our main website.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-primary/10 text-center">
            <p className="text-sm text-muted-foreground">
              These terms are governed by applicable laws and regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;