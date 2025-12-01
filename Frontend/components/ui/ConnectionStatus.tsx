"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { getSocket } from "@/lib/socket";
import { useRoomStore } from "@/store/roomStore";

export default function ConnectionStatus() {
  const {
    peers,
    mySocketId,
    isAudioEnabled,
    isVideoEnabled,
    networkStats,
  } = useRoomStore();
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    
    setSocketConnected(socket.connected);
    setSocketId(socket.id || null);

    const onConnect = () => {
      setSocketConnected(true);
      setSocketId(socket.id || null);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
      setSocketId(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Icon name="network" size={18} className="text-blue-400" />
        Connection Status
      </h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Socket:</span>
          <span className={`flex items-center gap-1 ${socketConnected ? "text-green-400" : "text-red-400"}`}>
            {socketConnected ? (
              <>
                <Icon name="check" size={14} className="text-green-400" />
                Connected
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                Disconnected
              </>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Socket ID:</span>
          <span className="text-gray-300 font-mono text-[10px]">
            {socketId ? socketId.slice(0, 8) : "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">My ID:</span>
          <span className="text-gray-300 font-mono text-[10px]">
            {mySocketId ? mySocketId.slice(0, 8) : "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Peers:</span>
          <span className="text-gray-300">{peers.size}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 mt-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
              Audio
            </p>
            <p className="text-sm font-semibold text-white">
              {isAudioEnabled ? "Live" : "Muted"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
              Video
            </p>
            <p className="text-sm font-semibold text-white">
              {isVideoEnabled ? "On" : "Off"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
              Bitrate
            </p>
            <p className="text-sm font-semibold text-white">
              {networkStats.bitrate ? `${networkStats.bitrate} kbps` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
              RTT
            </p>
            <p className="text-sm font-semibold text-white">
              {networkStats.rtt ? `${networkStats.rtt} ms` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
              Jitter
            </p>
            <p className="text-sm font-semibold text-white">
              {networkStats.jitter
                ? `${(networkStats.jitter * 1000).toFixed(1)} ms`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
              Updated
            </p>
            <p className="text-sm font-semibold text-white">
              {networkStats.lastUpdated
                ? new Date(networkStats.lastUpdated).toLocaleTimeString()
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

