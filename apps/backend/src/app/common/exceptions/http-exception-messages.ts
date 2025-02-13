import { HttpException, HttpStatus } from '@nestjs/common';

export const HttpExceptions = {
  // 400 - Bad Request
  BAD_REQUEST: new HttpException("Invalid request. Please check your input and try again.", HttpStatus.BAD_REQUEST),
  MISSING_PARAMETERS: new HttpException("Required parameters are missing.", HttpStatus.BAD_REQUEST),
  INVALID_INPUT: new HttpException("Provided input is not valid.", HttpStatus.BAD_REQUEST),

  // 401 - Unauthorized
  UNAUTHORIZED: new HttpException("User is not authenticated. Please log in.", HttpStatus.UNAUTHORIZED),
  INVALID_CREDENTIALS: new HttpException("Invalid username or password.", HttpStatus.UNAUTHORIZED),
  REFRESH_TOKEN_NOT_FOUND: new HttpException(
    "Refresh token not found. Please log in.",
    HttpStatus.UNAUTHORIZED
    ),
  TOKEN_EXPIRED: new HttpException("Authentication token has expired. Please log in again.", HttpStatus.UNAUTHORIZED),
  TOKEN_INVALID: new HttpException("Invalid authentication token.", HttpStatus.UNAUTHORIZED),

  // 403 - Forbidden
  FORBIDDEN: new HttpException("User is not permitted to access this resource.", HttpStatus.FORBIDDEN),
  NOT_ADMIN: new HttpException("User is not an administrator.", HttpStatus.FORBIDDEN),
  ACTION_NOT_ALLOWED: new HttpException("You do not have permission to perform this action.", HttpStatus.FORBIDDEN),

  // 404 - Not Found
  NOT_FOUND: new HttpException("Requested resource was not found.", HttpStatus.NOT_FOUND),
  USER_NOT_FOUND: new HttpException("User does not exist.", HttpStatus.NOT_FOUND),
  PAGE_NOT_FOUND: new HttpException("The requested page was not found.", HttpStatus.NOT_FOUND),

  // 409 - Conflict
  CONFLICT: new HttpException("A conflict occurred while processing the request.", HttpStatus.CONFLICT),
  EMAIL_ALREADY_TAKEN: new HttpException("This email is already in use.", HttpStatus.CONFLICT),
  USERNAME_ALREADY_TAKEN: new HttpException("This username is already taken.", HttpStatus.CONFLICT),
  RESOURCE_ALREADY_EXISTS: new HttpException("The resource already exists.", HttpStatus.CONFLICT),

  // 500 - Internal Server Error
  INTERNAL_SERVER_ERROR: new HttpException("An unexpected error occurred. Please try again later.", HttpStatus.INTERNAL_SERVER_ERROR),
  DATABASE_ERROR: new HttpException("A database error occurred.", HttpStatus.INTERNAL_SERVER_ERROR),
  UNKNOWN_ERROR: new HttpException("An unknown error has occurred.", HttpStatus.INTERNAL_SERVER_ERROR),

  // 503 - Service Unavailable
  SERVICE_UNAVAILABLE: new HttpException("The service is currently unavailable. Please try again later.", HttpStatus.SERVICE_UNAVAILABLE),
  MAINTENANCE_MODE: new HttpException("The server is under maintenance. Please check back later.", HttpStatus.SERVICE_UNAVAILABLE),
};
