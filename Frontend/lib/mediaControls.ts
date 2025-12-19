import { toast } from "@/components/ui/toast";
import { useRoomStore } from "@/store/roomStore";

const captureError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unable to update media settings";
  toast.error(message);
  console.error(error);
};

export const toggleAudio = () => {
  const { localStream, isAudioEnabled, setIsAudioEnabled } =
    useRoomStore.getState();
  if (!localStream) {
    toast.error("Audio device not available");
    return;
  }

  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) {
    toast.error("No microphone detected");
    return;
  }

  const nextState = !isAudioEnabled;
  audioTracks.forEach((track) => {
    track.enabled = nextState;
  });
  setIsAudioEnabled(nextState);
  toast.info(nextState ? "Microphone unmuted" : "Microphone muted", 2000);
};

export const toggleVideo = () => {
  const { localStream, screenStream, isVideoEnabled, setIsVideoEnabled } =
    useRoomStore.getState();
  if (!localStream) {
    toast.error("Camera stream unavailable");
    return;
  }

  const activeStream = screenStream ?? localStream;
  const videoTracks = activeStream.getVideoTracks();
  if (videoTracks.length === 0) {
    toast.error("No camera detected");
    return;
  }

  const nextState = !isVideoEnabled;
  videoTracks.forEach((track) => {
    track.enabled = nextState;
  });
  setIsVideoEnabled(nextState);
  toast.info(nextState ? "Camera enabled" : "Camera disabled", 2000);
};

export const startScreenShare = async () => {
  const {
    localStream,
    cameraStream,
    cameraTrack,
    peers,
    setPreviewStream,
    setScreenStream,
    setIsScreenSharing,
    setIsVideoEnabled,
    setMediaError,
  } = useRoomStore.getState();

  if (!localStream || !cameraTrack) {
    toast.error("Camera stream not initialized");
    return;
  }

  if (!navigator.mediaDevices?.getDisplayMedia) {
    toast.error("Screen sharing is not supported in this browser");
    return;
  }

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 10, max: 15 },
      },
      audio: false,
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    if (!screenTrack) {
      toast.error("Unable to access display or camera stream");
      return;
    }

    peers.forEach((peerData) => {
      try {
        const instance = peerData.peer as unknown as {
          replaceTrack?: (
            oldTrack: MediaStreamTrack,
            newTrack: MediaStreamTrack,
            stream: MediaStream
          ) => void;
        };
        instance.replaceTrack?.(cameraTrack, screenTrack, localStream);
      } catch (error) {
        console.error("Failed to replace track for peer", error);
      }
    });

    localStream.removeTrack(cameraTrack);
    localStream.addTrack(screenTrack);
    setPreviewStream(
      new MediaStream([
        ...screenStream.getVideoTracks(),
        ...localStream.getAudioTracks(),
      ])
    );
    setScreenStream(screenStream);
    setIsScreenSharing(true);
    setIsVideoEnabled(true);
    setMediaError(null);

    screenTrack.onended = () => {
      stopScreenShare();
    };
    screenTrack.onended = () => {
      stopScreenShare();
    };

    // Notify others
    const { getSocket } = await import("@/lib/socket");
    const socket = getSocket();
    const { roomId } = useRoomStore.getState();
    if (roomId) {
      socket.emit("screen-share-status", { isSharing: true, roomId });
    }

    toast.info("Screen sharing started");
  } catch (error) {
    // Silently handle user cancellation - don't show error toast
    if (error instanceof Error) {
      // User cancelled the screen share dialog
      if (
        error.name === "NotAllowedError" ||
        error.name === "AbortError" ||
        error.message.includes("denied")
      ) {
        console.log("Screen share cancelled by user");
        return;
      }
      // Show error for actual failures
      setMediaError(error.message);
      toast.error(error.message);
      console.error(error);
    }
  }
};

export const stopScreenShare = () => {
  const {
    localStream,
    cameraStream,
    cameraTrack,
    screenStream,
    peers,
    setPreviewStream,
    setScreenStream,
    setIsScreenSharing,
  } = useRoomStore.getState();

  if (!localStream || !cameraStream || !screenStream || !cameraTrack) {
    return;
  }

  const screenTrack = screenStream.getVideoTracks()[0];
  if (!screenTrack) {
    return;
  }

  peers.forEach((peerData) => {
    try {
      const instance = peerData.peer as unknown as {
        replaceTrack?: (
          oldTrack: MediaStreamTrack,
          newTrack: MediaStreamTrack,
          stream: MediaStream
        ) => void;
      };
      instance.replaceTrack?.(screenTrack, cameraTrack, localStream);
    } catch (error) {
      console.error("Failed to restore camera track for peer", error);
    }
  });

  localStream.removeTrack(screenTrack);
  localStream.addTrack(cameraTrack);
  screenStream.getTracks().forEach((track) => track.stop());

  setPreviewStream(cameraStream);
  setScreenStream(null);
  setIsScreenSharing(false);
  setScreenStream(null);
  setIsScreenSharing(false);

  // Notify others
  import("@/lib/socket").then(({ getSocket }) => {
    const socket = getSocket();
    const { roomId } = useRoomStore.getState();
    if (roomId) {
      socket.emit("screen-share-status", { isSharing: false, roomId });
    }
  });

  toast.info("Screen sharing stopped");
};

export const toggleScreenShare = async () => {
  const { isScreenSharing } = useRoomStore.getState();
  if (isScreenSharing) {
    stopScreenShare();
  } else {
    await startScreenShare();
  }
};
