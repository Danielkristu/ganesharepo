"use client";

import { useEffect, use } from "react";
import { ThumbsUp, Send, Loader2, Users, Wifi } from "lucide-react";
import { WebinarProvider, useWebinar } from "@/contexts/WebinarContext";
import { LiveKitVideoRoom } from "@/components/LiveKitVideoRoom";

function WebinarRoom({ roomId }: { roomId: string }) {
  const {
    room,
    isLive,
    questions,
    myQuestion,
    isLoadingRoom,
    isLoadingQuestions,
    isSubmittingQuestion,
    loadRoom,
    loadQuestions,
    setMyQuestion,
    submitQuestion,
    upvoteQuestion,
  } = useWebinar();

  useEffect(() => {
    loadRoom(roomId);
    loadQuestions(roomId);
  }, [roomId, loadRoom, loadQuestions]);

  if (isLoadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50">
      {/* ── Main video area ───────────────────────────────── */}
      <main className="flex-1 p-6 lg:p-8 flex flex-col gap-6">
        {/* Room title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
              {room?.title ?? "Loading…"}
            </h1>
            <p className="text-sm mt-1 text-zinc-500 max-w-2xl">
              {room?.description}
            </p>
          </div>
          <div className="shrink-0">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-red-50 text-red-600 border border-red-100">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                <Wifi size={14} className="text-zinc-400" />
                Offline
              </span>
            )}
          </div>
        </div>

        {/* Video area — LiveKit embedded conference */}
        <div className="flex-1 min-h-[520px]">
          <LiveKitVideoRoom roomId={roomId} />
        </div>

        {/* Participant count */}
        <div className="flex items-center justify-between text-sm text-zinc-500 px-2">
          <div className="flex items-center gap-2 font-medium">
            <Users size={16} className="text-zinc-400" />
            <span>0 participants connected</span>
          </div>
        </div>
      </main>

      {/* ── Q&A Sidebar ──────────────────────────────────── */}
      <aside className="lg:w-[400px] flex flex-col bg-white border-l border-zinc-200 shadow-sm z-10">
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <h3 className="font-medium text-zinc-900">Q&amp;A</h3>
          <span className="text-xs font-medium px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
            {questions.length} questions
          </span>
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-white">
          {isLoadingQuestions && (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-zinc-400" />
            </div>
          )}
          {!isLoadingQuestions && questions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Send size={20} className="text-zinc-400 ml-1" />
              </div>
              <p className="font-medium text-zinc-900">No questions yet</p>
              <p className="text-sm text-zinc-500 mt-1">Be the first to ask the speaker!</p>
            </div>
          )}
          {questions.map((q) => (
            <div key={q.id} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col gap-3 animate-fade-up">
              <p className="text-sm text-zinc-800 leading-relaxed">
                {q.question}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 mt-1">
                <span className="text-xs font-medium text-zinc-400">
                  {new Date(q.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <button
                  id={`upvote-${q.id}`}
                  onClick={() => upvoteQuestion(roomId, q.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
                >
                  <ThumbsUp size={14} className={q.upvotes > 0 ? "text-blue-500" : "text-zinc-400"} />
                  {q.upvotes}
                </button>
              </div>
              {q.answered && (
                <span className="text-xs font-medium px-2 py-1 rounded-md self-start bg-green-50 text-green-700 border border-green-200">
                  ✓ Answered
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Ask a question input */}
        <div className="p-5 border-t border-zinc-200 bg-zinc-50/50">
          <div className="flex gap-2 relative">
            <input
              id="qa-input"
              type="text"
              value={myQuestion}
              onChange={(e) => setMyQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitQuestion(roomId);
                }
              }}
              placeholder="Ask a question…"
              className="flex-1 pl-4 pr-12 py-3 rounded-lg text-sm outline-none transition-all bg-white border border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 shadow-sm"
            />
            <button
              id="qa-submit"
              onClick={() => submitQuestion(roomId)}
              disabled={isSubmittingQuestion || !myQuestion.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-md transition-all disabled:opacity-40 bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {isSubmittingQuestion ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function WebinarRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <WebinarProvider>
      <WebinarRoom roomId={id} />
    </WebinarProvider>
  );
}
