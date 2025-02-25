import { ApiResponse } from "@frontend/shared";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Socket } from 'socket.io';
import { Response } from 'express'; 
import { WsException } from "@nestjs/websockets";

export function respond<T>(res: Response)
{
    function success(statusCode: HttpStatus, data?: T)
    {
        return res.status(statusCode).json({
            success: true, 
            data,
            timestamp: new Date().toISOString()
        } as ApiResponse<T>)
    }
    function failure(statusCode: HttpStatus, errorMessage?: T)
    {
        return res.status(statusCode).json({
            success: false, 
            message: errorMessage,
            timestamp: new Date().toISOString()
        } as ApiResponse<never> )
    }

    return { success, failure }; 
}

export function handleError(res: Response, error: unknown)
{
    if (error instanceof HttpException)
    {
        return respond(res).failure(
            error.getStatus(),
            error.message
        )    
    }
    else if(error instanceof Error) {
        return respond(res).failure(
            HttpStatus.INTERNAL_SERVER_ERROR,
            `An unexpected error occurred: ${error.message}`
        )
    }
    return respond(res).failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'An unknown error occurred.'
    )
}

export function handleWsError(client: Socket, error: unknown)
{
    if (error instanceof WsException)
    {
        client.emit('error', error.message || 'A WebSocket exception occurred');
    }
    else if (error instanceof Error)
    {
        client.emit('error', error.message || 'A unknown server error occurred');
    }
    else (error instanceof Error)
    {
        client.emit('error', String(error) || 'A unknown error occurred');
    }
}