"use client";

import { Button } from "@/components/ui/button";
import { trackLandingPageCTA } from "@/lib/analytics/events";
import Link from "next/link";
import { type ReactNode } from "react";

interface TrackedCTAButtonProps {
  href: string;
  landingPage: string;
  ctaPosition: "hero" | "mid-page" | "footer";
  children: ReactNode;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function TrackedCTAButton({
  href,
  landingPage,
  ctaPosition,
  children,
  size = "lg",
  variant = "default",
  className = "",
}: TrackedCTAButtonProps) {
  const handleClick = () => {
    trackLandingPageCTA({
      landingPage,
      ctaPosition,
      ctaText: typeof children === "string" ? children : "CTA Button",
      destination: href,
    });
  };

  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={href} onClick={handleClick}>
        {children}
      </Link>
    </Button>
  );
}
