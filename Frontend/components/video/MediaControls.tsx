"use client";

import { memo } from "react";
import { useRoomStore, SidebarTab } from "@/store/roomStore";
import Icon from "@/components/ui/Icon";
import {
  toggleAudio,
  toggleScreenShare,
  toggleVideo,
  toggleIDE,
} from "@/lib/mediaControls";

interface MediaControlsProps {
  onLeave: () => void;
}

const MediaControls = memo(function MediaControls({
  onLeave,
}: MediaControlsProps) {
  const {
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    setSidebarTab,
    setSidebarVisible,
    sidebarVisible,
    isIDEOpen,
  } = useRoomStore();

  const controls = [
    {
      id: "mic",
      active: isAudioEnabled,
      label: "Mute",
      icon: isAudioEnabled ? "mic" : "mic-off",
      onClick: toggleAudio,
    },
    {
      id: "video",
      active: isVideoEnabled,
      label: "Stop Video",
      icon: isVideoEnabled ? "video" : "video-off",
      onClick: toggleVideo,
    },
    {
      id: "screen",
      active: isScreenSharing,
      label: isScreenSharing ? "Stop Share" : "Share",
      icon: isScreenSharing ? "monitor-stop" : "monitor",
      onClick: toggleScreenShare,
      highlight: true,
    },
    {
      id: "ide",
      active: isIDEOpen,
      label: "IDE",
      icon: "code",
      onClick: toggleIDE,
    },
  ];

  const sidebarButtons: {
    id: string;
    icon: string;
    label: string;
    tab: SidebarTab;
  }[] = [
    {
      id: "participants",
      icon: "users",
      label: "Participants",
      tab: "participants",
    },
    { id: "chat", icon: "chat", label: "Chat", tab: "chat" },
    { id: "details", icon: "settings", label: "More", tab: "details" },
  ];

  const handleSidebar = (tab: SidebarTab) => {
    setSidebarTab(tab);
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="w-full z-50 bg-zinc-900/98 backdrop-blur-xl border-t border-zinc-800/30 flex-shrink-0">
      <div className="flex items-center justify-center gap-0.5 px-4 py-2.5">
        {/* Left Controls */}
        <div className="flex items-center gap-0.5">
          {controls.map((control) => (
            <button
              key={control.id}
              onClick={control.onClick}
              className={`group flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-md transition-all duration-200 min-w-[70px] ${
                control.highlight && !control.active
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : control.active
                  ? "bg-transparent hover:bg-zinc-800/50 text-white"
                  : "bg-transparent hover:bg-zinc-800/50 text-red-400"
              }`}
              aria-pressed={control.active}
              aria-label={control.label}
              title={control.label}
            >
              <Icon
                name={control.icon}
                size={18}
                strokeWidth={2}
                className="mb-0"
              />
              <span className="text-[10px] font-medium whitespace-nowrap">
                {control.label}
              </span>
              {!control.active && !control.highlight && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-zinc-700/50 mx-1.5" />

        {/* Right Controls */}
        <div className="flex items-center gap-0.5">
          {sidebarButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => handleSidebar(button.tab)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-md transition-all duration-200 min-w-[70px] ${
                sidebarVisible &&
                button.tab === useRoomStore.getState().sidebarTab
                  ? "bg-blue-600 text-white"
                  : "bg-transparent hover:bg-zinc-800/50 text-gray-300"
              }`}
              aria-label={button.label}
              title={button.label}
            >
              <Icon
                name={button.icon}
                size={18}
                strokeWidth={2}
                className="mb-0"
              />
              <span className="text-[10px] font-medium whitespace-nowrap">
                {button.label}
              </span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-zinc-700/50 mx-1.5" />

        {/* End Button */}
        <button
          onClick={onLeave}
          className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white transition-all duration-200 min-w-[70px]"
          aria-label="Leave meeting"
          title="Leave meeting"
        >
          <Icon name="power" size={18} strokeWidth={2} className="mb-0" />
          <span className="text-[10px] font-semibold whitespace-nowrap">
            End
          </span>
        </button>
      </div>
    </div>
  );
});

export default MediaControls;
