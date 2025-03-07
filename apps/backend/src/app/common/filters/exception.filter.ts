import { ApiResponse, ErrorResponse } from '@frontend/shared';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { createLogger } from '../utils/logger.util';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {

    logger = createLogger(ApiExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const status = this.getStatus(exception);
        const message = this.getErrorMessage(exception);
        
        const errorResponse: ApiResponse<unknown> = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };
        this.logger.error(exception.getResponse())

        response.status(status).json(errorResponse);
    }

    private getStatus(exception: HttpException): number {
        return exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private getErrorMessage(exception: HttpException): string {
        let message = (exception.getResponse() as ErrorResponse)?.message || exception.message || 'An unexpected error occurred';
        return message;
    }
}
