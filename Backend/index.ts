import { SocketServer } from "./socketServer";
import { env } from "./config/env";

const server = new SocketServer(env.SOCKET_PORT);

export default server;

