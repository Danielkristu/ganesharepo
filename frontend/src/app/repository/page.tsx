"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search, BookOpen, Download, Loader2,
  X, Eye, FileText, Film, Presentation, ArrowLeft, User,
  ChevronRight, Folder, FolderOpen, Layers, PanelLeftClose, PanelLeftOpen, ExternalLink
} from "lucide-react";
import type { Document } from "@/types";
import dynamic from "next/dynamic";

const CustomPDFViewer = dynamic(
  () => import("@/components/PDFViewer").then((mod) => mod.CustomPDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex justify-center items-center bg-zinc-900">
        <Loader2 className="animate-spin text-zinc-500" />
      </div>
    ),
  }
);

/* ─── Static data ───────────────────────────────────────── */
const FACULTY_TREE: Record<string, string[]> = {
  "FMIPA": ["Matematika", "Fisika", "Astronomi", "Kimia", "Aktuaria"],
  "SITH-S": ["Mikrobiologi", "Biologi"],
  "SF": ["Sains dan Teknologi Farmasi", "Farmasi Klinik dan Komunitas"],
  "FTTM": ["Teknik Pertambangan", "Teknik Perminyakan", "Teknik Geofisika", "Teknik Metalurgi"],
  "FITB": ["Teknik Geologi", "Meteorologi", "Oseanografi", "Teknik Geodesi dan Geomatika"],
  "STEI-R": ["Teknik Elektro", "Teknik Tenaga Listrik", "Teknik Telekomunikasi", "Teknik Biomedis"],
  "FTSL": ["Teknik Sipil", "Teknik Lingkungan", "Teknik Kelautan", "Rekayasa Infrastruktur Lingkungan", "Teknik dan Pengelolaan Sumber Daya Air"],
  "FTI": ["Teknik Kimia", "Teknik Fisika", "Teknik Industri", "Teknik Pangan", "Manajemen Rekayasa", "Teknik Bioenergi dan Kemurgi"],
  "FSRD": ["Seni Rupa", "Kriya", "Desain Interior", "Desain Komunikasi Visual", "Desain Produk"],
  "FTMD": ["Teknik Mesin", "Teknik Dirgantara", "Teknik Material"],
  "STEI-K": ["Teknik Informatika", "Sistem dan Teknologi Informasi"],
  "SBM": ["Manajemen", "Kewirausahaan"],
  "SITH-R": ["Rekayasa Hayati", "Rekayasa Pertanian", "Rekayasa Kehutanan", "Teknologi Pasca Panen"],
  "SAPPK": ["Arsitektur", "Perencanaan Wilayah dan Kota"]
};

const CATEGORIES = ["All", "Thesis", "Paper", "Journal", "Lecture Notes", "Research", "Video Recording"];

/* ─── File helpers ──────────────────────────────────────── */
function getFileType(url: string): "pdf" | "pptx" | "video" | "unknown" {
  const l = url.toLowerCase();
  if (l.includes(".pdf")) return "pdf";
  if (l.includes(".ppt") || l.includes(".pptx")) return "pptx";
  if (l.includes(".mp4") || l.includes(".webm") || l.includes(".mov")) return "video";
  return "unknown";
}
function getFileLabel(type: string) {
  return { pdf: "PDF", pptx: "PPTX", video: "Video", unknown: "File" }[type] ?? "File";
}
function getMaterialLabel(doc: Document) {
  return doc.material_type === "link" ? "Link" : getFileLabel(getFileType(doc.file_url));
}
function getFileIcon(type: string, size = 13) {
  if (type === "pptx") return <Presentation size={size} />;
  if (type === "video") return <Film size={size} />;
  return <FileText size={size} />;
}

