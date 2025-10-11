"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SubmissionStatus = "idle" | "success" | "error";

export default function FacilityPortalPage() {
  const [facilityId, setFacilityId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>("idle");

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [prefStatus, setPrefStatus] = useState<SubmissionStatus>("idle");
  const [prefSubmitting, setPrefSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/facility/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId,
          requesterName: contactName,
          requesterEmail: contactEmail,
          requesterPhone: contactPhone || undefined,
          message: message || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setFacilityId("");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setMessage("");
    } catch (error) {
      console.error("Facility claim submission failed", error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferenceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPrefSubmitting(true);
    setPrefStatus("idle");

    try {
      const response = await fetch("/api/facility/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId,
          notifyEmail,
          notifySms,
          notificationEmail: notifyEmail ? contactEmail || undefined : undefined,
          notificationPhone: notifySms ? contactPhone || undefined : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Preference update failed");
      }

      setPrefStatus("success");
    } catch (error) {
      console.error("Preference update error", error);
      setPrefStatus("error");
    } finally {
      setPrefSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-3.jpg"
          alt="Senior care background"
          fill
          className="object-cover"
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-lavender/30 via-sky-blue/20 to-sunset-orange/20" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
      </div>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col gap-5 md:gap-6 px-4 md:px-6 py-10 md:py-16 relative z-10">
        <header className="space-y-2 md:space-y-3 text-center">
        <p className="text-xs md:text-sm font-medium text-sunset-orange">SunsetWell Partner Portal</p>
        <h1 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-gray-900">Facility Partner Portal</h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          We&apos;re preparing a dedicated workspace where authorized admissions teams can update
          availability, manage leads, and review performance insights.
        </p>
      </header>

      <section className="rounded-2xl border border-dashed border-sunset-orange/40 bg-white/70 p-4 md:p-6 shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold">What&apos;s coming soon</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Claim your facility profile and invite teammates</li>
          <li>• Update open beds and waitlist status in real time</li>
          <li>• Configure how you receive SunsetWell leads and alerts</li>
          <li>• Review placement performance and marketing insights</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-6 shadow-inner">
        <h3 className="text-base md:text-lg font-semibold">Request early access</h3>
        <p className="mt-2 text-sm text-slate-600">
          Share a few details and our partnerships team will reach out as soon as the portal pilot opens.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Facility ID</label>
            <input
              required
              value={facilityId}
              onChange={(event) => setFacilityId(event.target.value)}
              placeholder="Supabase facility UUID"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sunset-orange focus:outline-none focus:ring-2 focus:ring-sunset-orange/30"
            />
            <span className="text-xs text-slate-500">
              Need help finding your facility ID? Email us at
              {" "}
              <Link href="mailto:partners@sunsetwell.com" className="text-sunset-orange hover:underline">
                partners@sunsetwell.com
              </Link>
            </span>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Primary contact name</label>
            <input
              required
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="Your name"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sunset-orange focus:outline-none focus:ring-2 focus:ring-sunset-orange/30"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Work email</label>
            <input
              required
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="name@facility.com"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sunset-orange focus:outline-none focus:ring-2 focus:ring-sunset-orange/30"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Phone (optional)</label>
            <input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="XXX-XXX-XXXX"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-sunset-orange focus:outline-none focus:ring-2 focus:ring-sunset-orange/30"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">How can we help?</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Share any immediate needs (availability updates, lead routing, admissions coverage)."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sunset-orange focus:outline-none focus:ring-2 focus:ring-sunset-orange/30"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-sunset-orange hover:bg-sunset-orange/90">
              {isSubmitting ? "Submitting…" : "Submit claim"}
            </Button>
            {status === "success" && (
              <p className="text-sm text-emerald-600">Request received—we&apos;ll be in touch shortly.</p>
            )}
            {status === "error" && (
              <p className="text-sm text-red-600">Something went wrong. Please try again or email us directly.</p>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 md:p-6 shadow-sm">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">Lead delivery preferences</h3>
        <p className="mt-1 text-sm text-slate-600">
          Customize how SunsetWell notifies your admissions team about new referrals. Preferences can be updated anytime after full portal access is granted.
        </p>

        <form onSubmit={handlePreferenceSubmit} className="mt-6 grid gap-4">
          <div className="flex items-center gap-3">
            <input
              id="notify-email"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sunset-orange focus:ring-sunset-orange/40"
              checked={notifyEmail}
              onChange={(event) => setNotifyEmail(event.target.checked)}
            />
            <label htmlFor="notify-email" className="text-sm text-slate-700">
              Send new leads to {contactEmail || 'your primary email'}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="notify-sms"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sunset-orange focus:ring-sunset-orange/40"
              checked={notifySms}
              onChange={(event) => setNotifySms(event.target.checked)}
            />
            <label htmlFor="notify-sms" className="text-sm text-slate-700">
              Receive urgent leads via text message
            </label>
          </div>

          <Button type="submit" variant="outline" disabled={prefSubmitting} className="w-full sm:w-fit">
            {prefSubmitting ? "Saving…" : "Save preferences"}
          </Button>
          {prefStatus === "success" && (
            <p className="text-sm text-emerald-600">Preferences saved.</p>
          )}
          {prefStatus === "error" && (
            <p className="text-sm text-red-600">Could not update preferences. Try again soon.</p>
          )}
        </form>
      </section>
      </div>
    </main>
  );
}
