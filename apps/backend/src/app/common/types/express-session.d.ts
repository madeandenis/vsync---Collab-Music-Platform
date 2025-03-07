import 'express-session';
import { UserSession, GuestUserSession } from '../interfaces/user-session.interface';

declare module 'express-session' {
  interface SessionData {
    state: string; 
    user: UserSession | GuestUserSession; 
  }
}