/* ─── Sidebar Course Tree ───────────────────────────────── */
function CourseTree({
  documents,
  selectedCourseCode, selectedCategory,
  onSelect
}: {
  documents: Document[];
  selectedCourseCode: string;
  selectedCategory: string;
  onSelect: (courseCode: string, category?: string) => void;
}) {
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());

  const courses = useMemo(() => {
    const map = new Map<string, { name: string, categories: Set<string> }>();
    for (const d of documents) {
      if (!d.course_code) continue;
      if (!map.has(d.course_code)) {
        map.set(d.course_code, { name: d.course_name || "", categories: new Set() });
      }
      if (d.category) {
        map.get(d.course_code)!.categories.add(d.category);
      }
    }
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [documents]);

  const toggleCourse = (code: string) =>
    setOpenCourses(s => { const n = new Set(s); n.has(code) ? n.delete(code) : n.add(code); return n; });

  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <button
        onClick={() => onSelect("", "")}
        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-colors ${
          !selectedCourseCode ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
        }`}
      >
        <Layers size={15} className="shrink-0 text-zinc-400" />
        <span>All Courses</span>
      </button>

      <div className="h-px bg-zinc-100 my-2" />

      {courses.map(([code, info]) => {
        const open = openCourses.has(code);
        const activeCourse = selectedCourseCode === code && !selectedCategory;
        const categories = Array.from(info.categories).sort();

        return (
          <div key={code}>
            <div className={`flex items-start gap-1 rounded-lg transition-colors ${activeCourse ? "bg-zinc-100" : "hover:bg-zinc-50"}`}>
              <button
                onClick={() => toggleCourse(code)}
                className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors rounded-lg shrink-0 mt-0.5"
              >
                <ChevronRight size={13} className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`} />
              </button>
              <button
                onClick={() => { onSelect(code, ""); if (!open) toggleCourse(code); }}
                className={`flex-1 flex flex-col py-2 pr-3 text-left ${activeCourse ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"}`}
              >
                <span className="font-semibold text-[13px]">{code}</span>
                <span className="text-[11px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">{info.name}</span>
              </button>
            </div>

            {open && categories.length > 0 && (
              <div className="ml-4 pl-3 border-l border-zinc-100 mt-0.5 mb-1 flex flex-col gap-0.5">
                {categories.map(cat => {
                  const catActive = selectedCourseCode === code && selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => onSelect(code, cat)}
                      className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-colors ${
                        catActive
                          ? "bg-zinc-900 text-white font-medium"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                      }`}
                    >
                      <FileText size={12} className={catActive ? "text-zinc-300" : "text-zinc-400"} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Breadcrumb ────────────────────────────────────────── */
function Breadcrumb({
  courseCode, category, onReset
}: {
  courseCode: string; category: string; onReset: () => void;
}) {
  const sep = <ChevronRight size={12} className="text-zinc-300 shrink-0" />;
  const items = [
    { label: "Repository", active: !courseCode },
    ...(courseCode ? [{ label: courseCode, active: !category }] : []),
    ...(category ? [{ label: category, active: true }] : [])
  ];

  return (
    <nav className="flex items-center gap-1.5 text-[13px]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && sep}
          <span className={item.active ? "font-semibold text-zinc-900" : "font-medium text-zinc-400 hover:text-zinc-700 transition-colors"}>
            {i === 0 ? (
              <button onClick={onReset}>{item.label}</button>
            ) : item.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

/* ─── Major Setup Modal (Option C — one-time onboarding) ── */
function MajorSetupModal({ onSave }: { onSave: (faculty: string, major: string) => void }) {
  const [faculty, setFaculty] = useState("");
  const [major, setMajor]   = useState("");

  const majors = faculty ? FACULTY_TREE[faculty] ?? [] : [];

  function handleSave() {
    if (!faculty) return;
    onSave(faculty, major);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center mb-2">
            <BookOpen size={18} className="text-white" />
          </div>
          <h2 className="text-[18px] font-bold text-zinc-900">Change your view</h2>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            Select a faculty and major to browse their materials. This is a view preference only — your account context stays the same.
          </p>
        </div>

        {/* Faculty */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-zinc-600 uppercase tracking-wide">Faculty / School</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(FACULTY_TREE).map(f => (
              <button
                key={f}
                onClick={() => { setFaculty(f); setMajor(""); }}
                className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all ${
                  faculty === f
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Major */}
        {faculty && majors.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold text-zinc-600 uppercase tracking-wide">Major / Program</label>
            <div className="flex flex-col gap-1.5">
              {majors.map(m => (
                <button
                  key={m}
                  onClick={() => setMajor(m)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[13px] border transition-all ${
                    major === m
                      ? "bg-zinc-900 text-white border-zinc-900 font-medium"
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={!faculty}
            className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save & Continue
          </button>
          <button
            onClick={() => onSave("", "")}
            className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500 border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            Reset to my major
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── File Viewer ───────────────────────────────────────── */
function FileViewer({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const fileType = getFileType(doc.file_url);
  const isLinkMaterial = doc.material_type === "link";
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(9,9,11,0.92)" }}>
      <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{doc.title}</p>
            <p className="text-xs text-zinc-500 truncate mt-0.5">{doc.author} · {doc.category} · {doc.year ?? "N/A"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/api/repository/view?url=${encodeURIComponent(doc.file_url)}`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-900 text-xs font-medium hover:bg-zinc-100 transition-colors"
          >
            <Download size={13} /> Download
          </a>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLinkMaterial ? (
          <div className="flex flex-col h-full bg-white">
            <iframe 
              src={(function(url) {
                try {
                  const parsed = new URL(url);
                  if (parsed.hostname.includes("youtube.com") && parsed.searchParams.has("v")) {
                    return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
                  }
                  if (parsed.hostname === "youtu.be") {
                    return `https://www.youtube.com/embed${parsed.pathname}`;
                  }
                  return url;
                } catch {
                  return url;
                }
              })(doc.file_url)} 
              className="w-full h-full border-0 bg-white" 
              title={doc.title} 
            />
            <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500 truncate">External link preview</p>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors">
                <ExternalLink size={15} /> Open link
              </a>
            </div>
          </div>
        ) : fileType === "pdf" ? (
          <CustomPDFViewer url={`/api/repository/view?url=${encodeURIComponent(doc.file_url)}`} />
        ) : fileType === "pptx" ? (
          <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + "/api/repository/view?url=" + encodeURIComponent(doc.file_url))}`} className="w-full h-full border-0" title={doc.title} />
        ) : fileType === "video" ? (
          <div className="flex items-center justify-center h-full bg-black">
            <video src={`/api/repository/view?url=${encodeURIComponent(doc.file_url)}`} controls autoPlay className="max-w-full max-h-full" style={{ maxHeight: "calc(100vh - 56px)" }} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
            <FileText size={56} className="text-zinc-700" />
            <p className="text-sm">Preview not available for this file type.</p>
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-100 transition-colors">
              <Download size={15} /> Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Document Card ─────────────────────────────────────── */
function DocumentCard({ doc, onView }: { doc: Document; onView: (d: Document) => void }) {
  const ft = getFileType(doc.file_url);
  const publishBadge = doc.publish_mode && doc.publish_mode !== "public";

  const ytThumbnail = useMemo(() => {
    if (doc.material_type !== "link") return null;
    try {
      const parsed = new URL(doc.file_url);
      if (parsed.hostname.includes("youtube.com") && parsed.searchParams.has("v")) {
        return `https://img.youtube.com/vi/${parsed.searchParams.get("v")}/hqdefault.jpg`;
      }
      if (parsed.hostname === "youtu.be") {
        return `https://img.youtube.com/vi${parsed.pathname}/hqdefault.jpg`;
      }
    } catch {}
    return null;
  }, [doc.material_type, doc.file_url]);

  const resolvedThumbnailUrl = doc.thumbnail_url 
    ? (doc.thumbnail_url.includes(".r2.cloudflarestorage.com") 
        ? `/api/repository/view?url=${encodeURIComponent(doc.thumbnail_url)}` 
        : doc.thumbnail_url)
    : ytThumbnail;

  const [imgSrc, setImgSrc] = useState(resolvedThumbnailUrl);

  return (
    <article
      onClick={() => onView(doc)}
      className="group bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-3.5 cursor-pointer hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/60 transition-all duration-200"
    >
      {imgSrc ? (
        <div className="relative overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 aspect-video">
          <Image 
            src={imgSrc} 
            alt={doc.title} 
            fill 
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" 
            unoptimized 
            onError={() => {
              if (imgSrc === resolvedThumbnailUrl && ytThumbnail) {
                setImgSrc(ytThumbnail);
              } else {
                setImgSrc(null);
              }
            }}
          />
        </div>
      ) : null}

      {/* Badges row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
            {doc.material_type === "link" ? <ExternalLink size={13} /> : getFileIcon(ft)} {getMaterialLabel(doc)}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
            {doc.category}
          </span>
          {doc.faculty && (
            <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-blue-50 text-blue-500 border border-blue-100">
              {doc.faculty}
            </span>
          )}
          {doc.course_code && (
            <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-green-50 text-green-600 border border-green-100" title={doc.course_name}>
              {doc.course_code} - {doc.course_name}
            </span>
          )}
          {publishBadge && (
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
              doc.publish_mode === "student"
                ? "bg-violet-50 text-violet-500 border-violet-100"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}>
              {doc.publish_mode === "student" ? "Student" : "Faculty"}
            </span>
          )}
        </div>
        {doc.year && (
          <span className="text-[11px] font-medium text-zinc-400 shrink-0 tabular-nums">{doc.year}</span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-[15px] font-semibold leading-snug line-clamp-2 text-zinc-900 group-hover:text-zinc-600 transition-colors">
        {doc.title}
      </h2>

      {/* Abstract */}
      <p className="text-[13px] line-clamp-2 text-zinc-400 leading-relaxed flex-1">
        {doc.abstract || "No abstract available."}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100">
        <div className="flex items-center gap-2 text-[13px] text-zinc-500 min-w-0">
          <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
            <User size={11} className="text-zinc-400" />
          </div>
          <span className="truncate">{doc.author}</span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onView(doc); }}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-zinc-50 transition-all shrink-0"
        >
          <Eye size={13} /> View
        </button>
      </div>
    </article>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function RepositoryPage() {
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Saved context (Option C — persisted in localStorage)
  const [ctxFaculty, setCtxFaculty] = useState("");
  const [ctxMajor, setCtxMajor]     = useState("");

  // Optional year override pill
  const [selYear, setSelYear] = useState("");

  // Sidebar selection
  const [selCourse, setSelCourse] = useState("");
  const [selCategory, setSelCategory] = useState("");
  const router = useRouter();

  // Default sidebarOpen to false on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Auth check + auto-personalize from ganesha_user
  useEffect(() => {
    const token = localStorage.getItem("ganesha_token");
    if (!token) { router.push("/student-login"); return; }

    // Try to load saved context override first (user manually changed preference)
    const savedCtx = localStorage.getItem("ganesha_context");
    if (savedCtx) {
      try {
        const { faculty, major } = JSON.parse(savedCtx);
        setCtxFaculty(faculty || "");
        setCtxMajor(major || "");
        return;
      } catch { /* fall through to user identity */ }
    }

    // Auto-personalize from logged-in user identity
    const rawUser = localStorage.getItem("ganesha_user");
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser) as { faculty?: string; major?: string };
        setCtxFaculty(user.faculty || "");
        setCtxMajor(user.major || "");
      } catch { /* ignore */ }
    }
  }, [router]);

  function handleSetupSave(faculty: string, major: string) {
    if (faculty) {
      localStorage.setItem("ganesha_context", JSON.stringify({ faculty, major }));
      setCtxFaculty(faculty);
      setCtxMajor(major);
    } else {
      // Skipped — revert to user identity
      localStorage.removeItem("ganesha_context");
      const rawUser = localStorage.getItem("ganesha_user");
      if (rawUser) {
        try {
          const user = JSON.parse(rawUser) as { faculty?: string; major?: string };
          setCtxFaculty(user.faculty || "");
          setCtxMajor(user.major || "");
        } catch { /* ignore */ }
      }
    }
    setShowSetupModal(false);
  }

  function clearContext() {
    // Reset to original user identity
    localStorage.removeItem("ganesha_context");
    const rawUser = localStorage.getItem("ganesha_user");
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser) as { faculty?: string; major?: string };
        setCtxFaculty(user.faculty || "");
        setCtxMajor(user.major || "");
      } catch { setCtxFaculty(""); setCtxMajor(""); }
    } else {
      setCtxFaculty(""); setCtxMajor("");
    }
    setSelCourse(""); setSelCategory(""); setSelYear("");
  }

  const years = useMemo(() => [...new Set(allDocs.map(d => d.year).filter(Boolean) as number[])].sort((a,b) => b - a), [allDocs]);

  // Filter by saved context + optional year (passed to sidebar CourseTree)
  const topFilteredDocs = useMemo(() => allDocs.filter(doc => {
    if (selYear && String(doc.year) !== selYear) return false;
    if (ctxFaculty && doc.faculty !== ctxFaculty) return false;
    if (ctxMajor && doc.major !== ctxMajor) return false;
    return true;
  }), [allDocs, selYear, ctxFaculty, ctxMajor]);

  // Final filtered documents for grid
  const documents = useMemo(() => topFilteredDocs.filter(doc => {
    if (selCourse && doc.course_code !== selCourse) return false;
    if (selCategory && doc.category !== selCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return doc.title.toLowerCase().includes(q) || doc.author.toLowerCase().includes(q) || (doc.abstract?.toLowerCase().includes(q) ?? false);
    }
    return true;
  }), [topFilteredDocs, selCourse, selCategory, search]);

  const fetchDocs = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("ganesha_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/proxy/repository/documents", { headers });
      if (res.status === 401) {
        localStorage.removeItem("ganesha_token");
        router.push("/student-login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load documents");
      setAllDocs(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);
  useEffect(() => {
    document.body.style.overflow = viewingDoc ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [viewingDoc]);

  const handleSelectCourse = (c: string, cat?: string) => {
    setSelCourse(c); setSelCategory(cat ?? "");
  };
  const handleReset = () => { setSelCourse(""); setSelCategory(""); };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">

      {/* ── Option C: Onboarding Modal ─────────────────────── */}
      {showSetupModal && <MajorSetupModal onSave={handleSetupSave} />}

      {/* ── Top bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="flex items-center gap-4 px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0 mr-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[13px] font-semibold text-zinc-900 leading-none">Ganesha Repository</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Institut Teknologi Bandung</p>
            </div>
          </div>

          <div className="w-px h-5 bg-zinc-200 shrink-0" />

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="repo-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search papers, theses…"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-[13px] outline-none bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
            />
          </div>

          <div className="flex-1" />

          {/* ── Option A: Context Pills ──────────────────── */}
          <div className="hidden md:flex items-center gap-2 shrink-0">

            {/* Faculty pill — click to change, tooltip on hover */}
            {ctxFaculty ? (
              <div className="relative group/ctx">
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Click to change faculty or major"
                >
                  🎓 {ctxFaculty}
                  {ctxMajor && <span className="text-zinc-400">·</span>}
                  {ctxMajor && <span className="text-zinc-300 max-w-[110px] truncate">{ctxMajor}</span>}
                  <span className="text-zinc-500 ml-0.5 text-[10px]">✎</span>
                </button>
                {/* Tooltip */}
                <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-zinc-900 text-white text-[11px] rounded-xl px-3 py-2.5 shadow-xl leading-relaxed opacity-0 group-hover/ctx:opacity-100 pointer-events-none transition-opacity duration-150">
                  <p className="font-semibold mb-0.5">Your context filter</p>
                  <p className="text-zinc-400">Click to change faculty or major to browse other departments.</p>
                  <div className="mt-2 pt-2 border-t border-zinc-700 flex items-center justify-between">
                    <span className="text-zinc-400">Reset to my major</span>
                    <button
                      onClick={e => { e.stopPropagation(); clearContext(); }}
                      className="pointer-events-auto text-zinc-300 hover:text-white font-medium transition-colors"
                    >
                      Reset ↺
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSetupModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border border-dashed border-zinc-300 text-zinc-500 hover:border-zinc-500 hover:text-zinc-800 transition-all"
              >
                + Set your major
              </button>
            )}

            {/* Year pills */}
            <div className="flex items-center gap-1.5">
              {selYear && (
                <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1.5 rounded-full text-[12px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                  {selYear}
                  <button onClick={() => setSelYear("")} className="ml-0.5 p-0.5 rounded-full hover:bg-blue-100 transition-colors">
                    <X size={10} />
                  </button>
                </span>
              )}
              {/* Year picker */}
              {years.length > 0 && (
                <div className="relative group">
                  <button className="px-2.5 py-1.5 rounded-full text-[12px] font-medium border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 transition-all">
                    {selYear ? "Year ▾" : "Any year ▾"}
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-zinc-200 shadow-xl py-1.5 min-w-[100px] hidden group-focus-within:flex group-hover:flex flex-col z-50">
                    <button
                      onClick={() => setSelYear("")}
                      className={`px-4 py-1.5 text-[12px] text-left hover:bg-zinc-50 transition-colors ${!selYear ? "font-semibold text-zinc-900" : "text-zinc-500"}`}
                    >
                      All years
                    </button>
                    {years.map(y => (
                      <button
                        key={y}
                        onClick={() => setSelYear(String(y))}
                        className={`px-4 py-1.5 text-[12px] text-left hover:bg-zinc-50 transition-colors ${selYear === String(y) ? "font-semibold text-zinc-900" : "text-zinc-500"}`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-px h-5 bg-zinc-200 shrink-0 hidden md:block" />

          {/* Sign Out */}
          <button
            onClick={() => {
              localStorage.removeItem("ganesha_token");
              localStorage.removeItem("ganesha_user");
              localStorage.removeItem("ganesha_context");
              router.push("/student-login");
            }}
            className="text-[12px] font-medium text-zinc-500 hover:text-red-600 transition-colors shrink-0"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Backdrop for mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-zinc-900/20 backdrop-blur-xs md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`shrink-0 bg-white overflow-y-auto transition-all duration-200 ease-in-out absolute md:relative z-30 h-[calc(100vh-3.5rem)] md:h-auto ${
            sidebarOpen ? "w-52 border-r border-zinc-200" : "w-0 border-r-0 pointer-events-none"
          }`}
        >
          <div className="w-52 p-4 pt-5">
            {/* Mobile-only filters */}
            <div className="md:hidden mb-6 pb-6 border-b border-zinc-100 flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 px-1">
                Context & Filters
              </p>
              
              {/* Faculty context */}
              {ctxFaculty ? (
                <div className="flex flex-col gap-1.5 px-1">
                  <span className="text-[11px] text-zinc-400 font-medium">Faculty & Major</span>
                  <button
                    onClick={() => { setShowSetupModal(true); setSidebarOpen(false); }}
                    className="inline-flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg text-left text-[12px] font-semibold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors cursor-pointer w-full"
                  >
                    <span className="truncate">🎓 {ctxFaculty} {ctxMajor ? `· ${ctxMajor}` : ""}</span>
                    <span className="text-zinc-400 text-[10px] shrink-0">✎</span>
                  </button>
                  <button
                    onClick={clearContext}
                    className="text-left text-[11px] text-zinc-400 hover:text-zinc-600 px-1 underline mt-0.5"
                  >
                    Reset major context
                  </button>
                </div>
              ) : (
                <div className="px-1">
                  <button
                    onClick={() => { setShowSetupModal(true); setSidebarOpen(false); }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border border-dashed border-zinc-300 text-zinc-500 hover:border-zinc-500 hover:text-zinc-800 transition-all"
                  >
                    + Set your major
                  </button>
                </div>
              )}

              {/* Year filter */}
              {years.length > 0 && (
                <div className="flex flex-col gap-1.5 px-1 mt-2">
                  <span className="text-[11px] text-zinc-400 font-medium">Year</span>
                  <select
                    value={selYear}
                    onChange={(e) => setSelYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[12px] font-medium border border-zinc-200 text-zinc-600 bg-white focus:outline-none"
                  >
                    <option value="">Any year</option>
                    {years.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-3 px-1">
              Courses
            </p>
            <CourseTree
              documents={topFilteredDocs}
              selectedCourseCode={selCourse}
              selectedCategory={selCategory}
              onSelect={handleSelectCourse}
            />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="px-4 py-5 md:px-7 md:py-6">

            {/* Breadcrumb row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-7">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(o => !o)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  title="Toggle sidebar"
                >
                  {sidebarOpen
                    ? <PanelLeftClose size={16} />
                    : <PanelLeftOpen size={16} />
                  }
                </button>
                <Breadcrumb
                  courseCode={selCourse} category={selCategory}
                  onReset={handleReset}
                />
              </div>
              {!loading && !error && (
                <span className="text-[12px] text-zinc-400 font-medium tabular-nums">
                  {documents.length} {documents.length === 1 ? "result" : "results"}
                </span>
              )}
            </div>

            {/* States */}
            {loading && (
              <div className="flex items-center justify-center py-32">
                <Loader2 size={28} className="animate-spin text-zinc-300" />
              </div>
            )}

            {error && (
              <div className="rounded-xl p-4 text-[13px] bg-red-50 text-red-500 border border-red-100">{error}</div>
            )}

            {!loading && !error && documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                  <Folder size={24} className="text-zinc-300" />
                </div>
                <p className="font-semibold text-zinc-700">No materials found</p>
                <p className="text-[13px] text-zinc-400 mt-1.5">Try selecting a different course or adjusting your filters.</p>
              </div>
            )}

            {/* Grid */}
            {!loading && !error && documents.length > 0 && (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onView={setViewingDoc} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* File Viewer */}
      {viewingDoc && <FileViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
    </div>
  );
}
