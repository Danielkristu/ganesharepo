"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, BookOpen, Video, Check, ChevronLeft, Save, UploadCloud, Image as ImageIcon, X } from "lucide-react";

interface LinkedItem {
  id: string;
  title: string;
  type: "document" | "webinar";
}

interface QuestionDraft {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  image_url: string | null;
}

function newQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
    image_url: null,
  };
}

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export default function NewQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [selectedLinkedId, setSelectedLinkedId] = useState<string>("none");
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents + webinars to populate the dropdown
  useEffect(() => {
    const token = localStorage.getItem("ganesha_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch("/api/proxy/repository/documents", { headers }).then((r) => r.ok ? r.json() : { data: [] }),
      fetch("/api/proxy/webinar/rooms", { headers }).then((r) => r.ok ? r.json() : []),
    ]).then(([docs, webinars]) => {
      const docItems: LinkedItem[] = (docs.data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        type: "document",
      }));
      const webinarItems: LinkedItem[] = (Array.isArray(webinars) ? webinars : []).map((w: any) => ({
        id: w.id,
        title: w.title,
        type: "webinar",
      }));
      setLinkedItems([...docItems, ...webinarItems]);
    });
  }, []);

  function updateQuestion(id: string, field: keyof QuestionDraft, value: string | null) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  }

  function handleImageDrop(id: string, file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateQuestion(id, "image_url", e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeQuestion(id: string) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleSave() {
    setError(null);
    if (!title.trim()) { setError("Quiz title is required."); return; }
    for (const q of questions) {
      if (!q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        setError("All questions and their four options must be filled in.");
        return;
      }
    }

    const linked = linkedItems.find((i) => i.id === selectedLinkedId);
    const token = localStorage.getItem("ganesha_token");

    setSaving(true);
    try {
      const res = await fetch("/api/proxy/quiz/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          linked_id: linked?.id || null,
          linked_type: linked?.type || null,
          linked_name: linked?.title || null,
          questions: questions.map(({ id: _id, ...rest }) => rest),
        }),
      });

      if (!res.ok) {
        let errMessage = "Failed to save quiz.";
        try {
          const err = await res.json();
          errMessage = err.detail || errMessage;
        } catch {
          // If it's not JSON, it might be a plain text server error
          // (Wait, we can't read res.text() if res.json() threw, 
          // but we can just use the status text)
          errMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        setError(errMessage);
        return;
      }

      router.push("/dashboard/quiz");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Create Quiz</h1>
          <p className="text-sm text-zinc-500">Build a multiple-choice quiz and link it to a document or webinar.</p>
        </div>
      </div>

      {/* Meta info */}
      <section className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Quiz Details</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Quiz Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mid-Semester Review — Circuit Analysis"
            className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="A short description shown to students before they start."
            className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Link to Document or Webinar</label>
          <select
            value={selectedLinkedId}
            onChange={(e) => setSelectedLinkedId(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          >
            <option value="none">— No link —</option>
            {linkedItems.filter(i => i.type === "document").length > 0 && (
              <optgroup label="📄 Documents">
                {linkedItems.filter(i => i.type === "document").map(i => (
                  <option key={i.id} value={i.id}>{i.title}</option>
                ))}
              </optgroup>
            )}
            {linkedItems.filter(i => i.type === "webinar").length > 0 && (
              <optgroup label="🎥 Webinars">
                {linkedItems.filter(i => i.type === "webinar").map(i => (
                  <option key={i.id} value={i.id}>{i.title}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </section>

      {/* Questions */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Questions</h2>

        {questions.map((q, index) => (
          <div key={q.id} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-800">Question {index + 1}</span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <input
              value={q.question_text}
              onChange={(e) => updateQuestion(q.id, "question_text", e.target.value)}
              placeholder="Enter your question here..."
              className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-400"
            />

            {/* Image Upload Zone */}
            {q.image_url ? (
              <div className="relative rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center p-2">
                <img src={q.image_url} alt="Question context" className="max-h-48 object-contain rounded" />
                <button
                  type="button"
                  onClick={() => updateQuestion(q.id, "image_url", null)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-md shadow-sm border border-zinc-200 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleImageDrop(q.id, e.dataTransfer.files[0]);
                  }
                }}
                className="w-full border-2 border-dashed border-zinc-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
              >
                <div className="p-2 bg-white rounded-full border border-zinc-200 mb-2">
                  <ImageIcon size={18} className="text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700">Drag & drop an image</p>
                <p className="text-xs text-zinc-500 mt-1 mb-3">or click to browse from your computer</p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                  <UploadCloud size={14} />
                  Upload Image
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageDrop(q.id, e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-medium">Options — click the circle to mark the correct answer</label>
              {OPTION_LABELS.map((letter) => {
                const field = `option_${letter.toLowerCase()}` as keyof QuestionDraft;
                const isCorrect = q.correct_option === letter;
                return (
                  <div key={letter} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isCorrect ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"}`}>
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, "correct_option", letter)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isCorrect ? "border-zinc-900 bg-zinc-900" : "border-zinc-300 hover:border-zinc-500"}`}
                    >
                      {isCorrect && <Check size={12} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className="text-xs font-bold text-zinc-500 w-4">{letter}</span>
                    <input
                      value={q[field] as string}
                      onChange={(e) => updateQuestion(q.id, field, e.target.value)}
                      placeholder={`Option ${letter}`}
                      className="flex-1 text-sm text-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => setQuestions((prev) => [...prev, newQuestion()])}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-300 rounded-xl text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <PlusCircle size={16} /> Add Another Question
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save & Publish Quiz"}
        </button>
      </div>
    </div>
  );
}
