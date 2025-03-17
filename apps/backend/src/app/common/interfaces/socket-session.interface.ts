import { Socket } from 'socket.io';
import { SessionData } from "express-session";

export interface AuthSocket extends Socket {
    data: {
        session?: SessionData & Partial<SessionData>, // state is not required
        sessionID?: string;
    }
}