"use client";

import { RefObject, useEffect, useId, useState, useRef } from "react";
import { motion } from "framer-motion";

// Inline AnimatedBeam Component
interface AnimatedBeamProps {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
}

function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#1e40af",
  gradientStopColor = "#3b82f6",
}: AnimatedBeamProps) {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const gradientCoordinates = reverse
    ? {
        x1: ["90%", "-10%"],
        x2: ["100%", "0%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["10%", "110%"],
        x2: ["0%", "100%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      };

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const rectA = fromRef.current.getBoundingClientRect();
        const rectB = toRef.current.getBoundingClientRect();

        const svgWidth = containerRect.width;
        const svgHeight = containerRect.height;
        setSvgDimensions({ width: svgWidth, height: svgHeight });

        const startX = rectA.left - containerRect.left + rectA.width / 2;
        const startY = rectA.top - containerRect.top + rectA.height / 2;
        const endX = rectB.left - containerRect.left + rectB.width / 2;
        const endY = rectB.top - containerRect.top + rectB.height / 2;

        const controlY = startY - curvature;
        const d = `M ${startX},${startY} Q ${
          (startX + endX) / 2
        },${controlY} ${endX},${endY}`;
        setPathD(d);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updatePath();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updatePath();

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, fromRef, toRef, curvature]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute top-0 left-0 transform-gpu stroke-2"
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits={"userSpaceOnUse"}
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            duration: Math.random() * 3 + 4,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 0,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="32.5%" stopColor={gradientStopColor}></stop>
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          ></stop>
        </motion.linearGradient>
      </defs>
    </svg>
  );
}

// Main Integrations Component
export function Integrations() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const webrtcRef = useRef<HTMLDivElement>(null);
  const nextjsRef = useRef<HTMLDivElement>(null);
  const typescriptRef = useRef<HTMLDivElement>(null);
  const framerRef = useRef<HTMLDivElement>(null);
  const nodejsRef = useRef<HTMLDivElement>(null);
  const tailwindRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative w-full py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Powered by Modern Technologies
        </h2>
        <p className="text-gray-400 text-base max-w-2xl mx-auto">
          Built with industry-leading tools and frameworks for enterprise-grade
          performance
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-[400px] mx-auto max-w-4xl"
      >
        {/* Center - WebMeet Logo */}
        <div
          ref={centerRef}
          className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-900/30 border border-blue-500/30 p-2"
        >
          <img
            src="/logo.svg"
            alt="WebMeet"
            className="w-[85%] h-[85%] object-contain"
          />
        </div>

        {/* WebRTC */}
        <div
          ref={webrtcRef}
          className="absolute top-0 left-[10%] flex items-center justify-center w-16 h-16 rounded-xl bg-blue-950/40 backdrop-blur-sm shadow-lg border border-blue-800/30 p-3"
        >
          <img
            src="/webrtc.svg"
            alt="WebRTC"
            className="w-full h-full object-contain opacity-90"
          />
        </div>

        {/* Next.js */}
        <div
          ref={nextjsRef}
          className="absolute top-0 right-[10%] flex items-center justify-center w-16 h-16 rounded-xl bg-blue-950/40 backdrop-blur-sm shadow-lg border border-blue-800/30 p-3"
        >
          <img
            src="/nextjs.svg"
            alt="Next.js"
            className="w-full h-full object-contain opacity-90"
          />
        </div>

        {/* TypeScript */}
        <div
          ref={typescriptRef}
          className="absolute left-0 top-[40%] flex items-center justify-center w-16 h-16 rounded-xl bg-blue-950/40 backdrop-blur-sm shadow-lg border border-blue-800/30 p-3"
        >
          <img
            src="/typescript.svg"
            alt="TypeScript"
            className="w-full h-full object-contain opacity-90"
          />
        </div>

        {/* Framer Motion */}
        <div
          ref={framerRef}
          className="absolute right-0 top-[40%] flex items-center justify-center w-16 h-16 rounded-xl bg-blue-950/40 backdrop-blur-sm shadow-lg border border-blue-800/30 p-3"
        >
          <img
            src="/framer-motion.svg"
            alt="Framer Motion"
            className="w-full h-full object-contain opacity-90"
          />
        </div>

        {/* Node.js */}
        <div
          ref={nodejsRef}
          className="absolute bottom-0 left-[15%] flex items-center justify-center w-16 h-16 rounded-xl bg-blue-950/40 backdrop-blur-sm shadow-lg border border-blue-800/30 p-3"
        >
          <img
            src="/nodejs.svg"
            alt="Node.js"
            className="w-full h-full object-contain opacity-90"
          />
        </div>

        {/* Tailwind CSS */}
        <div
          ref={tailwindRef}
          className="absolute bottom-0 right-[15%] flex items-center justify-center w-16 h-16 rounded-xl bg-blue-950/40 backdrop-blur-sm shadow-lg border border-blue-800/30 p-3"
        >
          <img
            src="/tailwindcss.svg"
            alt="Tailwind CSS"
            className="w-full h-full object-contain opacity-90"
          />
        </div>

        {/* Animated Beams */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={webrtcRef}
          toRef={centerRef}
          curvature={-30}
          gradientStartColor="#1e40af"
          gradientStopColor="#3b82f6"
          pathColor="#1e3a8a"
          pathOpacity={0.15}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={nextjsRef}
          toRef={centerRef}
          curvature={-30}
          reverse
          gradientStartColor="#1e40af"
          gradientStopColor="#3b82f6"
          pathColor="#1e3a8a"
          pathOpacity={0.15}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={typescriptRef}
          toRef={centerRef}
          curvature={0}
          gradientStartColor="#1e40af"
          gradientStopColor="#3b82f6"
          pathColor="#1e3a8a"
          pathOpacity={0.15}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={framerRef}
          toRef={centerRef}
          curvature={0}
          reverse
          gradientStartColor="#1e40af"
          gradientStopColor="#3b82f6"
          pathColor="#1e3a8a"
          pathOpacity={0.15}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={nodejsRef}
          toRef={centerRef}
          curvature={30}
          gradientStartColor="#1e40af"
          gradientStopColor="#3b82f6"
          pathColor="#1e3a8a"
          pathOpacity={0.15}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={tailwindRef}
          toRef={centerRef}
          curvature={30}
          reverse
          gradientStartColor="#1e40af"
          gradientStopColor="#3b82f6"
          pathColor="#1e3a8a"
          pathOpacity={0.15}
        />
      </div>

      {/* Technology Labels */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-16 max-w-5xl mx-auto px-4">
        <div className="text-center">
          <p className="text-sm font-medium text-blue-400">WebRTC</p>
          <p className="text-xs text-gray-500 mt-1">Real-time Communication</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-blue-400">Next.js</p>
          <p className="text-xs text-gray-500 mt-1">React Framework</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-blue-400">TypeScript</p>
          <p className="text-xs text-gray-500 mt-1">Type Safety</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-blue-400">Framer Motion</p>
          <p className="text-xs text-gray-500 mt-1">Animations</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-blue-400">Node.js</p>
          <p className="text-xs text-gray-500 mt-1">Backend Runtime</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-blue-400">Tailwind CSS</p>
          <p className="text-xs text-gray-500 mt-1">Utility-first CSS</p>
        </div>
      </div>
    </section>
  );
}
