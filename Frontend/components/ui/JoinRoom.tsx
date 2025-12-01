"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

interface JoinRoomProps {
  roomId: string;
  setRoomId: (id: string) => void;
  onCreateRoom: (name: string, title: string) => void;
  onJoinRoom: (name: string) => void;
}

export default function JoinRoom({
  roomId,
  setRoomId,
  onCreateRoom,
  onJoinRoom,
}: JoinRoomProps) {
  const [copied, setCopied] = useState(false);
  const [userName, setUserName] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const copyToClipboard = () => {
    if (!roomId.trim()) return;
    const shareUrl = `${window.location.origin}?token=${roomId}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  const handleCreateRoom = () => {
    if (!userName.trim() || !meetingTitle.trim()) return;
    setIsCreating(true);
    onCreateRoom(userName.trim(), meetingTitle.trim());
  };

  const handleJoinRoom = () => {
    if (!roomId.trim() || !userName.trim()) return;
    onJoinRoom(userName.trim());
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6 sm:p-7 space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-blue-200">
          Instant studio
        </p>
        <h2 className="text-xl font-semibold">Launch a premium session</h2>
        <p className="text-sm text-gray-400">
          Create or join a secure WebMeet. No emails. No lobby waits.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-[0.3em]">
          Your name
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Avery Johnson"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          maxLength={50}
        />
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-[0.3em]">
          Meeting title
        </label>
        <input
          type="text"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          placeholder="Linear Algebra Sprint"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          maxLength={100}
        />
        <button
          onClick={handleCreateRoom}
          disabled={!userName.trim() || !meetingTitle.trim() || isCreating}
          className="w-full rounded-xl bg-white text-black font-semibold py-3 text-sm shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          {isCreating ? "Building room..." : "Create & invite"}
        </button>
      </div>

      <div className="border-t border-white/10 pt-6 space-y-3">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-[0.3em]">
          Join with ID
        </label>
        <input
          type="text"
          value={roomId}
          onChange={(e) => {
            let value = e.target.value.trim();
            if (value.includes("?token=")) {
              value = value.split("?token=")[1]?.split("&")[0] || value;
            } else if (value.includes("/room/")) {
              value = value.split("/room/")[1]?.split("?")[0] || value;
            }
            setRoomId(value);
          }}
          placeholder="Paste invitation link or ID"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleJoinRoom}
            disabled={!roomId.trim() || !userName.trim()}
            className="flex-1 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Join room
          </button>
          <button
            onClick={copyToClipboard}
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80 hover:text-white transition-colors"
          >
            <Icon name={copied ? "check" : "copy"} size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
