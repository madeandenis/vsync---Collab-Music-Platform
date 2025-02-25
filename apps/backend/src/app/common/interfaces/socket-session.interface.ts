import { Socket } from 'socket.io';
import { SessionData } from "express-session";

export interface AuthSocket extends Socket {
    session?: SessionData & Partial<SessionData>,
    sessionID?: string;
}