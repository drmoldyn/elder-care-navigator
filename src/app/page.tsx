"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState("");
  const [insurance, setInsurance] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just navigate to the navigator flow
    // In the future, we can pre-populate the navigator with these values
    router.push('/navigator');
  };

  const toggleNeed = (needId: string) => {
    setNeeds(prev =>
      prev.includes(needId)
        ? prev.filter(n => n !== needId)
        : [...prev, needId]
    );
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Hero Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-7.jpg"
          alt="Diverse group of seniors laughing together at sunset"
          fill
          priority
          className="object-cover"
          quality={90}
        />
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-sunset-orange/20 via-sky-blue/30 to-lavender/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />

        {/* Decorative transparent columns on left and right */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-lavender/40 via-lavender/25 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-sky-blue/40 via-sky-blue/25 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-10 text-white">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight drop-shadow-lg">
            Find the right care for your loved one
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-95 max-w-2xl mx-auto font-normal drop-shadow-md">
            Search senior care options including home health, assisted living, and skilled nursing by location and insurance coverage
          </p>

          {/* Trust Bar */}
          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">✓</span>
              <span>Medicare.gov verified data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">✓</span>
              <span>59,000+ facilities nationwide</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">✓</span>
              <span>Updated daily</span>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm text-gray-900 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Start your search</h2>

          <div className="space-y-5">
            {/* ZIP Code */}
            <div>
              <label htmlFor="zip" className="block text-sm font-semibold text-gray-700 mb-2">
                Where are you looking?
              </label>
              <input
                type="text"
                id="zip"
                placeholder="Enter ZIP code"
                maxLength={5}
                pattern="[0-9]{5}"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full px-5 py-3.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sunset-orange/50 focus:border-sunset-orange transition-all shadow-sm hover:border-gray-400 bg-white"
              />
            </div>

            {/* Insurance */}
            <div>
              <label htmlFor="insurance" className="block text-sm font-semibold text-gray-700 mb-2">
                What insurance do they have?
              </label>
              <select
                id="insurance"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                className="w-full px-5 py-3.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sunset-orange/50 focus:border-sunset-orange transition-all shadow-sm hover:border-gray-400 bg-white appearance-none cursor-pointer"
                style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em'}}
              >
                <option value="">Select insurance type</option>
                <option value="medicare">Medicare</option>
                <option value="medicaid">Medicaid</option>
                <option value="va">VA Benefits</option>
                <option value="private">Private Insurance</option>
                <option value="private-pay">Private Pay</option>
              </select>
            </div>

            {/* Care Needs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What help do they need? <span className="font-normal text-gray-500">(Select all that apply)</span>
              </label>
              <div className="space-y-3">
                {[
                  { id: "memory", label: "Memory issues (dementia, Alzheimer's)" },
                  { id: "medical", label: "Medical care (recent hospital stay)" },
                  { id: "daily", label: "Daily tasks (bathing, dressing, meals)" },
                  { id: "companion", label: "Companionship and social activities" },
                ].map((need) => (
                  <div
                    key={need.id}
                    className="flex items-center p-4 border border-gray-300 rounded-xl hover:border-sunset-orange hover:bg-sunset-orange/5 transition-all cursor-pointer shadow-sm"
                  >
                    <input
                      type="checkbox"
                      id={need.id}
                      name="needs"
                      value={need.id}
                      checked={needs.includes(need.id)}
                      onChange={() => toggleNeed(need.id)}
                      className="w-5 h-5 text-sunset-orange border-gray-300 rounded focus:ring-sunset-orange/50 cursor-pointer"
                    />
                    <label htmlFor={need.id} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer flex-1">
                      {need.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 italic">
                We&apos;ll match you with facilities that specialize in these areas
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-sunset-orange to-sunset-gold hover:from-sunset-gold hover:to-sunset-orange text-white font-semibold py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
              >
                Find Facilities
              </button>
              <button
                type="button"
                onClick={() => router.push('/navigator?view=map')}
                className="w-full bg-sky-blue hover:bg-sky-blue/90 text-white font-semibold py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Search on Map
              </button>
            </div>
          </div>

          {/* Crisis Banner */}
          <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
            <strong className="block text-red-900 text-sm font-semibold mb-1">
              Need urgent placement?
            </strong>
            <Link
              href="/urgent-placement"
              className="text-red-600 font-semibold text-sm hover:underline"
            >
              Hospital discharge in 72 hours? Get help →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
