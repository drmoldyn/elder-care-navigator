export function Footer() {
  return (
    <footer
      id="contact"
      className="border-t border-border bg-muted/40 py-6 text-sm text-muted-foreground"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} SunsetWell.com</p>
        <p>
          Built to support caregivers of aging loved ones near and far.
        </p>
      </div>
    </footer>
  );
}
