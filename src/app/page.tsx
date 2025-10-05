export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-16">
      <section className="flex flex-col gap-6 text-center sm:text-left">
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          MVP in Progress
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Helping families coordinate dementia care from 100+ miles away
        </h1>
        <p className="text-lg text-muted-foreground">
          Elder Care Navigator delivers personalized recommendations from
          trusted medical, legal, and community sources so adult children can
          support parents with early-stage dementia—without feeling overwhelmed
          or alone.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            See how the navigator works
          </a>
          <a
            href="#mission"
            className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            Explore our mission
          </a>
        </div>
      </section>

      <section
        id="mission"
        className="grid gap-6 rounded-xl border border-border bg-card p-8"
      >
        <h2 className="text-2xl font-semibold tracking-tight">
          Built for long-distance caregivers
        </h2>
        <p className="text-muted-foreground">
          We curate and score resources from authoritative partners—NIH,
          Alzheimer&apos;s Association, Mayo Clinic, Area Agencies on Aging—and map
          them to each family&apos;s living situation, urgency, and location. The
          experience combines a simple multi-step intake, an intelligent matching
          layer, and AI-guided action plans powered by Claude Sonnet.
        </p>
      </section>

      <section id="how-it-works" className="grid gap-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          How the navigator will work
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "1. Share your situation",
              description:
                "Answer a focused, skippable intake about symptoms, living arrangement, and urgency.",
            },
            {
              title: "2. Match trusted resources",
              description:
                "Our rule-based engine scores 150+ curated programs, services, and guides against your context.",
            },
            {
              title: "3. Receive guided next steps",
              description:
                "Claude generates a personalized action plan plus follow-up reminders via email (PDF export coming later).",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-muted/30 p-6"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="collaboration-plan"
        className="grid gap-6 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center"
      >
        <h2 className="text-2xl font-semibold tracking-tight">
          Week 1 focus: Laying the foundation
        </h2>
        <p className="text-muted-foreground">
          We&apos;re actively building the data model, matching contracts, and core
          UI scaffolding. Follow the collaboration plan to see daily progress and
          upcoming milestones.
        </p>
        <span className="mx-auto inline-flex items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium text-muted-foreground">
          View updates in COLLABORATION_PLAN.md
        </span>
      </section>
    </div>
  );
}
