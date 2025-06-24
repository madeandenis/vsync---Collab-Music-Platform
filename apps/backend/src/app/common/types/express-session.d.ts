import { GuestUserSession, AuthenticatedUserSession } from '@frontend/shared';
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    state: string; 
    user: AuthenticatedUserSession | GuestUserSession; 
  }
}