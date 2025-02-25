import { Module } from "@nestjs/common";
import { GroupSessionGateway } from "./group-session.gateway";
import { GroupsSessionCache } from "../cache/services/groups-session-cache.service";
import { CacheModule } from "../cache/cache.module";
import { WsGroupSessionService } from "./group-session-ws.service";

@Module({
    imports: [
        CacheModule,
        
    ],
    providers: [
        GroupSessionGateway,
        WsGroupSessionService
    ],
    exports: [
        GroupSessionGateway
    ],
})
export class WebsocketsModule {}
