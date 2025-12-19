"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoGrid from "@/components/video/VideoGrid";
import MediaControls from "@/components/video/MediaControls";
import Sidebar from "@/components/layout/Sidebar";
import MeetingEnded from "@/components/ui/MeetingEnded";
import Icon from "@/components/ui/Icon";
import { useRoomStore } from "@/store/roomStore";
import { initWebRTC } from "@/lib/webrtc";
import { toast } from "@/components/ui/toast";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const {
    peers,
    localStream,
    previewStream,
    mySocketId,
    meetingTitle,
    userName,
    meetingEnded,
    participants,
    isHost,
    mediaError,
    sidebarVisible,
    setRoomId,
    setMeetingTitle,
    setUserName,
    setLocalStream,
    setPreviewStream,
    setCameraStream,
    setCameraTrack,
    setScreenStream,
    setPeers,
    setMySocketId,
    setIsAudioEnabled,
    setIsVideoEnabled,
    setIsScreenSharing,
    setMediaError,
    activeScreenSharingId,
    setActiveScreenSharingId,
  } = useRoomStore();
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get userName and meetingTitle from sessionStorage on mount
  useEffect(() => {
    const storedName = sessionStorage.getItem("userName");
    const storedTitle = sessionStorage.getItem("meetingTitle");

    if (storedName) {
      setUserName(storedName);
    }
    if (storedTitle) {
      setMeetingTitle(storedTitle);
    }
  }, [setUserName, setMeetingTitle]);

  // Add current user to participants when socket ID is available
  useEffect(() => {
    if (mySocketId && userName) {
      const { addParticipant } = useRoomStore.getState();
      addParticipant(mySocketId, userName);
    }
  }, [mySocketId, userName]);

  // Set room ID in store
  useEffect(() => {
    if (roomId) {
      setRoomId(roomId);
    }
  }, [roomId, setRoomId]);

  // Update document title with meeting title
  useEffect(() => {
    if (meetingTitle) {
      document.title = `${meetingTitle} - WebMeet`;
    } else {
      document.title = "WebMeet - Premium Video Meetings";
    }
    return () => {
      document.title = "WebMeet - Premium Video Meetings";
    };
  }, [meetingTitle]);

  // Monitor socket connection and listen for room metadata
  useEffect(() => {
    const initSocket = async () => {
      const { getSocket } = await import("@/lib/socket");
      const socket = getSocket();

      const onConnect = () => {
        setIsConnected(true);
        setIsLoading(false);
      };

      const onDisconnect = () => {
        setIsConnected(false);
      };

      // Listen for room metadata (meeting title and host status)
      const onRoomMetadata = (metadata: {
        title?: string;
        createdAt?: Date;
        isHost?: boolean;
      }) => {
        if (metadata) {
          const { setMeetingTitle, setIsHost } = useRoomStore.getState();
          if (metadata.title && !meetingTitle) {
            setMeetingTitle(metadata.title);
          }
          if (metadata.isHost !== undefined) {
            setIsHost(metadata.isHost);
          }
        }
      };

      // Listen for meeting ended
      const onMeetingEnded = (data: { message: string }) => {
        const { setMeetingEnded } = useRoomStore.getState();
        setMeetingEnded(true);
        toast.info(data.message || "The meeting has ended");
      };

      // Listen for meeting ended success (host only)
      const onMeetingEndedSuccess = (data: { message: string }) => {
        toast.success(data.message || "Meeting ended successfully");
        router.push("/");
      };

      // Listen for errors
      const onError = (error: { message: string }) => {
        console.error("Socket error:", error.message);
        toast.error(error.message);
      };

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("room-metadata", onRoomMetadata);
      socket.on("meeting-ended", onMeetingEnded);
      socket.on("meeting-ended-success", onMeetingEndedSuccess);
      socket.on("error", onError);

      socket.on(
        "user-screen-share-status",
        (data: { userId: string; isSharing: boolean }) => {
          const { setActiveScreenSharingId } = useRoomStore.getState();
          if (data.isSharing) {
            setActiveScreenSharingId(data.userId);
            toast.info("A participant started screen sharing");
          } else {
            setActiveScreenSharingId(null);
          }
        }
      );

      if (socket.connected) {
        setIsConnected(true);
        setIsLoading(false);
      }

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("room-metadata", onRoomMetadata);
        socket.off("meeting-ended", onMeetingEnded);
        socket.off("meeting-ended-success", onMeetingEndedSuccess);
        socket.off("error", onError);
        socket.off("user-screen-share-status");
      };
    };

    initSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingTitle, setMeetingTitle]);

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}?token=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Meeting link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndMeeting = async () => {
    if (!isHost) {
      toast.error("Only the host can end the meeting");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to end the meeting for all participants?"
    );
    if (!confirmed) return;

    try {
      const { getSocket } = await import("@/lib/socket");
      const socket = getSocket();
      socket.emit("end-meeting");
      toast.info("Ending meeting...");
    } catch (error: any) {
      console.error("Error ending meeting:", error);
      toast.error("Failed to end meeting");
    }
  };

  useEffect(() => {
    if (!roomId) return;

    let cleanup: (() => void) | undefined;
    let stream: MediaStream | null = null;
    let mounted = true;

    const setupMedia = async () => {
      try {
        setIsLoading(true);
        // First, ensure socket is initialized
        const { getSocket } = await import("@/lib/socket");
        const socket = getSocket();

        // Wait for socket to connect with timeout
        if (!socket.connected) {
          console.log("⏳ Waiting for socket connection...");
          let connectionResolved = false;

          await new Promise<void>((resolve) => {
            if (socket.connected) {
              resolve();
              return;
            }

            // Set a reasonable timeout - don't block forever
            const connectionTimeout = setTimeout(() => {
              if (!connectionResolved) {
                connectionResolved = true;
                socket.off("connect", onConnect);
                socket.off("connect_error", onError);
                // Continue anyway - socket.io will reconnect in background
                console.log("⏳ Connection in progress, continuing setup...");
                resolve();
              }
            }, 8000); // 8 second timeout

            const onConnect = () => {
              if (!connectionResolved) {
                connectionResolved = true;
                clearTimeout(connectionTimeout);
                socket.off("connect", onConnect);
                socket.off("connect_error", onError);
                resolve();
              }
            };

            const onError = () => {
              // Silent - socket.io handles retries automatically
              // Don't spam console with errors
            };

            socket.on("connect", onConnect);
            socket.on("connect_error", onError);
          });
        }

        if (!mounted) {
          return;
        }

        // Check WebRTC support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "WebRTC is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari."
          );
        }

        // Adaptive video constraints based on device capabilities and network
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Try 1080p first, fallback to 720p for mobile or low-end devices
        const videoConstraints = isMobile
          ? {
              width: { ideal: 640, min: 480, max: 1280 },
              height: { ideal: 480, min: 360, max: 720 },
              facingMode: "user",
              frameRate: { ideal: 24, max: 30 },
            }
          : {
              width: { ideal: 1280, min: 640, max: 1280 },
              height: { ideal: 720, min: 480, max: 720 },
              facingMode: "user",
              frameRate: { ideal: 24, max: 30 },
            };

        // High-quality audio constraints with all enhancements
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Request high sample rate for better quality
          sampleRate: { ideal: 48000, min: 44100 },
          // Request stereo if available
          channelCount: { ideal: 2, min: 1 },
        };

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        // Apply additional track settings for optimal quality
        stream.getVideoTracks().forEach((track) => {
          const settings = track.getSettings();
          // Apply constraints to ensure quality
          track
            .applyConstraints({
              width: videoConstraints.width,
              height: videoConstraints.height,
              frameRate: videoConstraints.frameRate,
            })
            .catch((err) => {
              console.warn("Could not apply video constraints:", err);
            });
        });

        stream.getAudioTracks().forEach((track) => {
          // Apply audio constraints
          track.applyConstraints(audioConstraints).catch((err) => {
            console.warn("Could not apply audio constraints:", err);
          });
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const videoTrack = stream.getVideoTracks()[0] || null;
        setLocalStream(stream);
        setPreviewStream(stream);
        setCameraStream(stream.clone());
        setCameraTrack(videoTrack);
        setScreenStream(null);
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);
        setIsScreenSharing(false);

        console.log("🎥 Media stream obtained, initializing WebRTC...");
        // Get userName and meetingTitle for WebRTC
        const currentUserName =
          userName ||
          sessionStorage.getItem("userName") ||
          `User-${Date.now()}`;
        const currentMeetingTitle =
          meetingTitle || sessionStorage.getItem("meetingTitle") || null;

        // Store meeting title in sessionStorage for WebRTC to use
        if (currentMeetingTitle) {
          sessionStorage.setItem("meetingTitle", currentMeetingTitle);
        }
        sessionStorage.setItem("userName", currentUserName);

        // Initialize WebRTC connections - it will handle join-room internally
        // This ensures event listeners are set up before joining
        cleanup = await initWebRTC(
          roomId,
          stream,
          setPeers,
          setMySocketId,
          currentUserName
        );

        if (mounted) {
          setIsConnected(true);
          setIsLoading(false);
          setMediaError(null);
          console.log("✅ WebRTC initialized");
        }
      } catch (error: any) {
        console.error("❌ Error setting up media/WebRTC:", error);
        if (mounted) {
          setIsLoading(false);
          if (
            error.name === "NotAllowedError" ||
            error.name === "PermissionDeniedError"
          ) {
            toast.error(
              "Please allow camera and microphone access to join the room"
            );
          } else if (
            error.message?.includes("Socket") ||
            error.message?.includes("connection")
          ) {
            toast.error(
              "Failed to connect to server. Please ensure the backend server is running on port 3001."
            );
            console.error("Socket connection error details:", error);
          } else {
            toast.error(`Error: ${error.message || "Failed to setup media"}`);
          }
        }
      }
    };

    setupMedia();

    return () => {
      console.log("🧹 Cleaning up room page");
      mounted = false;
      if (cleanup) {
        cleanup();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setLocalStream(null);
      setPreviewStream(null);
      setCameraStream(null);
      setCameraTrack(null);
      setScreenStream(null);
      setIsScreenSharing(false);
      setPeers(new Map());
      // Clear session storage for this room
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`hasJoinedRoom_${roomId}`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userName]);

  // Show meeting ended screen if meeting has ended
  if (meetingEnded) {
    return <MeetingEnded message="The host has left the meeting" />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex flex-col overflow-hidden">
      {/* Header - Refined and compact */}
      <div className="bg-black border-b border-zinc-800/50 px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 flex-shrink-0 shadow-xl shadow-black/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 flex-1 min-w-0 w-full sm:w-auto">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Icon
                  name="video"
                  size={14}
                  className="text-white sm:w-4 sm:h-4"
                />
              </div>
              <h1 className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent whitespace-nowrap">
                WebMeet
              </h1>
            </div>

            {/* Meeting Title */}
            {meetingTitle && (
              <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-zinc-800/60 rounded-lg border border-zinc-700/50 max-w-[100px] sm:max-w-[140px] lg:max-w-xs">
                <p
                  className="text-[10px] sm:text-xs text-gray-300 font-medium truncate"
                  title={meetingTitle}
                >
                  {meetingTitle}
                </p>
              </div>
            )}

            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/60 rounded-lg border border-zinc-700/50">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isConnected
                    ? "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"
                    : "bg-red-500 shadow-lg shadow-red-500/50"
                }`}
              />
              <span className="text-[10px] sm:text-xs text-gray-300 font-medium whitespace-nowrap">
                {isConnected ? "Connected" : "Connecting..."}
              </span>
            </div>

            {/* Room ID - Desktop only */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/60 rounded-lg border border-zinc-700/50">
              <Icon name="hash" size={12} className="text-gray-500" />
              <p
                className="text-[10px] text-gray-400 font-mono truncate max-w-[100px]"
                title={roomId}
              >
                {roomId}
              </p>
            </div>

            {/* Share Button */}
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-blue-500/40 rounded-lg transition-all duration-200 group"
              title="Copy meeting link"
            >
              {copied ? (
                <>
                  <Icon name="check" size={12} className="text-green-400" />
                  <span className="hidden sm:inline text-[10px] sm:text-xs text-green-400 font-medium">
                    Copied
                  </span>
                </>
              ) : (
                <>
                  <Icon
                    name="copy"
                    size={12}
                    className="text-gray-400 group-hover:text-blue-400 transition-colors"
                  />
                  <span className="hidden sm:inline text-[10px] sm:text-xs text-gray-400 group-hover:text-blue-400 font-medium transition-colors">
                    Share
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Section - Host Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isHost && (
              <button
                onClick={handleEndMeeting}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 whitespace-nowrap flex items-center justify-center gap-1.5"
                title="End meeting for all participants"
              >
                <Icon name="power" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>End Meeting</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Media Error Banner */}
      {mediaError && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-200 text-xs sm:text-sm px-4 py-2.5 text-center flex items-center justify-center gap-2">
          <Icon name="alert-triangle" size={14} />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-zinc-800/50"></div>
                <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-gray-300 text-sm font-medium">
                Setting up your connection
              </p>
              <p className="text-gray-500 text-xs">Please wait...</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500">
          {/* Main Stage (Screen Share) */}
          {(activeScreenSharingId ||
            (localStream && useRoomStore.getState().isScreenSharing)) && (
            <div
              className={`
              ${sidebarVisible ? "lg:w-[50%]" : "lg:w-[70%]"} 
              w-full border-r border-zinc-800/50 flex flex-col transition-all duration-300 rounded-tl-2xl overflow-hidden
            `}
            >
              {/* Screen Share View */}
              <div className="w-full h-full bg-black flex items-center justify-center p-4">
                <VideoGrid
                  peers={peers}
                  localStream={localStream}
                  previewStream={previewStream}
                  mySocketId={mySocketId}
                  participants={participants}
                  userName={userName}
                  isMainStage={true}
                  mainStageId={
                    activeScreenSharingId ||
                    (useRoomStore.getState().isScreenSharing
                      ? mySocketId
                      : null)
                  }
                />
              </div>
            </div>
          )}

          {/* Video Strip - Participants */}
          <div
            className={`
              w-full bg-gradient-to-br from-zinc-950 to-black p-2 sm:p-3 overflow-hidden transition-all duration-300 rounded-tl-2xl
              ${
                activeScreenSharingId || useRoomStore.getState().isScreenSharing
                  ? sidebarVisible
                    ? "lg:w-[25%] border-l border-zinc-800/50"
                    : "lg:w-[30%] border-l border-zinc-800/50"
                  : sidebarVisible
                  ? "lg:w-[75%]"
                  : "lg:w-full"
              }
            `}
          >
            <VideoGrid
              peers={peers}
              localStream={localStream}
              previewStream={previewStream}
              mySocketId={mySocketId}
              participants={participants}
              userName={userName}
              isStrip={
                !!activeScreenSharingId ||
                useRoomStore.getState().isScreenSharing
              }
              excludeId={null}
            />
          </div>

          {/* Sidebar - Chat/Participants */}
          <div
            className={`${
              sidebarVisible ? "block" : "hidden"
            } w-full lg:w-[25%] lg:min-w-[300px] max-h-[40vh] lg:max-h-none border-t lg:border-t-0 lg:border-l border-zinc-800/50 bg-zinc-900/50 transition-all duration-300 rounded-tl-2xl overflow-hidden`}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* Media Controls */}
      {!isLoading && (
        <MediaControls
          onLeave={() => {
            router.push("/");
          }}
        />
      )}
    </div>
  );
}
