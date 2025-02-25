import { Injectable } from "@nestjs/common";
import { Session, SessionData } from "express-session";
import { CacheService } from "./cache.service";

@Injectable()
export class UsersSessionCache extends CacheService<Session & Partial<SessionData>> {
    protected prefix = 'user:sess';
}
