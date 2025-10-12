import Link from "next/link";
import type { Metadata } from "next";
import metros from "../../../data/top-50-metros.json" assert { type: "json" };

export const metadata: Metadata = {
  title: "Top 50 SNF Metros | SunsetWell",
  description: "Explore the top 50 U.S. metro areas by population with skilled nursing facility rankings based on SunsetWell scores.",
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function MetrosIndexPage() {
  const list = (metros as Array<{ name: string; city: string; state: string }>);
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="font-serif text-3xl font-bold">Top 50 Metros</h1>
      <p className="mt-2 text-slate-600">Choose a metro to view SunsetWell SNF rankings, percentiles, and key quality metrics.</p>
      <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2">
        {list.map((m) => (
          <li key={m.name}>
            <Link className="text-sunset-orange hover:underline" href={`/metros/${slugify(m.name)}`}>
              {m.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

