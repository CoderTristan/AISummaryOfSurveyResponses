"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border py-12 px-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Site Info */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-blue-500">One-Question Surveys</h2>
          <p className="text-muted-foreground text-sm">
            Simple, fast, and effective surveys to gather insights from your audience.
          </p>
        </div>

        {/* Site Links */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg text-blue-500">Quick Links</h3>
          <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/overview" className="text-muted-foreground hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
            FAQ
          </Link>
        </div>

        {/* Legal Links */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg text-blue-500">Legal</h3>
          <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
            Cookie Policy
          </Link>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="mt-10 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} One-Question Surveys. All rights reserved.
      </div>
    </footer>
  );
}
