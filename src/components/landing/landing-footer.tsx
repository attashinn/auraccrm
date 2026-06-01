import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: ["Leads", "Deals", "Tasks", "Organizations", "Dashboard"],
  },
  {
    title: "Resources",
    links: ["Help center", "Documentation", "Blog", "API"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact", "Security"],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-surface border-t border-border pt-16 pb-10">
      <div className="landing-container">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 pb-12 border-b border-border">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            AuraCRM
          </Link>
          <div className="flex gap-3 text-sm text-muted">
            {["X", "LinkedIn", "YouTube"].map((s) => (
              <span
                key={s}
                className="h-9 min-w-[72px] px-3 rounded-full border border-dashed border-border bg-[#F4F5F1] flex items-center justify-center text-[10px] font-semibold uppercase"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 py-12">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#pricing" className="text-sm text-muted hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-8 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} AuraCRM. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#faq">Privacy</a>
            <a href="#faq">Terms</a>
            <a href="#faq">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
