import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Cookie, Settings, Info } from 'lucide-react';

const Cookies = () => {
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
              <Cookie className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Cookie Policy
              </h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Minimal Cookie Usage</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="w-6 h-6 text-primary" />
                1. What Are Cookies?
              </h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and improving our service functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Cookies We Use</h2>
              <p className="text-muted-foreground mb-4">
                Lead Mapper Pro uses minimal cookies, focusing only on essential functionality:
              </p>
              
              <div className="space-y-4">
                <div className="bg-card border border-primary/10 rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Essential Cookies
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Required for basic website functionality
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 ml-4">
                    <li>Session management for file processing</li>
                    <li>Security tokens for secure operations</li>
                    <li>Basic error handling and recovery</li>
                  </ul>
                </div>

                <div className="bg-card border border-primary/10 rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Analytics Cookies
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Help us understand how our service is used
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 ml-4">
                    <li>Basic usage statistics (anonymous)</li>
                    <li>Performance monitoring</li>
                    <li>Error tracking for service improvement</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. What We Don't Use</h2>
              <div className="bg-success/5 border border-success/20 rounded-xl p-6">
                <p className="text-muted-foreground mb-4">
                  We explicitly do NOT use:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Third-party advertising cookies</li>
                  <li>Social media tracking cookies</li>
                  <li>Cross-site tracking mechanisms</li>
                  <li>Persistent user identification</li>
                  <li>Behavioral profiling cookies</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Cookie Management</h2>
              <p className="text-muted-foreground mb-4">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Block all cookies:</strong> Most browsers allow you to refuse all cookies</li>
                <li><strong>Delete cookies:</strong> You can delete existing cookies from your browser</li>
                <li><strong>Selective blocking:</strong> Choose which types of cookies to accept</li>
                <li><strong>Incognito mode:</strong> Use private browsing to prevent cookie storage</li>
              </ul>
              <p className="text-muted-foreground mt-4 text-sm italic">
                Note: Blocking essential cookies may affect the functionality of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Browser-Specific Instructions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card border border-primary/10 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2">Chrome</h3>
                  <p className="text-muted-foreground text-sm">
                    Settings → Privacy and Security → Cookies and other site data
                  </p>
                </div>
                <div className="bg-card border border-primary/10 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2">Firefox</h3>
                  <p className="text-muted-foreground text-sm">
                    Settings → Privacy & Security → Cookies and Site Data
                  </p>
                </div>
                <div className="bg-card border border-primary/10 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2">Safari</h3>
                  <p className="text-muted-foreground text-sm">
                    Preferences → Privacy → Manage Website Data
                  </p>
                </div>
                <div className="bg-card border border-primary/10 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2">Edge</h3>
                  <p className="text-muted-foreground text-sm">
                    Settings → Cookies and site permissions → Cookies and site data
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Updates to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this cookie policy to reflect changes in our practices or applicable laws. Any updates will be posted on this page with a revised date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Questions?</h2>
              <p className="text-muted-foreground">
                If you have questions about our use of cookies, please contact us through the information provided on our main website.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-primary/10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Cookie className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-primary">
                Minimal, transparent cookie usage
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Designed with privacy and functionality in mind
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cookies;