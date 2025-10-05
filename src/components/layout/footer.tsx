export function Footer() {
  return (
    <footer
      id="contact"
      className="border-t border-border bg-muted/40 py-6 text-sm text-muted-foreground"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Elder Care Navigator.</p>
        <p>
          Built to support families caring for loved ones with dementia from a
          distance.
        </p>
      </div>
    </footer>
  );
}
