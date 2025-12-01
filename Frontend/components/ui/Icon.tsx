"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Check,
  Code,
  CirclePlay,
  CircleStop,
  Copy,
  Crown,
  Hash,
  Info,
  Layers,
  Lock,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Monitor,
  MonitorStop,
  PhoneOff,
  Pin,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  SignalHigh,
  Sparkles,
  Unlock,
  Users,
  Video,
  VideoOff,
  Volume2,
  Wifi,
  X,
  Zap,
} from "lucide-react";

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const iconMap = {
  video: Video,
  "video-off": VideoOff,
  chat: MessageCircle,
  users: Users,
  copy: Copy,
  check: Check,
  play: CirclePlay,
  stop: CircleStop,
  network: SignalHigh,
  brain: Brain,
  speaker: Volume2,
  transcript: ScrollText,
  mic: Mic,
  "mic-off": MicOff,
  monitor: Monitor,
  "monitor-stop": MonitorStop,
  power: PhoneOff,
  sparkles: Sparkles,
  shield: ShieldCheck,
  layers: Layers,
  arrow: ArrowRight,
  settings: Settings,
  close: X,
  maximize: Maximize2,
  pin: Pin,
  send: Send,
  crown: Crown,
  activity: Activity,
  zap: Zap,
  wifi: Wifi,
  hash: Hash,
  "alert-triangle": AlertTriangle,
  lock: Lock,
  unlock: Unlock,
  info: Info,
  code: Code,
  x: X,
} as const;

export default function Icon({
  name,
  className = "",
  size = 20,
  strokeWidth = 1.6,
}: IconProps) {
  const LucideIcon = iconMap[name as keyof typeof iconMap];

  if (!LucideIcon) {
    return null;
  }

  return (
    <LucideIcon
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      strokeWidth={strokeWidth}
    />
  );
}
