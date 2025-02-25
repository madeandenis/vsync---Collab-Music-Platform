import { Injectable } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { GroupSession } from "../../../common/interfaces/group-session.interface";

@Injectable()
export class GroupsSessionCache extends CacheService<GroupSession> {
    protected prefix = 'group:sess';
}
