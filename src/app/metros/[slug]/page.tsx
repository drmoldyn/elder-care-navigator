import fs from "fs";
import path from "path";
import type { Metadata } from "next";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MetroData {
  metro: string;
  city: string;
  state: string;
  count: number;
  averageScore: string;
  highPerformerShare: number;
  narrative: string;
  table: Array<{
    rank: number;
    facilityId: string;
    title: string;
    score: number;
    percentile: number;
    health: number | null;
    staffing: number | null;
    quality: number | null;
    rnHours: number | null;
    totalNurseHours: number | null;
  }>;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
  const file = path.join(process.cwd(), "data", "metros", `${slug}.json`);
  if (fs.existsSync(file)) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as MetroData;
    return {
      title: `${raw.metro} SNF Rankings | SunsetWell`,
      description: `Skilled nursing facility rankings for ${raw.metro} with SunsetWell scores, peer-group percentiles, and key CMS quality metrics.`,
    };
  }
  return { title: "Metro Rankings" };
}

export default async function MetroPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const file = path.join(process.cwd(), "data", "metros", `${slug}.json`);
  if (!fs.existsSync(file)) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="font-serif text-2xl font-bold">Rankings not found</h1>
        <p className="mt-2 text-slate-600">We have not generated rankings for this metro yet.</p>
      </main>
    );
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as MetroData;
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="font-serif text-3xl font-bold">{data.metro} — {data.count} SNFs</h1>
      <p className="mt-2 text-slate-700">Average SunsetWell Score: <strong>{data.averageScore}</strong> • High-performing share (≥ 75): <strong>{data.highPerformerShare}%</strong></p>
      <p className="mt-4 text-slate-700 leading-relaxed">{data.narrative}</p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Facility</th>
              <th className="px-3 py-2 text-right">SunsetWell</th>
              <th className="px-3 py-2 text-right">Percentile</th>
              <th className="px-3 py-2 text-right">Health</th>
              <th className="px-3 py-2 text-right">Staffing</th>
              <th className="px-3 py-2 text-right">Quality</th>
              <th className="px-3 py-2 text-right">RN hrs</th>
              <th className="px-3 py-2 text-right">Total nurse hrs</th>
            </tr>
          </thead>
          <tbody>
            {data.table.map((row) => (
              <tr key={row.facilityId} className="border-t">
                <td className="px-3 py-2">{row.rank}</td>
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2 text-right">{row.score}</td>
                <td className="px-3 py-2 text-right">{row.percentile}th</td>
                <td className="px-3 py-2 text-right">{row.health ?? '—'}</td>
                <td className="px-3 py-2 text-right">{row.staffing ?? '—'}</td>
                <td className="px-3 py-2 text-right">{row.quality ?? '—'}</td>
                <td className="px-3 py-2 text-right">{row.rnHours ?? '—'}</td>
                <td className="px-3 py-2 text-right">{row.totalNurseHours ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

