import { Module } from "@nestjs/common";
import { GroupSessionGateway } from "./group-session.gateway";
import { CacheModule } from "../cache/cache.module";
import { WsGroupSessionService } from "./group-session-ws.service";
import { WsSessionMiddleware } from "../../common/middlewares/ws-session.middleware";
import { WsLoggingMiddleware } from "../../common/middlewares/ws-log.middleware";

@Module({
    imports: [
        CacheModule,
    ],
    providers: [
        GroupSessionGateway,
        WsGroupSessionService,
        WsSessionMiddleware,
        WsLoggingMiddleware,
    ],
    exports: [
        GroupSessionGateway
    ],
})
export class WebsocketsModule {}
