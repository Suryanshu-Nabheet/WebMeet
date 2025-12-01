"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { useRoomStore } from "@/store/roomStore";

interface PeerData {
  peer: any;
  stream: MediaStream;
  screenStream?: MediaStream;
}

interface UserInfo {
  id: string;
  username: string;
  isHost?: boolean;
}

interface VideoGridProps {
  peers: Map<string, PeerData>;
  localStream: MediaStream | null;
  previewStream: MediaStream | null;
  mySocketId: string | null;
  participants: Map<string, UserInfo>;
  userName: string | null;
  isMainStage?: boolean;
  mainStageId?: string | null;
  isStrip?: boolean;
  excludeId?: string | null;
}

// Calculate grid layout - responsive based on screen size
function calculateGrid(
  totalParticipants: number,
  isMobile: boolean,
  isStrip: boolean
): { cols: number; rows: number } {
  if (totalParticipants === 0) return { cols: 1, rows: 1 };

  // If in strip mode, stack vertically (1 column)
  if (isStrip) {
    return { cols: 1, rows: totalParticipants };
  }

  if (totalParticipants === 1) return { cols: 1, rows: 1 };

  if (isMobile) {
    // Mobile: simpler grid, max 2 columns
    if (totalParticipants === 2) return { cols: 1, rows: 2 }; // Stack vertically on mobile for 2
    if (totalParticipants <= 4) return { cols: 2, rows: 2 };
    if (totalParticipants <= 6) return { cols: 2, rows: 3 };
    // For more on mobile, use 2 columns
    return { cols: 2, rows: Math.ceil(totalParticipants / 2) };
  }

  // Desktop: more flexible grid
  if (totalParticipants === 2) return { cols: 2, rows: 1 };
  if (totalParticipants <= 4) return { cols: 2, rows: 2 };
  if (totalParticipants <= 6) return { cols: 3, rows: 2 };
  if (totalParticipants <= 9) return { cols: 3, rows: 3 };
  if (totalParticipants <= 12) return { cols: 4, rows: 3 };
  if (totalParticipants <= 16) return { cols: 4, rows: 4 };
  if (totalParticipants <= 20) return { cols: 5, rows: 4 };
  if (totalParticipants <= 25) return { cols: 5, rows: 5 };

  // For larger numbers, prioritize visibility over perfect squares
  const cols = Math.ceil(Math.sqrt(totalParticipants));
  const rows = Math.ceil(totalParticipants / cols);
  return { cols, rows };
}

