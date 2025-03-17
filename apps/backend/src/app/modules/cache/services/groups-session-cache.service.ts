import { Injectable } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { GroupSession } from "@frontend/shared";

@Injectable()
export class GroupsSessionCache extends CacheService<GroupSession> {
    protected prefix = 'group:sess';
}
