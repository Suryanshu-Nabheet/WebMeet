import http from "http";
import next from "next";
import { Server as IOServer } from "socket.io";
import { SocketServer } from "./Backend/socketServer";
import { env as backendEnv } from "./Backend/config/env";

const dev = process.env.NODE_ENV !== "production";

// Point Next.js to the Frontend workspace
const app = next({ dev, dir: "./Frontend" });
const handle = app.getRequestHandler();

const port = Number(process.env.PORT) || 3000;

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    // Attach Socket.io to the same HTTP server (same origin & port)
    const io = new IOServer(server, {
      cors: {
        origin: backendEnv.ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 15000,
      transports: ["websocket", "polling"],
      allowEIO3: true,
      connectTimeout: 20000,
    });

    // Use integrated mode: pass the Socket.io server instance
    // SocketServer will only register event handlers and NOT bind a new port
    // so everything stays on the same Render web service.
    // This relies on the `Server`-based branch in the SocketServer constructor.
    //
    //   constructor(portOrIo: number | Server = 3001) {
    //     if (typeof portOrIo === "number") { ... } else { this.io = portOrIo; }
    //   }
    new SocketServer(io);

    server.listen(port, () => {
      console.log(`🚀 Next.js + Socket.io server ready on port ${port}`);
      if (backendEnv.ALLOWED_ORIGINS?.length) {
        console.log("🌐 Allowed origins:", backendEnv.ALLOWED_ORIGINS.join(", "));
      }
    });
  })
  .catch((err) => {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  });
