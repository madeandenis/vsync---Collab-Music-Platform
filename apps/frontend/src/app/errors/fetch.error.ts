import { ErrorResponse } from "@frontend/shared";

export class FetchError extends Error {
    status: number;
    response: ErrorResponse;
    url?: string;

    constructor(status: number, response: ErrorResponse, url?: string) {
        super(response.message);
        this.status = status;
        this.response = response;
        this.url = url;
        this.name = "FetchError";
    }
}
