"use client";

import { useState, useEffect } from "react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, Video, WifiOff, AlertCircle } from "lucide-react";

interface LiveKitVideoRoomProps {
  roomId: string;
}

interface TokenResponse {
  token: string;
  room_name: string;
  server_url: string;
}

export function LiveKitVideoRoom({ roomId }: LiveKitVideoRoomProps) {
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchToken() {
      try {
        const gToken = localStorage.getItem("ganesha_token");
        const res = await fetch(`/api/proxy/webinar/rooms/${roomId}/token`, {
          headers: gToken ? { Authorization: `Bearer ${gToken}` } : {},
        });

        if (res.status === 503) {
          setError("livekit_unconfigured");
        } else if (res.status === 410) {
          setError("ended");
        } else if (res.ok) {
          setTokenData(await res.json());
        } else {
          setError("failed");
        }
      } catch {
        setError("network");
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [roomId]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center gap-3 bg-zinc-950 rounded-xl">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
        <p className="text-zinc-400 text-sm">Connecting to room…</p>
      </div>
    );
  }

  if (error === "livekit_unconfigured") {
    return (
      <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center gap-4 bg-zinc-950 rounded-xl border border-zinc-800 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
          <AlertCircle size={24} className="text-amber-400" />
        </div>
        <div>
          <p className="text-zinc-100 font-semibold text-base">LiveKit Not Configured</p>
          <p className="text-zinc-400 text-sm mt-1 max-w-xs leading-relaxed">
            Add your <code className="text-amber-400 text-xs bg-zinc-800 px-1 py-0.5 rounded">LIVEKIT_API_KEY</code>,{" "}
            <code className="text-amber-400 text-xs bg-zinc-800 px-1 py-0.5 rounded">LIVEKIT_API_SECRET</code> and{" "}
            <code className="text-amber-400 text-xs bg-zinc-800 px-1 py-0.5 rounded">LIVEKIT_WS_URL</code> to{" "}
            <code className="text-zinc-300 text-xs">.env.local</code> to enable video conferencing.
          </p>
          <a
            href="https://cloud.livekit.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            Get free keys at cloud.livekit.io →
          </a>
        </div>
      </div>
    );
  }

  if (error === "ended") {
    return (
      <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center gap-3 bg-zinc-950 rounded-xl border border-zinc-800">
        <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
          <Video size={24} className="text-zinc-500" />
        </div>
        <p className="text-zinc-300 font-medium">Webinar has ended</p>
        <p className="text-zinc-500 text-sm">This session is no longer available.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center gap-3 bg-zinc-950 rounded-xl border border-zinc-800">
        <div className="w-14 h-14 rounded-full bg-red-900/30 border border-red-700/40 flex items-center justify-center">
          <WifiOff size={24} className="text-red-400" />
        </div>
        <p className="text-zinc-300 font-medium">Failed to connect</p>
        <p className="text-zinc-500 text-sm">Could not join the video room. Please try refreshing.</p>
      </div>
    );
  }

  if (!mounted || !tokenData) return null;

  return (
    <div className="w-full h-full min-h-[520px] rounded-xl overflow-hidden" data-lk-theme="default">
      <LiveKitRoom
        video={false}
        audio={false}
        token={tokenData.token}
        serverUrl={tokenData.server_url}
        style={{ height: "100%", minHeight: "520px" }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
