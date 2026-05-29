"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { BookOpen, Video, CheckCircle2, XCircle, ChevronLeft, ClipboardCheck } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url: string | null;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  linked_name: string | null;
  linked_type: "document" | "webinar" | null;
  linked_id: string | null;
  questions: Question[];
  already_submitted: boolean;
  prior_submission: {
    score: number;
    answers: Record<string, string>;
    submitted_at: string;
  } | null;
}

interface GradeResult {
  score: number;
  correct_count: number;
  total: number;
  results: Array<{
    question_id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    image_url: string | null;
    student_answer: string;
    correct_option: string;
    is_correct: boolean;
  }>;
}

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function optionText(q: Question | GradeResult["results"][0], letter: string): string {
  const map: Record<string, string> = {
    A: (q as any).option_a,
    B: (q as any).option_b,
    C: (q as any).option_c,
    D: (q as any).option_d,
  };
  return map[letter] || "";
}

// ── Score / Results view ────────────────────────────────────────────────────
function ResultsView({ result, quiz }: { result: GradeResult; quiz: Quiz }) {
  const isPassing = result.score >= 60;
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Score card */}
      <div className="text-center bg-white border border-zinc-200 rounded-2xl p-10 shadow-sm">
        <div className={`text-7xl font-bold mb-2 ${isPassing ? "text-zinc-900" : "text-zinc-500"}`}>
          {result.score}
          <span className="text-3xl text-zinc-400 font-normal"> / 100</span>
        </div>
        <p className={`text-base font-semibold ${isPassing ? "text-green-600" : "text-zinc-500"}`}>
          {isPassing ? "🎉 Well done!" : "Keep studying — you can do it!"}
        </p>
        <p className="text-sm text-zinc-500 mt-1">
          {result.correct_count} correct out of {result.total} questions
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Review</h2>
        {result.results.map((r, idx) => (
          <div key={r.question_id} className={`bg-white border rounded-xl p-4 ${r.is_correct ? "border-green-200" : "border-zinc-200"}`}>
            <div className="flex items-start gap-2 mb-3">
              <span className="flex-shrink-0 mt-0.5">
                {r.is_correct
                  ? <CheckCircle2 size={17} className="text-green-500" />
                  : <XCircle size={17} className="text-zinc-400" />}
              </span>
              <p className="text-sm font-medium text-zinc-900 break-words">
                {idx + 1}. {r.question_text}
              </p>
            </div>

            {r.image_url && (
              <div className="mb-4 ml-6 bg-zinc-50 border border-zinc-200 rounded-lg p-2 flex justify-center">
                <img src={r.image_url} alt="Question context" className="max-h-48 object-contain rounded" />
              </div>
            )}

            <div className="space-y-1.5 ml-6">
              {OPTION_KEYS.map((letter) => {
                const isCorrect = letter === r.correct_option;
                const isStudentChoice = letter === r.student_answer;
                const isWrongChoice = isStudentChoice && !isCorrect;
                return (
                  <div
                    key={letter}
                    className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm ${
                      isCorrect
                        ? "bg-green-50 text-green-800 border border-green-200 font-medium"
                        : isWrongChoice
                        ? "bg-red-50 text-red-900 border border-red-200"
                        : "text-zinc-500"
                    }`}
                  >
                    <span className="font-bold text-xs w-4">{letter}</span>
                    <span className="break-words flex-1">{optionText(r, letter)}</span>
                    {isCorrect && <span className="ml-auto text-xs text-green-600 font-bold">Correct</span>}
                    {isWrongChoice && <span className="ml-auto text-xs text-red-600 font-bold">Incorrect</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Back button */}
      {quiz.linked_id && (
        <div className="flex justify-center">
          <Link
            href={quiz.linked_type === "webinar" ? `/webinar/${quiz.linked_id}` : `/repository/${quiz.linked_id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
          >
            {quiz.linked_type === "webinar" ? <Video size={15} /> : <BookOpen size={15} />}
            Back to {quiz.linked_name || "Document"}
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main quiz-taking page ────────────────────────────────────────────────────
export default function QuizTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("ganesha_token");
    fetch(`/api/proxy/quiz/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        setQuiz(data);
        // If already submitted, re-build a synthetic result view from prior_submission
        if (data.already_submitted && data.prior_submission) {
          const sub = data.prior_submission;
          // We'll fetch the real graded breakdown by re-submitting — but we can't,
          // so we show a simple "already submitted" state instead.
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    const token = localStorage.getItem("ganesha_token");
    try {
      const res = await fetch(`/api/proxy/quiz/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Failed to submit.");
        return;
      }
      setResult(await res.json());
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4 animate-pulse">
        <div className="h-8 bg-zinc-100 rounded-xl w-2/3" />
        <div className="h-4 bg-zinc-100 rounded w-1/3" />
        {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-zinc-100 rounded-xl" />)}
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-500">Quiz not found or not published.</p>
        <Link href="/quiz" className="text-sm text-blue-600 underline mt-2 block">Browse quizzes</Link>
      </div>
    );
  }

  if (result) {
    return <ResultsView result={result} quiz={quiz} />;
  }

  if (quiz.already_submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ClipboardCheck size={40} className="mx-auto text-zinc-400 mb-4" />
        <p className="text-lg font-semibold text-zinc-800">Already Submitted</p>
        <p className="text-zinc-500 text-sm mt-1">
          You scored <strong>{quiz.prior_submission?.score ?? "—"} / 100</strong> on this quiz.
        </p>
        {quiz.linked_id && (
          <Link
            href={quiz.linked_type === "webinar" ? `/webinar/${quiz.linked_id}` : `/repository/${quiz.linked_id}`}
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
          >
            {quiz.linked_type === "webinar" ? <Video size={15} /> : <BookOpen size={15} />}
            Back to {quiz.linked_name || "Document"}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <Link href="/quiz" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 mb-4 transition-colors">
            <ChevronLeft size={13} /> All quizzes
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">{quiz.title}</h1>
          {quiz.description && <p className="text-sm text-zinc-500 mt-2">{quiz.description}</p>}
          {quiz.linked_name && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-500">
              {quiz.linked_type === "webinar" ? <Video size={12} /> : <BookOpen size={12} />}
              Linked to: <span className="font-medium text-zinc-700">{quiz.linked_name}</span>
            </div>
          )}
          <div className="mt-3 text-xs text-zinc-400">{quiz.questions.length} questions · Select one option per question</div>
        </div>

        {/* Questions */}
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-zinc-900 break-words">
              {idx + 1}. {q.question_text}
            </p>
            {q.image_url && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2 flex justify-center">
                <img src={q.image_url} alt="Question context" className="max-h-48 object-contain rounded" />
              </div>
            )}
            <div className="space-y-2">
              {OPTION_KEYS.map((letter) => {
                const selected = answers[q.id] === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-left text-sm transition-all ${
                      selected
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
                    }`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${selected ? "border-white bg-white text-zinc-900" : "border-zinc-300"}`}>
                      {letter}
                    </span>
                    <span className="break-words flex-1">{optionText(q, letter)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60 text-sm"
        >
          {submitting ? "Submitting…" : "Submit Quiz"}
        </button>
      </div>
    </div>
  );
}
