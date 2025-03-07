export interface SuccessResponse<T> {
    success: true;
    data: T;
    timestamp: string;
}

export interface ErrorResponse {
    success: false;
    message: string;
    timestamp: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
