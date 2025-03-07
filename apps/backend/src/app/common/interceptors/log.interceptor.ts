import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { createLogger } from '../utils/logger.util';
import { colorize } from 'json-colorizer';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = createLogger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, headers } = request;
        const now = Date.now();

        this.logger.info(`Incoming Request: ${method} ${url}`);

        const response = context.switchToHttp().getResponse();
        
        let originalSend = response.send;

        // Buffer the response body by overriding the send method
        response.send = (body: any): Response => {
            const statusCode = response.statusCode;
            const duration = Date.now() - now;

            let parsedBody;
            try {
                parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
            } catch (error) {
                parsedBody = body; 
            }

            this.logger.info(
                colorize(JSON.stringify({
                    method,
                    url,
                    statusCode,
                    duration: `${duration}ms`,
                    parsedBody
                }))
            );
            

            // Send the response as normal
            return originalSend.call(response, body);
        };

        return next.handle();
    }
}
