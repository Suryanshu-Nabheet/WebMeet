"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useRoomStore } from "@/store/roomStore";
import {
  muteAllParticipants,
  unmuteAllParticipants,
  disableAllCameras,
  enableAllCameras,
  lockMeeting,
  unlockMeeting,
  endMeetingForAll,
  admitParticipant,
  rejectParticipant,
  muteParticipant,
  disableParticipantCamera,
} from "@/lib/admin/adminControls";

export default function AdminPanel() {
  const { isHost, isMeetingLocked, setIsMeetingLocked, waitingParticipants } = useRoomStore();
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  if (!isHost) {
    return null;
  }

  const handleLockToggle = () => {
    if (isMeetingLocked) {
      unlockMeeting();
      setIsMeetingLocked(false);
    } else {
      lockMeeting();
      setIsMeetingLocked(true);
    }
  };

  const handleEndMeeting = () => {
    endMeetingForAll();
    setShowConfirmEnd(false);
    // Redirect will be handled by socket event
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg border border-amber-500/30">
            <Icon name="crown" size={18} className="text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Host Controls</h3>
        </div>

        {/* Waiting Room */}
        {waitingParticipants.length > 0 && (
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="users" size={16} className="text-blue-400" />
              <h4 className="text-sm font-semibold text-white">
                Waiting Room ({waitingParticipants.length})
              </h4>
            </div>
            <div className="space-y-2">
              {waitingParticipants.map((participant: { userId: string; username: string; joinedAt: Date }) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between bg-black/30 rounded-lg p-2 border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {participant.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-white font-medium">{participant.username}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => admitParticipant(participant.userId, participant.username)}
                      className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/30 text-xs font-semibold transition-all"
                    >
                      Admit
                    </button>
                    <button
                      onClick={() => rejectParticipant(participant.userId, participant.username)}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 text-xs font-semibold transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meeting Controls */}
        <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl p-4 border border-zinc-700/50 space-y-3">
          <h4 className="text-sm font-semibold text-white mb-2">Meeting Controls</h4>
          
          {/* Lock Meeting */}
          <button
            onClick={handleLockToggle}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
              isMeetingLocked
                ? "bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name={isMeetingLocked ? "lock" : "unlock"} size={16} className={isMeetingLocked ? "text-amber-400" : "text-gray-400"} />
              <span className="text-sm font-medium text-white">
                {isMeetingLocked ? "Meeting Locked" : "Lock Meeting"}
              </span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all ${isMeetingLocked ? "bg-amber-500" : "bg-gray-600"} relative`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMeetingLocked ? "right-1" : "left-1"}`}></div>
            </div>
          </button>

          {/* Mute All */}
          <button
            onClick={muteAllParticipants}
            className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
          >
            <Icon name="mic-off" size={16} className="text-red-400" />
            <span className="text-sm font-medium text-white">Mute All Participants</span>
          </button>

          {/* Unmute All */}
          <button
            onClick={unmuteAllParticipants}
            className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
          >
            <Icon name="mic" size={16} className="text-green-400" />
            <span className="text-sm font-medium text-white">Unmute All Participants</span>
          </button>

          {/* Disable All Cameras */}
          <button
            onClick={disableAllCameras}
            className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
          >
            <Icon name="video-off" size={16} className="text-red-400" />
            <span className="text-sm font-medium text-white">Disable All Cameras</span>
          </button>

          {/* Enable All Cameras */}
          <button
            onClick={enableAllCameras}
            className="w-full flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
          >
            <Icon name="video" size={16} className="text-green-400" />
            <span className="text-sm font-medium text-white">Enable All Cameras</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl p-4 border border-red-500/30">
          <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <Icon name="alert-triangle" size={16} />
            Danger Zone
          </h4>
          
          {!showConfirmEnd ? (
            <button
              onClick={() => setShowConfirmEnd(true)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-all"
            >
              <Icon name="power" size={16} className="text-red-400" />
              <span className="text-sm font-semibold text-red-400">End Meeting for All</span>
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-2">
                This will end the meeting for all participants. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleEndMeeting}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Confirm End
                </button>
                <button
                  onClick={() => setShowConfirmEnd(false)}
                  className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
          <p className="text-xs text-blue-400">
            <Icon name="info" size={12} className="inline mr-1" />
            As the host, you have full control over this meeting. If you leave, the meeting will end for all participants.
          </p>
        </div>
      </div>
    </div>
  );
}
