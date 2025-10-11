export default function ProDashboardPage() {
  const mockCaseload = [
    { name: "Anderson Family", status: "Tour scheduled", due: "Oct 12" },
    { name: "Lopez Family", status: "Awaiting facility feedback", due: "Oct 13" },
    { name: "Nguyen Family", status: "Needs Medicaid planner intro", due: "Oct 15" },
  ];

  const mockInsights = [
    { label: "Active cases", value: "7" },
    { label: "Facilities engaged this week", value: "12" },
    { label: "Average placement time", value: "4.2 days" },
  ];

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col gap-8 px-6 py-14 bg-gradient-to-br from-lavender/10 via-white to-sky-blue/10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-sunset-orange">SunsetWell Professional</p>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900">Care coordinator workspace</h1>
        <p className="text-lg text-gray-600">
          Save client caseloads, track facility outreach, and export compliance-ready placement reports.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {mockInsights.map((insight) => (
          <div key={insight.label} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <p className="text-sm text-slate-500">{insight.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{insight.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Caseload overview</h2>
          <button className="rounded-lg bg-sunset-orange px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sunset-orange/90">
            Add client
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next step</th>
              </tr>
            </thead>
            <tbody>
              {mockCaseload.map((row) => (
                <tr key={row.name} className="border-t bg-white/80">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-4 py-3 text-slate-600">{row.status}</td>
                  <td className="px-4 py-3 text-slate-500">Due {row.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-lavender/60 bg-lavender/10 p-6 text-sm text-slate-700">
        <h3 className="text-lg font-semibold text-slate-900">Roadmap</h3>
        <p className="mt-2">
          Upcoming features include placement templates, secure document sharing, and billing integrations for team-based access.
        </p>
      </section>
    </main>
  );
}
