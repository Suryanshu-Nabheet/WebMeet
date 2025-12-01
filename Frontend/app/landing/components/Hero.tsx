"use client";

import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";

interface HeroProps {
  roomId: string;
  setRoomId: (id: string) => void;
  onCreateRoom: (name: string, title: string) => void;
  onJoinRoom: (name: string) => void;
  onOpenModal: (mode: "create" | "join") => void;
}

export default function Hero({
  roomId,
  setRoomId,
  onCreateRoom,
  onJoinRoom,
  onOpenModal,
}: HeroProps) {
  return (
    <>
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        {/* Background Grid Lines */}
        <div className="absolute inset-y-0 left-0 h-full w-px bg-blue-500/10">
          <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
        </div>
        <div className="absolute inset-y-0 right-0 h-full w-px bg-blue-500/10">
          <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px w-full bg-blue-500/10">
          <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        </div>

        <div className="px-4 py-10 md:py-20 text-center space-y-8 relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm mb-4"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-blue-300 font-medium">
              WebMeet
            </span>
          </motion.div>

          {/* Main Heading */}
          <h1 className="mx-auto max-w-4xl text-4xl font-bold md:text-6xl lg:text-7xl tracking-tight">
            {"Premium video meetings for everyone"
              .split(" ")
              .map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: "easeInOut",
                  }}
                  className="mr-2 inline-block bg-gradient-to-br from-white via-blue-50 to-blue-200 bg-clip-text text-transparent"
                >
                  {word}
                </motion.span>
              ))}
          </h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mx-auto max-w-2xl text-lg text-gray-400 leading-relaxed"
          >
            Launch secure WebRTC rooms in seconds with{" "}
            <span className="text-blue-400 font-semibold">
              studio-grade quality
            </span>
            . No dashboards, no noise—just a clean, distraction-free
            collaboration space.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <button
              onClick={() => onOpenModal("create")}
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black px-8 py-3 text-sm font-semibold shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Start Instant Room</span>
              <Icon
                name="arrow"
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>

            <button
              onClick={() => onOpenModal("join")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300"
            >
              Join Existing Room
            </button>
          </motion.div>

          {/* Preview Image/Video Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="relative mt-16 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-blue-900/20 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 rounded-xl" />
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-900/50 relative">
              {/* Abstract UI representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-3/4 h-3/4 opacity-30">
                  <div className="bg-blue-500/20 rounded-lg animate-pulse" />
                  <div className="bg-blue-400/20 rounded-lg animate-pulse delay-75" />
                  <div className="bg-blue-600/20 rounded-lg animate-pulse delay-150" />
                  <div className="bg-blue-300/20 rounded-lg animate-pulse delay-100" />
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10" />
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10" />
                <div className="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md border border-red-500/20" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
