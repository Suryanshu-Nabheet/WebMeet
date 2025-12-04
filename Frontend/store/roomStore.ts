import Peer from "simple-peer";
import { create } from "zustand";

export type SidebarTab = "chat" | "participants" | "details" | "admin";

interface PeerData {
  peer: Peer.Instance;
  stream: MediaStream;
  isInitiator: boolean;
  isProcessing: boolean;
  signalQueue: any[];
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}


interface UserInfo {
  id: string;
  username: string;
  isHost?: boolean;
}

interface MediaStats {
  bitrate: number;
  jitter: number;
  rtt: number;
  lastUpdated: number | null;
}

interface WaitingParticipant {
  userId: string;
  username: string;
  joinedAt: Date;
}

interface RoomState {
  roomId: string | null;
  meetingTitle: string | null;
  userName: string | null;
  localStream: MediaStream | null;
  previewStream: MediaStream | null;
  cameraStream: MediaStream | null;
  cameraTrack: MediaStreamTrack | null;
  screenStream: MediaStream | null;
  peers: Map<string, PeerData>;
  participants: Map<string, UserInfo>; // socketId -> { id, username, isHost }
  chatMessages: ChatMessage[];
  mySocketId: string | null;
  isHost: boolean;
  meetingEnded: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  mediaError: string | null;
  networkStats: MediaStats;
  sidebarTab: SidebarTab;
  sidebarVisible: boolean;
  isMeetingLocked: boolean;
  waitingParticipants: WaitingParticipant[];
  isScreenShareActive: boolean;
  activeScreenSharingId: string | null;
  setRoomId: (id: string) => void;
  setMeetingTitle: (title: string) => void;
  setUserName: (name: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setPreviewStream: (stream: MediaStream | null) => void;
  setCameraStream: (stream: MediaStream | null) => void;
  setCameraTrack: (track: MediaStreamTrack | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setPeers: (peers: Map<string, PeerData>) => void;
  setParticipants: (participants: Map<string, UserInfo>) => void;
  addParticipant: (id: string, username: string, isHost?: boolean) => void;
  removeParticipant: (id: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  setMySocketId: (id: string | null) => void;
  setIsHost: (isHost: boolean) => void;
  setMeetingEnded: (ended: boolean) => void;
  setIsAudioEnabled: (enabled: boolean) => void;
  setIsVideoEnabled: (enabled: boolean) => void;
  setIsScreenSharing: (enabled: boolean) => void;
  setMediaError: (message: string | null) => void;
  setNetworkStats: (stats: Partial<MediaStats>) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarVisible: (visible: boolean) => void;
  setIsMeetingLocked: (locked: boolean) => void;
  addWaitingParticipant: (participant: WaitingParticipant) => void;
  removeWaitingParticipant: (userId: string) => void;
  setIsScreenShareActive: (active: boolean) => void;
  setActiveScreenSharingId: (id: string | null) => void;
  clearChat: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  meetingTitle: null,
  userName: null,
  localStream: null,
  previewStream: null,
  cameraStream: null,
  cameraTrack: null,
  screenStream: null,
  peers: new Map(),
  participants: new Map(),
  chatMessages: [],
  mySocketId: null,
  isHost: false,
  meetingEnded: false,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
  mediaError: null,
  networkStats: {
    bitrate: 0,
    jitter: 0,
    rtt: 0,
    lastUpdated: null,
  },
  sidebarTab: "chat",
  sidebarVisible: false,
  isMeetingLocked: false,
  waitingParticipants: [],
  isScreenShareActive: false,
  activeScreenSharingId: null,
  setRoomId: (id) => set({ roomId: id }),
  setMeetingTitle: (title) => set({ meetingTitle: title }),
  setUserName: (name) => set({ userName: name }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setPreviewStream: (stream) => set({ previewStream: stream }),
  setCameraStream: (stream) => set({ cameraStream: stream }),
  setCameraTrack: (track) => set({ cameraTrack: track }),
  setScreenStream: (stream) => set({ screenStream: stream }),
  setPeers: (peers) => set({ peers }),
  setParticipants: (participants) => set({ participants }),
  addParticipant: (id, username, isHost = false) =>
    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.set(id, { id, username, isHost });
      return { participants: newParticipants };
    }),
  removeParticipant: (id) =>
    set((state) => {
      const newParticipants = new Map(state.participants);
      newParticipants.delete(id);
      return { participants: newParticipants };
    }),
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  setMySocketId: (id) => set({ mySocketId: id }),
  setIsHost: (isHost) => set({ isHost }),
  setMeetingEnded: (ended) => set({ meetingEnded: ended }),
  setIsAudioEnabled: (enabled) => set({ isAudioEnabled: enabled }),
  setIsVideoEnabled: (enabled) => set({ isVideoEnabled: enabled }),
  setIsScreenSharing: (enabled) => set({ isScreenSharing: enabled }),
  setMediaError: (message) => set({ mediaError: message }),
  setNetworkStats: (stats) =>
    set((state) => ({
      networkStats: {
        bitrate: stats.bitrate ?? state.networkStats.bitrate,
        jitter: stats.jitter ?? state.networkStats.jitter,
        rtt: stats.rtt ?? state.networkStats.rtt,
        lastUpdated: stats.lastUpdated ?? Date.now(),
      },
    })),
  setSidebarTab: (tab) => set({ sidebarTab: tab, sidebarVisible: true }),
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),
  setIsMeetingLocked: (locked) => set({ isMeetingLocked: locked }),
  addWaitingParticipant: (participant) =>
    set((state) => ({
      waitingParticipants: [...state.waitingParticipants, participant],
    })),
  removeWaitingParticipant: (userId) =>
    set((state) => ({
      waitingParticipants: state.waitingParticipants.filter(p => p.userId !== userId),
    })),
  setIsScreenShareActive: (active) => set({ isScreenShareActive: active }),
  setActiveScreenSharingId: (id) => set({ activeScreenSharingId: id }),
  clearChat: () => set({ chatMessages: [] }),
}));
