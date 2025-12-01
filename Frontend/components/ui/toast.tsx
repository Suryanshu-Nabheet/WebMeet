"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify(listener: (toasts: Toast[]) => void) {
  listener([...toasts]);
}

export const toast = {
  show: (message: string, type: Toast["type"] = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };
    toasts = [...toasts, newToast];
    toastListeners.forEach(notify);

    if (duration > 0) {
      setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
        toastListeners.forEach(notify);
      }, duration);
    }
  },
  success: (message: string, duration?: number) => toast.show(message, "success", duration),
  error: (message: string, duration?: number) => toast.show(message, "error", duration),
  info: (message: string, duration?: number) => toast.show(message, "info", duration),
};

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    toastListeners.push(listener);
    listener(toasts);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {currentToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border ${
              toast.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : toast.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

