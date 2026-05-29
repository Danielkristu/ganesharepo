"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { WebinarQuestion, WebinarRoom } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface Participant {
  user_id: string;
  display_name: string;
  is_speaking: boolean;
  video_enabled: boolean;
  audio_enabled: boolean;
}

interface WebinarState {
  room: WebinarRoom | null;
  isLive: boolean;
  activeSpeaker: string | null;
  participants: Participant[];
  questions: WebinarQuestion[];
  myQuestion: string;
  isLoadingRoom: boolean;
  isLoadingQuestions: boolean;
  isSubmittingQuestion: boolean;
}

interface WebinarActions {
  loadRoom: (roomId: string) => Promise<void>;
  loadQuestions: (roomId: string) => Promise<void>;
  setMyQuestion: (q: string) => void;
  submitQuestion: (roomId: string) => Promise<void>;
  upvoteQuestion: (roomId: string, questionId: string) => Promise<void>;
  setActiveSpeaker: (userId: string | null) => void;
  setIsLive: (live: boolean) => void;
}

type WebinarContextType = WebinarState & WebinarActions;

// ── Context ────────────────────────────────────────────────────────────────

const WebinarContext = createContext<WebinarContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function WebinarProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<WebinarRoom | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<WebinarQuestion[]>([]);
  const [myQuestion, setMyQuestion] = useState("");
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // Polling ref — polls questions every 5 s when a live room is active
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRoom = useCallback(async (roomId: string) => {
    setIsLoadingRoom(true);
    try {
      const res = await fetch(`/api/proxy/webinar/rooms/${roomId}`);
      if (!res.ok) throw new Error("Failed to load room");
      const data: WebinarRoom = await res.json();
      setRoom(data);
      setIsLive(data.status === "live");
    } finally {
      setIsLoadingRoom(false);
    }
  }, []);

  const loadQuestions = useCallback(async (roomId: string) => {
    setIsLoadingQuestions(true);
    try {
      const res = await fetch(`/api/proxy/webinar/rooms/${roomId}/questions`);
      if (!res.ok) throw new Error("Failed to load questions");
      const data: WebinarQuestion[] = await res.json();
      setQuestions(data);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  // Auto-poll questions when room is live
  useEffect(() => {
    if (isLive && room) {
      pollRef.current = setInterval(() => loadQuestions(room.id), 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isLive, room, loadQuestions]);

  const submitQuestion = useCallback(
    async (roomId: string) => {
      if (!myQuestion.trim()) return;
      setIsSubmittingQuestion(true);
      try {
        const token = localStorage.getItem("ganesha_token");
        const res = await fetch(
          `/api/proxy/webinar/rooms/${roomId}/questions`,
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ webinar_id: roomId, question: myQuestion }),
          }
        );
        if (!res.ok) throw new Error("Failed to submit question");
        const newQ: WebinarQuestion = await res.json();
        setQuestions((prev) => [newQ, ...prev]);
        setMyQuestion("");
      } finally {
        setIsSubmittingQuestion(false);
      }
    },
    [myQuestion]
  );

  const upvoteQuestion = useCallback(
    async (roomId: string, questionId: string) => {
      const token = localStorage.getItem("ganesha_token");
      const res = await fetch(
        `/api/proxy/webinar/rooms/${roomId}/questions/${questionId}/upvote`,
        { 
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
      if (!res.ok) return;
      const { upvotes } = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, upvotes } : q))
      );
    },
    []
  );

  const value: WebinarContextType = {
    room,
    isLive,
    activeSpeaker,
    participants,
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
    setActiveSpeaker,
    setIsLive,
  };

  return (
    <WebinarContext.Provider value={value}>{children}</WebinarContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useWebinar() {
  const ctx = useContext(WebinarContext);
  if (!ctx) {
    throw new Error("useWebinar must be used inside <WebinarProvider>");
  }
  return ctx;
}
