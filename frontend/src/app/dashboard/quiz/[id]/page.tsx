"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Video, ChevronLeft, Trash2, CheckCircle2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  order_index: number;
}

interface QuizAdminDetails {
  id: string;
  title: string;
  description: string;
  linked_name: string | null;
  linked_type: "document" | "webinar" | null;
  linked_id: string | null;
  is_published: boolean;
  questions: Question[];
}

export default function QuizAdminViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizAdminDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ganesha_token");
    fetch(`/api/proxy/quiz/admin/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setQuiz(data))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this quiz completely? This will also wipe all student submissions.")) return;
    const token = localStorage.getItem("ganesha_token");
    await fetch(`/api/proxy/quiz/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    router.push("/dashboard/quiz");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-zinc-100 rounded-md" />
        <div className="h-20 bg-zinc-100 rounded-xl" />
        <div className="h-32 bg-zinc-100 rounded-xl" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-zinc-500">Quiz not found or you do not have permission to view it.</p>
        <button onClick={() => router.push("/dashboard/quiz")} className="text-sm text-blue-600 underline mt-2 block w-full">Back to Quizzes</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/quiz" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 mb-4 transition-colors">
            <ChevronLeft size={13} /> Back to Quizzes
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">{quiz.title}</h1>
          {quiz.description && <p className="text-sm text-zinc-500 mt-2">{quiz.description}</p>}
          {quiz.linked_name && (
            <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md inline-flex">
              {quiz.linked_type === "webinar" ? <Video size={13} /> : <BookOpen size={13} />}
              {quiz.linked_name}
            </div>
          )}
        </div>
        
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <Trash2 size={15} /> Delete Quiz
        </button>
      </div>

      {/* Questions Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Questions & Answer Key</h2>
          <span className="text-xs font-medium text-zinc-400">{quiz.questions.length} questions total</span>
        </div>

        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-zinc-900">
              {idx + 1}. {q.question_text}
            </p>
            
            <div className="space-y-2 mt-3">
              {(["A", "B", "C", "D"] as const).map((letter) => {
                const isCorrect = q.correct_option === letter;
                const optText = q[`option_${letter.toLowerCase()}` as keyof Question];
                return (
                  <div
                    key={letter}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      isCorrect 
                        ? "bg-green-50 text-green-900 border border-green-200 font-medium" 
                        : "bg-white text-zinc-600 border border-zinc-100"
                    }`}
                  >
                    <span className="font-bold text-xs w-4 flex-shrink-0">{letter}</span>
                    <span className="flex-1">{optText}</span>
                    {isCorrect && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-bold ml-auto">
                        <CheckCircle2 size={14} /> Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
