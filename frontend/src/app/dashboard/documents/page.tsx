"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  BookOpen, Upload, X, File as FileIcon, Loader2, Plus,
  ExternalLink, Pencil, Trash2, Shield, GraduationCap, CloudUpload,
} from "lucide-react";
import { toast } from "sonner";
import { Document } from "@/types";

// Full faculty → majors map (keyed by shortcode for matching)
const ITB_FACULTIES: Record<string, string[]> = {
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
  "SAPPK": ["Arsitektur", "Perencanaan Wilayah dan Kota"],
};

const CATEGORIES = ["Thesis", "Paper", "Journal", "Lecture Notes", "Research", "Video Recording"];

export default function DocumentsDashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);

  // Admin identity from localStorage
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFaculty, setAdminFaculty] = useState("");
  const [adminMajor, setAdminMajor] = useState("");

  // Form State
  const [materialType, setMaterialType] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [category, setCategory] = useState("Paper");
  const [major, setMajor] = useState(adminMajor);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [publishMode, setPublishMode] = useState("public");
  const [materialLink, setMaterialLink] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const token = localStorage.getItem("ganesha_token");
      const url = "/api/proxy/repository/admin/documents?limit=100";
        
      const res = await fetch(url, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        setDocuments(await res.json());
      } else {
        toast.error("Failed to load documents");
      }
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Read admin identity from localStorage on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = localStorage.getItem("ganesha_user");
      let fac = "";
      if (raw) {
        try {
          const user = JSON.parse(raw) as { email?: string; faculty?: string; major?: string };
          fac = user.faculty || "";
          const defaultMajor = user.major || ITB_FACULTIES[fac]?.[0] || "";
          setAdminEmail(user.email || "");
          setAdminFaculty(fac);
          setAdminMajor(defaultMajor);
          setMajor(defaultMajor);
        } catch {
          setAdminEmail("");
          setAdminFaculty("");
          setAdminMajor("");
        }
      }

      void fetchDocuments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const uploadToR2 = async (uploadFile: File, folder: string) => {
    const presignRes = await fetch(`/api/upload/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: uploadFile.name, contentType: uploadFile.type, folder }),
    });
    if (!presignRes.ok) throw new Error("Failed to get upload URL");
    const { presignedUrl, publicUrl } = await presignRes.json();

    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": uploadFile.type },
      body: uploadFile,
    });
    if (!uploadRes.ok) throw new Error("Failed to upload file to storage");

    return publicUrl as string;
  };

  const resetForm = () => {
    setMaterialType("file");
    setFile(null);
    setThumbnailFile(null);
    setTitle("");
    setAbstract("");
    setCategory("Paper");
    setMajor(adminMajor);
    setYear(new Date().getFullYear().toString());
    setCourseCode("");
    setCourseName("");
    setPublishMode("public");
    setMaterialLink("");
    setThumbnailUrl("");
    setError(null);
    setShowModal(false);
    setEditingDoc(null);
  };

  const openUploadModal = () => {
    setEditingDoc(null);
    setMaterialType("file");
    setFile(null);
    setThumbnailFile(null);
    setMaterialLink("");
    setThumbnailUrl("");
    setMajor(adminMajor);
    setShowModal(true);
  };

  const handleEditClick = (doc: Document) => {
    setEditingDoc(doc);
    setMaterialType(doc.material_type || "file");
    setTitle(doc.title);
    setAbstract(doc.abstract || "");
    setCategory(doc.category);
    setMajor(doc.major || adminMajor);
    setYear(doc.year?.toString() || "");
    setCourseCode(doc.course_code || "");
    setCourseName(doc.course_name || "");
    setPublishMode(doc.publish_mode || "public");
    setMaterialLink(doc.material_type === "link" ? doc.file_url : "");
    setThumbnailUrl(doc.thumbnail_url || "");
    setShowModal(true);
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("ganesha_token");
    const res = await fetch(`/api/proxy/repository/documents/${doc.id}`, {
      method: "DELETE",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.ok) {
      toast.success("Document deleted.");
      fetchDocuments();
    } else {
      const payload = await res.json().catch(() => null);
      const detail =
        payload && typeof payload === "object" && "detail" in payload
          ? String((payload as { detail?: unknown }).detail ?? "")
          : "";
      toast.error(detail || `Failed to delete document (${res.status}).`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) { setError("Title is required."); return; }
    if (materialType === "file" && (!file && (!editingDoc || editingDoc.material_type === "link"))) {
      setError("Please select a file to upload.");
      return;
    }
    if (materialType === "link" && !materialLink) { setError("Please enter a material link."); return; }
    if (!courseCode) { setError("Course Code is required."); return; }
    if (!courseName) { setError("Course Name is required."); return; }

    setIsUploading(true);
    setError(null);

    try {
      let finalFileUrl = editingDoc?.file_url || "";
      let finalThumbnailUrl = thumbnailUrl;

      if (materialType === "file") {
        if (file) {
          finalFileUrl = await uploadToR2(file, "materials");
        } else if (!editingDoc) {
          throw new Error("Please select a file to upload.");
        }
      } else {
        finalFileUrl = materialLink;
      }

      if (thumbnailFile) {
        finalThumbnailUrl = await uploadToR2(thumbnailFile, "thumbnails");
      }

      const payload = {
        title,
        abstract,
        // author is auto-set to admin email; backend locks faculty to admin's profile
        author: adminEmail,
        category,
        faculty: adminFaculty,
        major,
        file_url: finalFileUrl,
        material_type: materialType,
        thumbnail_url: finalThumbnailUrl || null,
        year: parseInt(year) || null,
        course_code: courseCode,
        course_name: courseName,
        publish_mode: publishMode,
      };

      const token = localStorage.getItem("ganesha_token");
      const url = editingDoc
        ? `/api/proxy/repository/documents/${editingDoc.id}`
        : "/api/proxy/repository/documents";

      const res = await fetch(url, {
        method: editingDoc ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        let msg = "Failed to save document.";
        try { msg = JSON.parse(errText)?.detail || msg; } catch {}
        throw new Error(msg);
      }

      resetForm();
      toast.success(editingDoc ? "Document updated!" : "Document uploaded!");
      fetchDocuments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save document.";
      toast.error(message);
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const availableMajors = adminFaculty ? (ITB_FACULTIES[adminFaculty] ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Document Management</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Managing documents for <span className="font-semibold text-zinc-700">{adminFaculty || "your faculty"}</span>
          </p>
        </div>
        <button
          onClick={openUploadModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition-all shadow-sm shrink-0"
        >
          <Plus size={16} />
          Upload Document
        </button>
      </div>

      {/* Document List */}
      {isLoadingDocs ? (
        <div className="flex justify-center p-16">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white p-16 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 mb-4">
            <BookOpen size={32} className="text-zinc-300" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900">No documents yet</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">Upload your first document to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-600">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Major</th>
                  <th className="px-6 py-4 font-medium">Visibility</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 truncate max-w-xs">{doc.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{doc.year || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{doc.major || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                        doc.publish_mode === "public"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : doc.publish_mode === "faculty"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-purple-50 text-purple-700 border-purple-100"
                      }`}>
                        {doc.publish_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEditClick(doc)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View"
                        >
                          <ExternalLink size={15} />
                        </a>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center">
                  <CloudUpload size={17} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    {editingDoc ? "Edit Document" : "Upload New Document"}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                    <Shield size={11} />
                    Scoped to <strong className="text-zinc-700">{adminFaculty}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              <form id="upload-form" onSubmit={handleSubmit} className="space-y-5">

                {error && (
                  <div className="p-3.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Material Type</label>
                  <div className="grid grid-cols-2 gap-3 max-w-1/3 pt-2">
                    {[
                      { value: "file", label: "File"},
                      { value: "link", label: "URL",},
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMaterialType(opt.value as "file" | "link")}
                        className={`rounded-full border p-2 text-center transition-all ${
                          materialType === opt.value
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                            : "border-zinc-200 hover:border-zinc-400 text-zinc-700"
                        }`}
                      >
                        <p className="text-xs font-semibold">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Drop Zone */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    {materialType === "file" ? "File" : "Material link"} {materialType === "file" && !editingDoc && <span className="text-red-500">*</span>}
                  </label>
                  {materialType === "file" ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-7 flex flex-col items-center justify-center text-center transition-all ${
                        file
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.ppt,.pptx,.mp4,.mov,.webm"
                      />
                      {file ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                            <FileIcon size={18} className="text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-zinc-900 truncate max-w-xs">{file.name}</p>
                            <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-auto p-1 text-zinc-400 hover:text-red-500">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload size={28} className="text-zinc-300 mb-2" />
                          <p className="text-sm font-medium text-zinc-700">
                            {editingDoc ? "Click to replace file (optional)" : "Click to upload"}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">PDF, PPTX, MP4 — up to 100 MB</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <input
                      value={materialLink}
                      onChange={(e) => setMaterialLink(e.target.value)}
                      type="url"
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                    />
                  )}
                </div>

                {materialType === "link" && materialLink && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Material Preview</label>
                    <div className="rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 h-56">
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
                        })(materialLink)}
                        className="w-full h-full border-0" 
                        title="Material preview" 
                      />
                    </div>
                    <p className="text-xs text-zinc-400">If the site blocks embedding, the link will still be stored and can be opened directly.</p>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Thumbnail</label>
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed p-5 flex items-center gap-4 transition-all ${
                      thumbnailFile || thumbnailUrl
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      onChange={handleThumbnailChange}
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                    />
                    {thumbnailFile || thumbnailUrl ? (
                      <>
                        <div className="relative w-24 h-16 overflow-hidden rounded-lg border border-zinc-200 bg-white shrink-0">
                          <Image
                            src={thumbnailFile 
                                ? URL.createObjectURL(thumbnailFile) 
                                : (thumbnailUrl.includes(".r2.cloudflarestorage.com") 
                                    ? `/api/repository/view?url=${encodeURIComponent(thumbnailUrl)}` 
                                    : thumbnailUrl)}
                            alt="Thumbnail preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-sm font-medium text-zinc-900">Thumbnail ready</p>
                          <p className="text-xs text-zinc-500">Stored in R2 when you save changes.</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setThumbnailFile(null); setThumbnailUrl(""); }}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200 shrink-0">
                          <Upload size={18} className="text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-700">Click to upload thumbnail</p>
                          <p className="text-xs text-zinc-400 mt-1">PNG, JPG, WebP, or GIF</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Title — full width */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    type="text"
                    placeholder="E.g., Introduction to Signal Processing"
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                  />
                </div>

                {/* Category + Year + Course — three columns */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Year</label>
                    <input
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      type="number"
                      min="2000"
                      max="2100"
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Course Code <span className="text-red-500">*</span></label>
                    <input
                      required
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      type="text"
                      placeholder="e.g. IF3110"
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Course Name <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    type="text"
                    placeholder="e.g. Pengembangan Aplikasi Berbasis Web"
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                  />
                </div>

                {/* Faculty (locked) + Major (filtered) — two columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                      Faculty
                      <span className="text-xs font-normal text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">Locked</span>
                    </label>
                    <div className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm bg-zinc-50 text-zinc-600 flex items-center gap-2 cursor-not-allowed select-none">
                      <GraduationCap size={14} className="text-zinc-400 shrink-0" />
                      {adminFaculty || "—"}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Major</label>
                    <select
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
                    >
                      {availableMajors.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {/* Publish Mode — full width */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">
                    Visibility <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "public", label: "Public", desc: "Anyone can view" },
                      { value: "student", label: "Students Only", desc: "Logged-in students" },
                      { value: "faculty", label: "Faculty Only", desc: `${adminFaculty} members` },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPublishMode(opt.value)}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          publishMode === opt.value
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                            : "border-zinc-200 hover:border-zinc-400 text-zinc-700"
                        }`}
                      >
                        <p className="text-xs font-semibold">{opt.label}</p>
                        <p className={`text-xs mt-0.5 ${publishMode === opt.value ? "text-zinc-400" : "text-zinc-400"}`}>
                          {opt.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Abstract */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Abstract / Description</label>
                  <textarea
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    rows={3}
                    placeholder="Brief summary of the material..."
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition resize-none"
                  />
                </div>

                  

              </form>
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50 shrink-0">
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Shield size={11} />
                Uploading as <strong className="text-zinc-600 ml-1">{adminEmail}</strong>
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  form="upload-form"
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-700 transition-all shadow-sm disabled:opacity-60"
                >
                  {isUploading ? (
                    <><Loader2 size={15} className="animate-spin" />{editingDoc ? "Updating…" : "Uploading…"}</>
                  ) : (
                    <><Upload size={15} />{editingDoc ? "Save Changes" : "Publish Document"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
