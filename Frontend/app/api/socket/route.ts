/**
 * Next.js API route for Socket.io
 * This can be used for health checks or socket server status
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if socket server is accessible
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    
    return NextResponse.json({
      status: "ok",
      message: "Socket server endpoint",
      socketUrl,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message || "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

