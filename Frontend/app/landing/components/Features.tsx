"use client";

import { motion } from "framer-motion";
import { Video, MessageSquare, Shield } from "lucide-react";

const featureCards = [
  {
    icon: "video",
    title: "Crystal HD Video",
    detail: "Optimized 1080p streams with smart fallbacks so sessions stay sharp on every device.",
    gradient: "from-blue-500/10 to-blue-600/5",
    iconBg: "from-blue-500/20 to-blue-600/20",
  },
  {
    icon: "chat",
    title: "Live Collaboration",
    detail: "Realtime chat, host controls, and screen share baked into a single minimalist surface.",
    gradient: "from-blue-600/10 to-blue-700/5",
    iconBg: "from-blue-600/20 to-blue-700/20",
  },
  {
    icon: "shield",
    title: "Production-Grade Stability",
    detail: "Stateless Socket.io signaling, resilient media handling, and instant teardown for privacy.",
    gradient: "from-blue-700/10 to-blue-800/5",
    iconBg: "from-blue-700/20 to-blue-800/20",
  },
];

const iconMap = {
  video: Video,
  chat: MessageSquare,
  shield: Shield,
};

export default function Features() {
  return (
    <section id="features" className="space-y-10 py-16">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 backdrop-blur-sm">
          <span className="text-[10px] uppercase tracking-[0.25em] text-blue-300 font-medium">
            Why Teams Use WebMeet
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold">
          <span className="bg-gradient-to-br from-white via-blue-50 to-blue-100 bg-clip-text text-transparent">
            A Minimal Surface with
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Enterprise Polish
          </span>
        </h2>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {featureCards.map((feature, idx) => {
          const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
          
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group relative"
            >
              {/* Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Card */}
              <div className={`relative h-full rounded-xl border border-blue-500/20 bg-gradient-to-br ${feature.gradient} backdrop-blur-xl p-6 space-y-4 hover:border-blue-400/40 transition-all duration-300 overflow-hidden`}>
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon */}
                <div className="relative">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.iconBg} backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent size={20} className="text-blue-300" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-100 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.detail}
                  </p>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}