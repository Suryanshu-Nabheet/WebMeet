import Peer from "simple-peer";
import { useRoomStore } from "@/store/roomStore";
import { getSocket } from "./socket";
import { toast } from "@/components/ui/toast";

interface PeerData {
  peer: Peer.Instance;
  stream: MediaStream;
  isInitiator: boolean;
  isProcessing: boolean; // Track if peer is currently processing a signal
  signalQueue: any[]; // Queue for signals that arrive before peer is ready
}

export const initWebRTC = async (
  roomId: string,
  localStream: MediaStream,
  setPeers: (peers: Map<string, PeerData>) => void,
  setMySocketId: (id: string | null) => void,
  userName?: string
) => {
  const socket = getSocket();
  const peers = new Map<string, PeerData>();
  let mySocketId: string | null = null;
  let isCleaningUp = false;
  const statsIntervals = new Map<string, number>();

  // Wait for socket to connect - non-blocking with proper timeout
  const waitForConnection = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      // If already connected, return immediately
      if (socket.connected && socket.id) {
        const socketId = socket.id;
        mySocketId = socketId;
        setMySocketId(socketId);
        resolve(socketId);
        return;
      }

      let resolved = false;
      const connectionTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.off("connect", onConnect);
          socket.off("connect_error", onError);
          // Don't reject - let socket.io handle reconnection
          // Just resolve with a promise that will wait for actual connection
          console.log("⏳ Connection taking longer than expected, continuing in background...");
          // Wait a bit more, then check if connected
          setTimeout(() => {
            if (socket.connected && socket.id) {
              const socketId = socket.id;
              mySocketId = socketId;
              setMySocketId(socketId);
              resolve(socketId);
            } else {
              // Continue waiting - socket.io will reconnect
              waitForConnection().then(resolve).catch(reject);
            }
          }, 2000);
        }
      }, 5000); // Reduced to 5 seconds for faster connection

      const onConnect = () => {
        if (!resolved && socket.id) {
          resolved = true;
          clearTimeout(connectionTimeout);
          const socketId = socket.id;
          mySocketId = socketId;
          setMySocketId(socketId);
          socket.off("connect", onConnect);
          socket.off("connect_error", onError);
          resolve(socketId);
        }
      };

      const onError = () => {
        // Don't reject on error - socket.io handles reconnection
        // Just wait for the next connection attempt
      };

      socket.on("connect", onConnect);
      socket.on("connect_error", onError);
    });
  };

  try {
    const connectedSocketId = await waitForConnection();
    mySocketId = connectedSocketId;
    console.log("🔌 Socket connected, ID:", mySocketId);
  } catch (error) {
    console.error("❌ Failed to connect socket:", error);
    throw error;
  }

  // Remove peer
  const removePeer = (userId: string | null | undefined) => {
    if (!userId || isCleaningUp) return;
    const peerData = peers.get(userId);
    if (peerData) {
      try {
        if (!peerData.peer.destroyed) {
          peerData.peer.destroy();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      peers.delete(userId);
      setPeers(new Map(peers));
    }
  };

  // Process queued signals for a peer
  const processSignalQueue = (userId: string) => {
    const peerData = peers.get(userId);
    if (!peerData || peerData.isProcessing || peerData.signalQueue.length === 0 || isCleaningUp) {
      return;
    }

    // Don't process if peer is already connected
    if (peerData.peer.connected) {
      console.log(`ℹ️ Peer ${userId} already connected, clearing signal queue`);
      peerData.signalQueue = [];
      peers.set(userId, { ...peerData });
      setPeers(new Map(peers));
      return;
    }

    // Mark as processing
    peerData.isProcessing = true;
    peers.set(userId, { ...peerData });
    setPeers(new Map(peers));
    
    const signal = peerData.signalQueue.shift();
    
    if (signal && !peerData.peer.destroyed && !isCleaningUp) {
      try {
        peerData.peer.signal(signal);
        console.log(`✅ Processed queued ${signal.type} signal for ${userId}`);
      } catch (error: any) {
        console.error(`❌ Error processing queued signal for ${userId}:`, error);
        // If state error, don't retry - just skip
        if (error.message?.includes("state") || error.message?.includes("stable")) {
          console.log(`⏸️ Skipping queued signal due to state error for ${userId}`);
        }
      }
    }

    // Mark as not processing
    peerData.isProcessing = false;
    peers.set(userId, { ...peerData });
    setPeers(new Map(peers));

    // Process next signal in queue if any
    if (peerData.signalQueue.length > 0 && !isCleaningUp) {
      setTimeout(() => processSignalQueue(userId), 200);
    }
  };

  // Create peer connection
  const createPeer = (
    userId: string | null | undefined,
    initiator: boolean
  ): Peer.Instance | null => {
    if (!mySocketId || !userId || userId === mySocketId || isCleaningUp) {
      return null;
    }

    // Remove existing peer if any
    if (peers.has(userId)) {
      removePeer(userId);
    }

    console.log(
      `🔗 Creating peer for ${userId} as ${initiator ? "INITIATOR" : "ANSWERER"}`
    );

    // Enhanced ICE server configuration with multiple STUN servers
    // Note: For production, add TURN servers for better connectivity behind NATs
    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      // Add TURN servers if available via environment variables
      ...(process.env.NEXT_PUBLIC_TURN_SERVER_URL
        ? [
            {
              urls: process.env.NEXT_PUBLIC_TURN_SERVER_URL,
              username: process.env.NEXT_PUBLIC_TURN_USERNAME || "",
              credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "",
            },
          ]
        : []),
    ];

    const peer = new Peer({
      initiator,
      trickle: true, // Enable trickle ICE for faster connection
      stream: localStream,
      config: {
        iceServers,
        iceCandidatePoolSize: 10, // Pre-gather ICE candidates
        iceTransportPolicy: "all", // Use both relay and non-relay candidates
      },
    });

    peer.on("signal", (signal) => {
      if (peer.destroyed || !socket.connected || !mySocketId || isCleaningUp) {
        console.warn(`⚠️ Cannot send ${signal.type} signal to ${userId}:`, {
          peerDestroyed: peer.destroyed,
          socketConnected: socket.connected,
          mySocketId: mySocketId,
          isCleaningUp: isCleaningUp
        });
        return;
      }
      console.log(`📤 Sending ${signal.type} signal to ${userId}`, signal.type === "offer" ? "(INITIATOR)" : signal.type === "answer" ? "(ANSWERER)" : "");
      socket.emit("signal", { to: userId, signal, from: mySocketId });
    });

    peer.on("stream", (remoteStream) => {
      if (peer.destroyed || !userId || isCleaningUp) {
        return;
      }
      console.log("✅ Received stream from", userId, "- Video tracks:", remoteStream.getVideoTracks().length, "Audio tracks:", remoteStream.getAudioTracks().length);
      const peerData = peers.get(userId);
      if (peerData) {
        // Update with remote stream, preserve processing state and queue
        peers.set(userId, {
          peer: peerData.peer,
          stream: remoteStream,
          isInitiator: peerData.isInitiator,
          isProcessing: peerData.isProcessing,
          signalQueue: peerData.signalQueue,
        });
        setPeers(new Map(peers));
        console.log("📹 Stream updated in peers map for", userId);
      } else {
        console.warn("⚠️ No peer data found for", userId, "when stream received");
      }
    });

    peer.on("error", (err) => {
      console.error("❌ Peer error for", userId, ":", err);
      // Try to recreate peer on error (with delay to avoid loops)
      if (!isCleaningUp && userId) {
        setTimeout(() => {
          if (!isCleaningUp && !peers.has(userId)) {
            console.log("🔄 Attempting to recreate peer after error:", userId);
            createPeer(userId, initiator);
          }
        }, 2000);
      }
    });

    peer.on("close", () => {
      console.log("🔌 Peer closed for", userId);
      removePeer(userId);
    });

    peer.on("connect", () => {
      console.log("✅ Peer connected for", userId);
      // Verify connection is working
      if (peer.connected) {
        console.log("🔗 Peer connection verified for", userId);
      }
      if (userId) {
        startStatsMonitor(peer, userId);
      }
    });
    const startStatsMonitor = (peerConnection: Peer.Instance, peerId: string) => {
      if (typeof window === "undefined") return;
      const connection = (peerConnection as any)?._pc;
      if (!connection) return;

      const interval = window.setInterval(async () => {
        try {
          const stats = await connection.getStats();
          let bitrate = 0;
          let jitter = 0;
          let rtt = 0;

          stats.forEach((report: any) => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              bitrate = report.availableOutgoingBitrate || bitrate;
              rtt = report.currentRoundTripTime || rtt;
            }
            if (report.type === "remote-inbound-rtp" && report.kind === "video") {
              jitter = report.jitter || jitter;
            }
          });

          useRoomStore
            .getState()
            .setNetworkStats({
              bitrate: Math.round((bitrate || 0) / 1000),
              jitter: Number((jitter || 0).toFixed(3)),
              rtt: Number(((rtt || 0) * 1000).toFixed(1)),
              lastUpdated: Date.now(),
            });
        } catch (error) {
          console.warn("Unable to fetch peer stats", error);
        }
      }, 4000);

      statsIntervals.set(peerId, interval);
      const clearMonitor = () => {
        clearInterval(interval);
        statsIntervals.delete(peerId);
      };

      peerConnection.on("close", clearMonitor);
      peerConnection.on("error", clearMonitor);
    };


    // Store peer with local stream initially (placeholder until remote stream arrives)
    if (userId && !isCleaningUp) {
      peers.set(userId, {
        peer,
        stream: localStream, // Placeholder - will be replaced when remote stream arrives
        isInitiator: initiator,
        isProcessing: false,
        signalQueue: [],
      });
      setPeers(new Map(peers));
    }

    return peer;
  };

  // Set up all event listeners FIRST before joining room
  // This ensures we don't miss any events
  
  // Listen for room metadata (meeting title and host status)
  socket.on("room-metadata", (metadata: { title?: string; createdAt?: Date; isHost?: boolean }) => {
    if (isCleaningUp || typeof window === "undefined" || !metadata) return;
    const store = useRoomStore.getState();
    if (metadata.title && !store.meetingTitle) {
      store.setMeetingTitle(metadata.title);
    }
    if (metadata.isHost !== undefined) {
      store.setIsHost(metadata.isHost);
      console.log(metadata.isHost ? "🏠 You are the host" : "👤 You are a participant");
    }
  });

  // When joining, new user creates peers as initiators for all existing users
  socket.on("room-users", (users: Array<{ id: string; username: string; isHost?: boolean }>) => {
    if (isCleaningUp) return;
    console.log("📋 Room users received:", users.length, "users");
    
    // Update participants store with host info
    if (typeof window !== "undefined") {
      const store = useRoomStore.getState();
      const newParticipants = new Map(store.participants);
      users.forEach((user) => {
        if (user && user.id && user.username) {
          newParticipants.set(user.id, { 
            id: user.id, 
            username: user.username,
            isHost: user.isHost || false,
          });
        }
      });
      store.setParticipants(newParticipants);
    }
    
    if (users && users.length > 0) {
      // Create peers for existing users with a small delay to ensure socket is ready
      setTimeout(() => {
        if (isCleaningUp) return;
        users.forEach((user) => {
          if (
            user &&
            user.id &&
            user.id !== mySocketId &&
            !peers.has(user.id)
          ) {
            console.log("🔗 Creating peer as INITIATOR for existing user:", user.id);
            createPeer(user.id, true);
          }
        });
      }, 500); // Increased delay to ensure everything is ready
    }
  });

  // When a new user joins, existing users create peer as answerer
  socket.on("user-joined", (userData: { id: string; username: string; isHost?: boolean }) => {
    if (isCleaningUp) return;
    console.log("👤 User joined:", userData.id, userData.username, userData.isHost ? "(Host)" : "");
    
    // Show toast notification
    if (typeof window !== "undefined" && userData.username) {
      toast.success(`${userData.username} joined the meeting`);
    }
    
    // Update participants store with host info
    if (typeof window !== "undefined" && userData.id && userData.username) {
      const store = useRoomStore.getState();
      store.addParticipant(userData.id, userData.username, userData.isHost || false);
    }
    
    const userId = userData?.id;
    if (userId && userId !== mySocketId && !peers.has(userId)) {
      console.log("🔗 Creating peer as ANSWERER for new user:", userId);
      setTimeout(() => {
        if (!isCleaningUp && !peers.has(userId)) {
          createPeer(userId, false);
        }
      }, 500); // Increased delay for stability
    }
  });

  // When user leaves
  socket.on("user-left", (userId: string | null | undefined) => {
    if (isCleaningUp) return;
    console.log("👋 User left:", userId);
    
    // Get username before removing
    let username = "Someone";
    if (typeof window !== "undefined" && userId) {
      const store = useRoomStore.getState();
      const participant = store.participants.get(userId);
      if (participant) {
        username = participant.username;
        toast.info(`${username} left the meeting`);
      }
      store.removeParticipant(userId);
    }
    
    removePeer(userId);
  });

  // Handle signaling with proper state management
  socket.on("signal", ({ from, signal }: { from: string; signal: any }) => {
    if (
      isCleaningUp ||
      !mySocketId ||
      !from ||
      from === mySocketId ||
      !signal ||
      !signal.type
    ) {
      return;
    }

    console.log(`📥 Received ${signal.type} signal from ${from}`);
    let peerData = peers.get(from);

    if (peerData) {
      // Peer exists
      if (peerData.peer.destroyed) {
        console.log("🔄 Peer destroyed, recreating for", from);
        removePeer(from);
        const isInitiator = signal.type !== "offer";
        const newPeer = createPeer(from, isInitiator);
        if (newPeer) {
          // Wait for peer to be ready before signaling
          setTimeout(() => {
            const newPeerData = peers.get(from);
            if (newPeerData && !newPeerData.peer.destroyed && !isCleaningUp) {
              try {
                newPeerData.peer.signal(signal);
                console.log(`✅ Applied ${signal.type} signal to recreated peer:`, from);
              } catch (e) {
                console.error("❌ Error signaling recreated peer:", e);
                // Queue signal for later processing
                if (newPeerData) {
                  newPeerData.signalQueue.push(signal);
                  processSignalQueue(from);
                }
              }
            }
          }, 300);
        }
      } else {
        // Check if peer is already connected or in wrong state
        // Don't process signals if peer is already connected
        if (peerData.peer.connected) {
          console.log(`ℹ️ Peer ${from} already connected, ignoring ${signal.type} signal`);
          return;
        }

        // Check if peer is currently processing a signal
        if (peerData.isProcessing) {
          console.log(`⏳ Peer ${from} is processing, queuing ${signal.type} signal`);
          peerData.signalQueue.push(signal);
          peers.set(from, { ...peerData });
          setPeers(new Map(peers));
          return;
        }

        // Apply signal to existing peer
        try {
          peerData.isProcessing = true;
          peers.set(from, { ...peerData });
          setPeers(new Map(peers));
          
          peerData.peer.signal(signal);
          console.log(`✅ Applied ${signal.type} signal to peer:`, from);
          
          peerData.isProcessing = false;
          peers.set(from, { ...peerData });
          setPeers(new Map(peers));
          
          // Process any queued signals
          if (peerData.signalQueue.length > 0) {
            setTimeout(() => processSignalQueue(from), 200);
          }
        } catch (error: any) {
          peerData.isProcessing = false;
          peers.set(from, { ...peerData });
          setPeers(new Map(peers));
          console.error("❌ Error signaling peer:", error);
          
          // If state error, queue the signal and wait
          if (
            error.message?.includes("state") ||
            error.message?.includes("stable") ||
            error.message?.includes("destroyed") ||
            error.message?.includes("InvalidStateError")
          ) {
            console.log(`⏸️ Peer ${from} in wrong state, queuing ${signal.type} signal`);
            peerData.signalQueue.push(signal);
            peers.set(from, { ...peerData });
            setPeers(new Map(peers));
            // Try processing queue after a delay
            setTimeout(() => processSignalQueue(from), 1000);
          } else {
            // For other errors, try recreating peer
            console.log("🔄 Recreating peer due to error");
            removePeer(from);
            const isInitiator = signal.type !== "offer";
            const newPeer = createPeer(from, isInitiator);
            if (newPeer) {
              setTimeout(() => {
                const newPeerData = peers.get(from);
                if (newPeerData && !newPeerData.peer.destroyed && !isCleaningUp) {
                  try {
                    newPeerData.isProcessing = true;
                    peers.set(from, { ...newPeerData });
                    setPeers(new Map(peers));
                    newPeerData.peer.signal(signal);
                    newPeerData.isProcessing = false;
                    peers.set(from, { ...newPeerData });
                    setPeers(new Map(peers));
                  } catch (e) {
                    newPeerData.isProcessing = false;
                    peers.set(from, { ...newPeerData });
                    setPeers(new Map(peers));
                    console.error("Error signaling new peer:", e);
                    newPeerData.signalQueue.push(signal);
                    processSignalQueue(from);
                  }
                }
              }, 500);
            }
          }
        }
      }
    } else {
      // No peer exists - create one based on signal type
      const isInitiator = signal.type !== "offer";
      console.log(
        `📡 Creating new peer as ${isInitiator ? "INITIATOR" : "ANSWERER"} for ${from}`
      );
      const peer = createPeer(from, isInitiator);
      if (peer) {
        // Wait for peer to be fully initialized
        setTimeout(() => {
          const newPeerData = peers.get(from);
          if (newPeerData && !newPeerData.peer.destroyed && !isCleaningUp) {
            try {
              newPeerData.isProcessing = true;
              peers.set(from, { ...newPeerData });
              setPeers(new Map(peers));
              newPeerData.peer.signal(signal);
              console.log(`✅ Applied ${signal.type} signal to new peer:`, from);
              newPeerData.isProcessing = false;
              peers.set(from, { ...newPeerData });
              setPeers(new Map(peers));
            } catch (error: any) {
              newPeerData.isProcessing = false;
              peers.set(from, { ...newPeerData });
              setPeers(new Map(peers));
              console.error("❌ Error signaling new peer:", error);
              // Queue signal for later
              newPeerData.signalQueue.push(signal);
              peers.set(from, { ...newPeerData });
              setPeers(new Map(peers));
              setTimeout(() => processSignalQueue(from), 1000);
            }
          }
        }, 500);
      }
    }
  });

  // Listen for meeting ended event
  socket.on("meeting-ended", (data: { message: string }) => {
    if (isCleaningUp) return;
    console.log("🏁 Meeting ended:", data.message);
    if (typeof window !== "undefined") {
      const store = useRoomStore.getState();
      store.setMeetingEnded(true);
    }
  });

  // Listen for participant removed event
  socket.on("participant-removed", (data: { message: string }) => {
    if (isCleaningUp) return;
    console.log("🚫 You have been removed from the meeting");
    if (typeof window !== "undefined") {
      const store = useRoomStore.getState();
      store.setMeetingEnded(true);
      toast.error(data.message || "You have been removed from the meeting by the host");
    }
  });

  // NOW join the room after all listeners are set up
  if (mySocketId) {
    console.log("🚪 Joining room:", roomId, "with socket ID:", mySocketId);
    const displayName = userName || `User-${mySocketId.slice(0, 6)}`;
    // Check if already joined
    const hasJoined = typeof window !== "undefined" && sessionStorage.getItem(`hasJoinedRoom_${roomId}`);
    const meetingTitle = typeof window !== "undefined" ? sessionStorage.getItem("meetingTitle") : null;
    
    if (!hasJoined) {
      // Small delay to ensure listeners are fully registered
      setTimeout(() => {
        if (!isCleaningUp && socket.connected) {
          // Include meeting title if available (for room creator)
          if (meetingTitle) {
            socket.emit("join-room", roomId, displayName, meetingTitle);
          } else {
            socket.emit("join-room", roomId, displayName);
          }
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`hasJoinedRoom_${roomId}`, "true");
          }
          console.log("✅ Join-room emitted for room:", roomId);
        } else {
          console.warn("⚠️ Socket not connected, cannot join room");
        }
      }, 200); // Increased delay to ensure all listeners are registered
    } else {
      console.log("ℹ️ Already joined room, skipping join-room emit");
    }
  } else {
    throw new Error("Socket not connected");
  }

  // Cleanup
  return () => {
    console.log("🧹 Cleaning up WebRTC");
    isCleaningUp = true;
    statsIntervals.forEach((intervalId) => clearInterval(intervalId));
    statsIntervals.clear();

    socket.off("room-users");
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("signal");
    socket.off("room-metadata");
    socket.off("meeting-ended");
    socket.off("participant-removed");

    peers.forEach((peerData) => {
      try {
        if (!peerData.peer.destroyed) {
          peerData.peer.destroy();
        }
        // Stop all tracks in the stream
        if (peerData.stream && peerData.stream.getTracks) {
          peerData.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    peers.clear();
    setPeers(new Map());
  };
};
