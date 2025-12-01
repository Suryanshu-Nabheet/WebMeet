"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useRoomStore } from "@/store/roomStore";
import { getSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";

export default function CollaborativeIDE() {
  const { roomId, ideCode, setIDECode } = useRoomStore();
  const editorRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (roomId) {
      // Request current code when joining/opening
      socket.emit("request-code", roomId);
    }

    const onCodeChange = (data: { code: string; from: string }) => {
      if (data.code !== ideCode) {
        setIDECode(data.code);
        // If editor is mounted, update its value directly to avoid cursor jumping if possible
        // But since we control value via prop, it should be fine, though cursor might jump.
        // Better to let the prop update handle it, or use applyEdits if we want to be fancy.
        // For now, simple value sync.
      }
    };

    const onCodeUpdate = (data: { code: string }) => {
      setIDECode(data.code);
    };

    const onRequestCode = (data: { from: string }) => {
      // Send our current code to the requester
      const currentCode = useRoomStore.getState().ideCode;
      socket.emit("sync-code", { code: currentCode, to: data.from });
    };

    socket.on("code-change", onCodeChange);
    socket.on("code-update", onCodeUpdate);
    socket.on("request-code", onRequestCode);

    return () => {
      socket.off("code-change", onCodeChange);
      socket.off("code-update", onCodeUpdate);
      socket.off("request-code", onRequestCode);
    };
  }, [roomId, setIDECode]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setIDECode(value);
      if (roomId && socketRef.current) {
        socketRef.current.emit("code-change", { code: value, roomId });
      }
    }
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
        <span className="text-sm font-medium text-gray-300">
          Collaborative Editor
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#3e3e42] rounded text-xs text-gray-300">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Live
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={ideCode}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
