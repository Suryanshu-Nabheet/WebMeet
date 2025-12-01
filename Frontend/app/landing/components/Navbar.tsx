"use client";

import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";

interface NavbarProps {
  onOpenModal: (mode: "create" | "join") => void;
}

export default function Navbar({ onOpenModal }: NavbarProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/50 px-6 py-4 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/20 p-[1px]">
          <div className="h-full w-full rounded-full bg-black flex items-center justify-center overflow-hidden">
            <img
              src="logo.svg"
              alt="WebMeet Logo"
              className="h-[110%] w-[110%] object-contain"
            />
          </div>
        </div>

        <h1 className="text-lg font-bold tracking-tight text-white md:text-xl">
          WebMeet
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpenModal("join")}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-all duration-200"
        >
          <Icon name="users" size={16} className="text-gray-400" />
          <span>Join Existing Room</span>
        </button>
        <button
          onClick={() => onOpenModal("create")}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-200 shadow-lg shadow-white/10"
        >
          <Icon name="video" size={16} className="text-black" />
          <span>Start Instant Room</span>
        </button>
      </div>
    </motion.nav>
  );
}