export default function VideoGrid({
  peers,
  localStream,
  previewStream,
  mySocketId,
  participants,
  userName,
  isMainStage = false,
  mainStageId = null,
  isStrip = false,
  excludeId = null,
}: VideoGridProps) {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const { activeScreenSharingId, isScreenSharing, cameraStream } =
    useRoomStore();

  // Determine which stream to show for local user
  // If in strip mode and sharing screen, show camera stream (if available)
  // Otherwise show standard display stream (which might be screen or camera)
  const displayStream =
    isStrip && isScreenSharing
      ? cameraStream || localStream
      : previewStream || localStream;

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Set local video stream - prevent flickering by checking if already set
    if (localVideoRef.current && displayStream) {
      if (localVideoRef.current.srcObject !== displayStream) {
        localVideoRef.current.srcObject = displayStream;
        setIsLoading(false);
      }
    } else if (!displayStream) {
      setIsLoading(true);
    }

    // Set peer streams - prevent flickering
    peers.forEach((peerData, userId) => {
      const videoElement = videoRefs.current.get(userId);
      if (videoElement && peerData.stream) {
        // Only set remote streams (not local stream placeholders)
        const isRemoteStream = peerData.stream !== displayStream;
        if (isRemoteStream && videoElement.srcObject !== peerData.stream) {
          videoElement.srcObject = peerData.stream;
        }
      }
    });

    // Clean up video elements for removed peers
    const currentUserIds = new Set(peers.keys());
    videoRefs.current.forEach((element, userId) => {
      if (!currentUserIds.has(userId)) {
        if (element.srcObject) {
          const stream = element.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          element.srcObject = null;
        }
        videoRefs.current.delete(userId);
      }
    });
  }, [peers, displayStream]);

  // Filter peers based on props
  const remotePeers = Array.from(peers.entries()).filter(
    ([userId, peerData]) => {
      // Basic check: must have stream and not be local placeholder
      if (!peerData.stream || peerData.stream === displayStream) return false;

      // If Main Stage: only show the main stage user
      if (isMainStage) {
        return userId === mainStageId;
      }

      // If Strip: exclude the main stage user
      if (excludeId && userId === excludeId) return false;

      return true;
    }
  );

  // Determine if local user should be shown
  const showLocal =
    !isMainStage && (!excludeId || mySocketId !== excludeId) && displayStream;

  // If Main Stage and local user is the main stage (screen sharing)
  const showLocalMain =
    isMainStage && mainStageId === mySocketId && displayStream;

  const totalParticipants =
    remotePeers.length + (showLocal || showLocalMain ? 1 : 0);
  const { cols, rows } = calculateGrid(totalParticipants, isMobile, isStrip);

  if (totalParticipants === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-6 animate-in fade-in duration-700">
          <div className="relative inline-flex">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse"></div>
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full border-4 border-zinc-800/50 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-t-blue-500 border-r-blue-400 border-b-transparent border-l-transparent animate-spin"></div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 text-base font-medium">
              Waiting for participants...
            </p>
            <p className="text-gray-500 text-sm">
              Invite others to join the meeting
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Grid container – scrollable and responsive
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden">
      <div
        className="grid gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 w-full transition-all duration-500 ease-out p-1 sm:p-0"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          // Use auto rows to prevent cutting off, but try to fit in viewport if possible
          gridAutoRows: rows > 2 ? "minmax(150px, 1fr)" : "minmax(0, 1fr)",
          minHeight: rows > 2 ? "min-content" : "100%",
          height: rows > 2 ? "auto" : "100%",
        }}
      >
        {/* Local video */}
        {(showLocal || showLocalMain) && (
          <div
            className="video-tile-wrapper group"
            onMouseEnter={() => setHoveredVideo("local")}
            onMouseLeave={() => setHoveredVideo(null)}
          >
            <div
              className={`relative h-full rounded-md sm:rounded-lg lg:rounded-xl overflow-hidden border transition-all duration-200 ${
                hoveredVideo === "local"
                  ? "border-blue-500/40 shadow-lg shadow-blue-500/20"
                  : "border-zinc-800/50 shadow-md"
              }`}
            >
              {/* Video element */}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none"></div>

              {/* Top right indicators */}
              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 flex items-center gap-1 sm:gap-1.5">
                {/* Connection indicator */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-black/60 backdrop-blur-md px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-[9px] border border-white/10">
                  <div className="relative">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                    <div className="absolute inset-0 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                  <span className="font-medium text-white hidden xs:inline">
                    Live
                  </span>
                </div>
              </div>

              {/* Bottom info bar - more compact on mobile */}
              <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-black/70 backdrop-blur-xl px-1.5 sm:px-2 py-1 sm:py-1.5 rounded border border-white/10 shadow-lg">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold shadow-lg">
                      {(userName || "You").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-[10px] sm:text-xs font-semibold truncate max-w-[80px] sm:max-w-none">
                        {userName || "You"}
                      </span>
                      <span className="text-blue-400 text-[8px] sm:text-[9px] font-medium">
                        You
                      </span>
                    </div>
                  </div>

                  {/* Audio indicator */}
                  <div className="flex items-center gap-0.5 bg-black/70 backdrop-blur-xl px-1 sm:px-1.5 py-1 sm:py-1.5 rounded border border-white/10">
                    <Icon
                      name="mic"
                      size={10}
                      className="sm:w-3 sm:h-3 text-green-400"
                    />
                    <div className="flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-green-400 rounded-full audio-bar"
                          style={{
                            height: `${4 + i * 2}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover overlay with actions - more subtle */}
              {hoveredVideo === "local" && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-200">
                  {/* Button removed as per request */}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Peer videos - only show peers with remote streams */}
        {remotePeers.map(([userId, peerData], index) => {
          const participant = participants.get(userId);
          const displayName = participant?.username || userId.slice(0, 8);
          const isHost = participant?.isHost || false;

          // Check if this peer is the active screen sharer
          const isSharer = userId === activeScreenSharingId;

          // Determine which stream to show
          // If Main Stage and this is the sharer, show their screen stream
          // Otherwise show their camera stream
          const streamToShow =
            isMainStage && isSharer && peerData.screenStream
              ? peerData.screenStream
              : peerData.stream;

          // Show video if stream exists and is not muted
          // Note: We no longer force video off for sharer in strip, because we now have separate streams!
          const showVideo =
            streamToShow &&
            streamToShow.getVideoTracks().length > 0 &&
            !streamToShow.getVideoTracks()[0].muted;

          return (
            <div
              key={userId}
              className="video-tile-wrapper group animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 80}ms` }}
              onMouseEnter={() => setHoveredVideo(userId)}
              onMouseLeave={() => setHoveredVideo(null)}
            >
              <div
                className={`relative h-full rounded-lg lg:rounded-xl overflow-hidden border transition-all duration-200 ${
                  hoveredVideo === userId
                    ? "border-green-500/40 shadow-lg shadow-green-500/20"
                    : "border-zinc-800/50 shadow-md"
                }`}
              >
                {showVideo ? (
                  <video
                    ref={(el) => {
                      if (el) {
                        el.srcObject = streamToShow;
                        if (!videoRefs.current.has(userId)) {
                          videoRefs.current.set(userId, el);
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center shadow-inner">
                      <span className="text-2xl font-bold text-zinc-400">
                        {displayName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Gradient overlays - Only show if video is on */}
                {showVideo && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none"></div>
                )}

                {/* Top right indicators */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  {isHost && (
                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-md px-2 py-1 rounded-md border border-amber-400/30 shadow-lg">
                      <Icon name="crown" size={10} className="text-white" />
                      <span className="text-[9px] font-bold text-white hidden sm:inline">
                        HOST
                      </span>
                    </div>
                  )}
                  {/* Connection indicator */}
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                    <div className="relative">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>

                {/* Bottom info bar - more compact */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xl px-2 py-1.5 rounded-md border border-white/10 shadow-lg max-w-[70%]">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shadow-lg flex-shrink-0">
                        {displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-xs font-semibold truncate">
                          {displayName}
                        </span>
                        <span className="text-green-400 text-[9px] font-medium">
                          Participant
                        </span>
                      </div>
                    </div>

                    {/* Audio indicator */}
                    <div className="flex items-center gap-0.5 bg-black/70 backdrop-blur-xl px-1.5 py-1.5 rounded-md border border-white/10">
                      <Icon name="mic" size={12} className="text-green-400" />
                      <div className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-green-400 rounded-full audio-bar"
                            style={{
                              height: `${6 + i * 2}px`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
