export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a href="#/" className="font-semibold text-white">
            Klins
          </a>
          <a
            href="#/dashboard"
            className="text-sm text-neutral-400 transition-colors hover:text-white"
          >
            Dashboard
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-24">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Landing page
        </h1>
        <p className="mt-4 text-neutral-400">Start building here.</p>
      </main>
    </div>
  );
}
