"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { partnerOffers, type PartnerOffer } from "@/data/partner-offers";
import { trackEvent } from "@/lib/analytics/events";

const categoryLabels: Record<PartnerOffer["category"], string> = {
  legal: "Legal & Medicaid",
  financial: "Financial Planning",
  home_modification: "Home Upgrades",
  alert_devices: "Safety Devices",
  care_management: "Care Managers",
  relocation: "Relocation Support",
};

export function PartnerGrid({
  category,
  onPartnerClick,
}: {
  category?: PartnerOffer["category"];
  onPartnerClick?: (partner: PartnerOffer) => void;
}) {
  const partners = category
    ? partnerOffers.filter((partner) => partner.category === category)
    : partnerOffers;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {partners.map((partner) => (
        <Card key={partner.id} className="flex h-full flex-col justify-between border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit bg-sunset-orange/15 text-sunset-orange">
              {categoryLabels[partner.category]}
            </Badge>
            <h3 className="text-lg font-semibold text-slate-900">{partner.name}</h3>
            <p className="text-sm text-slate-600">{partner.description}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {partner.commissionNotes}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button
              asChild
              size="sm"
              className="bg-sunset-orange hover:bg-sunset-orange/90"
              onClick={() => {
                trackEvent("partner_cta_click", { partner_id: partner.id, category: partner.category });
                onPartnerClick?.(partner);
              }}
            >
              <Link href={partner.ctaUrl} target="_blank" rel="noreferrer">
                {partner.ctaLabel}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500"
              onClick={() => {
                trackEvent("partner_learn_more", { partner_id: partner.id, category: partner.category });
                onPartnerClick?.(partner);
              }}
            >
              Learn more
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
