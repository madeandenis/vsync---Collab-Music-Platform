import 'express-session';
import { GuestUserSession, UserSession } from './session.type';

declare module 'express-session' {
  interface SessionData {
    state: string; 
    user: UserSession | GuestUserSession; 
  }
}