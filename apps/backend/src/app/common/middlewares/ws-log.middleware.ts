import { Injectable, NestMiddleware } from '@nestjs/common';
import { createLogger } from '../utils/logger.util';
import { colorize } from 'json-colorizer';
import { Socket } from 'socket.io';

@Injectable()
export class WsLoggingMiddleware implements NestMiddleware {
    private readonly logger = createLogger(WsLoggingMiddleware.name);

    use(socket: Socket, next: (err?: any) => void) {
        this.logger.info(`New WebSocket connection: ${socket.id}`);

        socket.onAny((event, data) => {
            this.logger.info(`Incoming WebSocket Message: ${event}`);

            this.logger.info(
                colorize(JSON.stringify({
                    event,
                    socketId: socket.id,
                    data,
                }))
            );
        });

        next();
    }
}