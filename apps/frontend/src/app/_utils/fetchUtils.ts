import { ErrorResponse } from "@frontend/shared";
import { FetchError } from "../errors/fetch.error";

export const fetchApi = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
    let status;
    try {
        const res = await fetch(url, { credentials: 'include', ...options });

        // clone response to allow multiple reads
        const responseClone = res.clone();
        status = res.status;

        if (!res.ok) {
            // Attempt parsing JSON
            const body = await responseClone.json();
            throw new FetchError(status, body, url);
        }

        // Handle No Content responses (No/Reset Content, Not Modified)
        if ([204, 205, 304].includes(status)) {
            return {} as T;  
        }

        const apiResponse = await responseClone.json();
        return apiResponse.data;

    } catch (error) {
        let body: ErrorResponse = {
            success: false,
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString()
        };

        // Fallback to text if JSON parsing fails
        if (error instanceof TypeError || error instanceof SyntaxError) {
            body.message = 'Failed to reach server';
            throw new FetchError(500, body, url);
        }

        if (error instanceof FetchError) {
            throw error; 
        }

        throw new FetchError(status ?? 500, body, url);
    }
};

