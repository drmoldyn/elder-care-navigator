"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';

interface MetricData {
  facility_id: string;
  title: string;
  provider_type: string;
  state: string;
  overall_rating: number | null;
  health_inspection_rating: number | null;
  staffing_rating: number | null;
  quality_measure_rating: number | null;
  rn_staffing_hours_per_resident_per_day: number | null;
  total_nurse_staffing_hours_per_resident_per_day: number | null;
  total_weighted_health_survey_score: number | null;
  number_of_substantiated_complaints: number | null;
  number_of_fines: number | null;
  number_of_facility_reported_incidents: number | null;
}

interface Stats {
  mean: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

export default function MetricsPage() {
  const [facilities, setFacilities] = useState<MetricData[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>("overall_rating");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [states, setStates] = useState<string[]>([]);

  const metrics = [
    { key: "overall_rating", label: "CMS Overall Rating", type: "rating", section: "CMS Ratings" },
    { key: "health_inspection_rating", label: "Health Inspection Rating", type: "rating", section: "CMS Ratings" },
    { key: "staffing_rating", label: "Staffing Rating", type: "rating", section: "CMS Ratings" },
    { key: "quality_measure_rating", label: "Quality Measures Rating", type: "rating", section: "CMS Ratings" },
    { key: "rn_staffing_hours_per_resident_per_day", label: "RN Staffing Hours/Resident/Day", type: "numeric", section: "Staffing Metrics" },
    { key: "total_nurse_staffing_hours_per_resident_per_day", label: "Total Nurse Hours/Resident/Day", type: "numeric", section: "Staffing Metrics" },
    { key: "total_weighted_health_survey_score", label: "Health Survey Score", type: "numeric", section: "Safety & Compliance" },
    { key: "number_of_substantiated_complaints", label: "Substantiated Complaints", type: "numeric", section: "Safety & Compliance" },
    { key: "number_of_fines", label: "Number of Fines", type: "numeric", section: "Safety & Compliance" },
    { key: "number_of_facility_reported_incidents", label: "Facility Reported Incidents", type: "numeric", section: "Safety & Compliance" },
  ];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  async function loadData() {
    if (!supabaseBrowser) {
      console.error("Supabase client not available");
      return;
    }

    setLoading(true);
    try {
      let query = supabaseBrowser
        .from("resources")
        .select(`
          facility_id,
          title,
          provider_type,
          state,
          overall_rating,
          health_inspection_rating,
          staffing_rating,
          quality_measure_rating,
          rn_staffing_hours_per_resident_per_day,
          total_nurse_staffing_hours_per_resident_per_day,
          total_weighted_health_survey_score,
          number_of_substantiated_complaints,
          number_of_fines,
          number_of_facility_reported_incidents
        `)
        .eq("provider_type", "nursing_home")
        .not("overall_rating", "is", null)
        .limit(1000);

      if (selectedState !== "all") {
        query = query.eq("state", selectedState);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFacilities(data || []);

      // Calculate stats
      if (data) {
        const calculatedStats: Record<string, Stats> = {};
        metrics.forEach((metric) => {
          const values = data
            .map((f: MetricData) => (f as unknown as Record<string, unknown>)[metric.key] as number | null)
            .filter((v): v is number => v !== null && v !== undefined)
            .sort((a: number, b: number) => a - b);

          if (values.length > 0) {
            calculatedStats[metric.key] = {
              mean: values.reduce((a: number, b: number) => a + b, 0) / values.length,
              median: values[Math.floor(values.length / 2)],
              min: values[0],
              max: values[values.length - 1],
              count: values.length,
            };
          }
        });
        setStats(calculatedStats);
      }

      // Get unique states
      const { data: stateData } = await supabaseBrowser
        .from("resources")
        .select("state")
        .eq("provider_type", "nursing_home")
        .not("state", "is", null);

      if (stateData) {
        const uniqueStates = [...new Set(stateData.map((s: { state: string }) => s.state))].sort();
        setStates(uniqueStates as string[]);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  }

  function getPercentile(value: number | null, metricKey: string): number | null {
    if (value === null || !stats[metricKey]) return null;

    const values = facilities
      .map((f: MetricData) => (f as unknown as Record<string, unknown>)[metricKey] as number | null)
      .filter((v): v is number => v !== null && v !== undefined)
      .sort((a: number, b: number) => a - b);

    const index = values.findIndex((v: number) => v >= value);
    if (index === -1) return 100;

    return Math.round((index / values.length) * 100);
  }

  function getDistribution(metricKey: string) {
    const values = facilities
      .map((f: MetricData) => (f as unknown as Record<string, unknown>)[metricKey] as number | null)
      .filter((v): v is number => v !== null && v !== undefined);

    if (values.length === 0) return [];

    const stat = stats[metricKey];
    if (!stat) return [];

    // Create 10 bins
    const binCount = 10;
    const binSize = (stat.max - stat.min) / binCount;
    const bins = Array(binCount).fill(0);

    values.forEach((v: number) => {
      const binIndex = Math.min(Math.floor((v - stat.min) / binSize), binCount - 1);
      bins[binIndex]++;
    });

    const maxBin = Math.max(...bins);
    return bins.map((count) => (count / maxBin) * 100);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">📊</div>
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const selectedMetricInfo = metrics.find((m) => m.key === selectedMetric);
  const selectedStat = stats[selectedMetric];
  const distribution = getDistribution(selectedMetric);

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender/10 via-white to-sky-blue/10 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-4xl font-bold text-gray-900">
            Facility Metrics Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            Visualize and compare facility quality metrics across {facilities.length} nursing homes
          </p>

          {/* SunsetWell Score Info Banner */}
          <div className="rounded-xl bg-gradient-to-r from-sunset-orange/10 to-sunset-gold/10 border border-sunset-orange/20 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              📊 Introducing the SunsetWell Score
            </h2>
            <p className="text-gray-700 mb-3">
              Our <strong>SunsetWell Score</strong> combines multiple quality, staffing, and safety metrics into a single composite score (0-100) that compares facilities fairly within their peer groups.
              Unlike CMS ratings, which apply the same standards nationwide, SunsetWell normalizes metrics by region and facility type, providing true &ldquo;apples-to-apples&rdquo; comparisons.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/60 rounded-lg p-3">
                <div className="font-semibold text-sunset-orange">Inspection & Compliance (53%)</div>
                <div className="text-sm text-gray-600">Health inspection ratings and deficiencies</div>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="font-semibold text-sunset-orange">Staffing (32%)</div>
                <div className="text-sm text-gray-600">RN hours, total nurse hours, and staffing ratings</div>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="font-semibold text-sunset-orange">Safety & Stability (15%)</div>
                <div className="text-sm text-gray-600">Staff turnover, complaints, and incidents</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              <em>Note: Weights are empirically derived from regression analysis predicting safety outcomes. Coming soon to facility pages!</em>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-sunset-orange focus:outline-none focus:ring-2 focus:ring-sunset-orange"
            >
              {/* Group metrics by section */}
              {["CMS Ratings", "Staffing Metrics", "Safety & Compliance"].map((section) => (
                <optgroup key={section} label={section}>
                  {metrics.filter((m) => m.section === section).map((metric) => (
                    <option key={metric.key} value={metric.key}>
                      {metric.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Filter by State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm focus:border-sunset-orange focus:outline-none focus:ring-2 focus:ring-sunset-orange"
            >
              <option value="all">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        {selectedStat && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
            <StatCard label="Mean" value={selectedStat.mean.toFixed(2)} />
            <StatCard label="Median" value={selectedStat.median.toFixed(2)} />
            <StatCard label="Min" value={selectedStat.min.toFixed(2)} />
            <StatCard label="Max" value={selectedStat.max.toFixed(2)} />
            <StatCard label="Count" value={selectedStat.count.toString()} />
          </div>
        )}

        {/* Distribution Chart */}
        {distribution.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Distribution: {selectedMetricInfo?.label}
            </h2>
            <div className="flex h-64 items-end gap-1">
              {distribution.map((height, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-sunset-orange to-sunset-gold"
                  style={{ height: `${height}%` }}
                  title={`Bin ${index + 1}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{selectedStat?.min.toFixed(1)}</span>
              <span>{selectedStat?.max.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Facility Table */}
        <div className="rounded-xl bg-white shadow-md">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Facility Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {selectedMetricInfo?.label}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Percentile
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {facilities.slice(0, 50).map((facility) => {
                  const value = (facility as unknown as Record<string, unknown>)[selectedMetric] as number | null;
                  const percentile = getPercentile(value, selectedMetric);

                  return (
                    <tr key={facility.facility_id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {facility.title}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {facility.state}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {value !== null ? value.toFixed(2) : "N/A"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {percentile !== null ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              percentile >= 75
                                ? "bg-green-100 text-green-800"
                                : percentile >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {percentile}th
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-md">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
