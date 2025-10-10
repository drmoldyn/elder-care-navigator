"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight font-serif">
          Elder Care Navigator
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/navigator" className="hover:text-foreground">
            Find Facilities
          </Link>
          <Link href="/urgent-placement" className="hover:text-foreground">
            Urgent Help
          </Link>
          <Link href="#contact" className="hover:text-foreground">
            Contact
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col px-4 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-base hover:text-foreground text-muted-foreground"
            >
              🏠 Home
            </Link>
            <Link
              href="/navigator"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-base hover:text-foreground text-muted-foreground"
            >
              🔍 Find Facilities
            </Link>
            <Link
              href="/urgent-placement"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-base hover:text-foreground text-muted-foreground"
            >
              🚨 Urgent Help
            </Link>
            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-base hover:text-foreground text-muted-foreground"
            >
              📞 Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
