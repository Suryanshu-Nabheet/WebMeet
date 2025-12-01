"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  setRoomId: (id: string) => void;
  onCreateRoom: (name: string, title: string) => void;
  onJoinRoom: (name: string) => void;
  initialMode?: "create" | "join";
}

export default function RoomModal({
  isOpen,
  onClose,
  roomId,
  setRoomId,
  onCreateRoom,
  onJoinRoom,
  initialMode = "create",
}: RoomModalProps) {
  const [mode, setMode] = useState<"create" | "join">(initialMode);
  const [userName, setUserName] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !meetingTitle.trim()) return;
    setIsCreating(true);
    onCreateRoom(userName.trim(), meetingTitle.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !userName.trim()) return;
    onJoinRoom(userName.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              key="modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl shadow-blue-900/20">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 z-20 rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Icon name="close" size={18} />
                </button>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => setMode("create")}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                      mode === "create" ? "text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Create Room
                    {mode === "create" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setMode("join")}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                      mode === "join" ? "text-white" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Join Room
                    {mode === "join" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      />
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  {mode === "create" ? (
                    <form onSubmit={handleCreate} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Meeting Title
                        </label>
                        <input
                          type="text"
                          value={meetingTitle}
                          onChange={(e) => setMeetingTitle(e.target.value)}
                          placeholder="e.g. Weekly Sync"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!userName.trim() || !meetingTitle.trim() || isCreating}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        {isCreating ? "Creating..." : "Start Meeting"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleJoin} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Room ID or Link
                        </label>
                        <input
                          type="text"
                          value={roomId}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value.includes("?token=")) {
                              value = value.split("?token=")[1]?.split("&")[0] || value;
                            } else if (value.includes("/room/")) {
                              value = value.split("/room/")[1]?.split("?")[0] || value;
                            }
                            setRoomId(value);
                          }}
                          placeholder="Paste Room ID or URL"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!userName.trim() || !roomId.trim()}
                        className="w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Join Meeting
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
