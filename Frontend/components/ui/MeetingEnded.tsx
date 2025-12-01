"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

interface MeetingEndedProps {
  message?: string;
}

export default function MeetingEnded({ message = "The meeting has ended" }: MeetingEndedProps) {
  const router = useRouter();

  return (
    <div className="h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-zinc-900/95 to-black/95 backdrop-blur-xl rounded-2xl border border-zinc-800/50 shadow-2xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Icon name="stop" size={40} className="text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">Meeting Ended</h1>
        <p className="text-gray-400 mb-8">{message}</p>
        
        <button
          onClick={() => router.push("/")}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

