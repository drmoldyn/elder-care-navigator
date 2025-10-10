"use client";

import Link from "next/link";
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
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">

      <div className="relative z-10 max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight">
            Find the right care for your loved one
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-95 max-w-2xl mx-auto font-normal">
            Search verified nursing homes and assisted living facilities by location and insurance coverage
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
        <form onSubmit={handleSubmit} className="bg-white text-gray-900 rounded-2xl shadow-2xl p-8 md:p-10 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-6">Start your search</h2>

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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all bg-white"
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
                    className="flex items-center p-3 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={need.id}
                      name="needs"
                      value={need.id}
                      checked={needs.includes(need.id)}
                      onChange={() => toggleNeed(need.id)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor={need.id} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer flex-1">
                      {need.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 italic">
                We'll match you with facilities that specialize in these areas
              </p>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Find Facilities
            </button>
          </div>

          {/* Crisis Banner */}
          <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
            <strong className="block text-red-900 text-sm font-semibold mb-1">
              🚨 Need urgent placement?
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
