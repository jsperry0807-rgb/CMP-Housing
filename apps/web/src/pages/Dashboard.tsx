const navItems = ["Overview", "Projects", "Settings"];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-800 lg:flex">
        <div className="flex h-16 items-center border-b border-neutral-800 px-6">
          <a href="#/" className="font-semibold text-white">
            Klins
          </a>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item, index) => (
            <a
              key={item}
              href="#/dashboard"
              aria-current={index === 0 ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                index === 0
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-neutral-800 px-6">
          <h1 className="font-semibold text-white">Overview</h1>
        </header>

        <main className="flex-1 p-6">
          <p className="text-neutral-400">Dashboard content goes here.</p>
        </main>
      </div>
    </div>
  );
}
