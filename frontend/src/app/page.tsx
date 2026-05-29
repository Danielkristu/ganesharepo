import Link from "next/link";
import { BookOpen, Video, Search, ArrowRight, GraduationCap } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-zinc-800" size={24} />
            <span className="text-lg font-medium tracking-tight text-zinc-900">
              Ganesha Repository
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/repository" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              Repository
            </Link>
            <Link href="/webinar" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              Webinars
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-md text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8 bg-zinc-100 text-zinc-600 border border-zinc-200">
          ITB Academic Portal
        </div>

        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6 max-w-4xl leading-tight text-zinc-900">
          Knowledge at your fingertips
        </h1>

        <p className="text-lg max-w-xl mb-10 text-zinc-500">
          Discover academic papers, theses, and attend live webinars from
          Institut Teknologi Bandung&apos;s brightest minds.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/repository"
            className="flex items-center gap-2 px-6 py-3 rounded-md font-medium text-sm transition-all bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <BookOpen size={18} />
            Browse Repository
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/webinar"
            className="flex items-center gap-2 px-6 py-3 rounded-md font-medium text-sm transition-all bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50"
          >
            <Video size={18} />
            Join a Webinar
          </Link>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6 w-full">
        {[
          {
            icon: <Search size={22} className="text-zinc-600" />,
            title: "Smart Search",
            desc: "Search theses and papers by ITB faculty and major.",
          },
          {
            icon: <Video size={22} className="text-zinc-600" />,
            title: "Live Webinars",
            desc: "Join conferences with real-time Q&A and participation.",
          },
          {
            icon: <BookOpen size={22} className="text-zinc-600" />,
            title: "PDF Analysis",
            desc: "AI-powered keyword extraction and summaries.",
          },
        ].map((card) => (
          <div key={card.title} className="clean-card p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-zinc-100 border border-zinc-200">
              {card.icon}
            </div>
            <h3 className="font-medium text-zinc-900">{card.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Ganesha Repository — Institut Teknologi Bandung
      </footer>
    </main>
  );
}
