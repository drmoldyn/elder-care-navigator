import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Elder Care Navigator
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="#mission" className="hover:text-foreground">
            Mission
          </Link>
          <Link href="#how-it-works" className="hover:text-foreground">
            How it Works
          </Link>
          <Link href="#contact" className="hover:text-foreground">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
