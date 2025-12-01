"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Navbar,
  Hero,
  Features,
  Footer,
  Background,
  Integrations,
  Reviews,
} from "./components";
import RoomModal from "./components/RoomModal";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "join">("create");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;
    const formatted = token.includes("/")
      ? token.split("/").pop() || token
      : token;
    setRoomId(formatted);
  }, [searchParams]);

  const createRoom = (name: string, title: string) => {
    const id = uuidv4();
    sessionStorage.setItem("userName", name);
    sessionStorage.setItem("meetingTitle", title);
    router.push(`/room/${id}`);
  };

  const joinRoom = (name: string) => {
    if (!roomId.trim()) return;
    sessionStorage.setItem("userName", name);
    router.push(`/room/${roomId}`);
  };

  const openModal = (mode: "create" | "join") => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  return (
    <>
      <Background />
      <Navbar onOpenModal={openModal} />
      <main className="relative min-h-screen text-white pt-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-20">
          <Hero
            roomId={roomId}
            setRoomId={setRoomId}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onOpenModal={openModal}
          />
          <Integrations />
          <Features />
          <Reviews />
          <Footer />
        </div>
      </main>
      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomId={roomId}
        setRoomId={setRoomId}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        initialMode={modalMode}
      />
    </>
  );
}

function LandingSkeleton() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-7xl space-y-8 animate-pulse">
        <div className="h-12 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-full max-w-md" />
        <div className="h-[400px] bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-3xl" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-2xl"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <LandingContent />
    </Suspense>
  );
}
