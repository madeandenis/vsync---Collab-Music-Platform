import crypto from 'crypto';

export function generateRandomString(size): string {
    return crypto.randomBytes(size).toString('hex');
}

export const validateCookieSignature = (sessionID: string, signature: string, secret: string): boolean => {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(sessionID);

    // Generate the expected signature
    const validSignature = Buffer.from(hmac.digest('base64').replace(/=+$/, ''), 'utf-8');
    const providedSignature = Buffer.from(signature, 'utf-8');

    // Ensure both buffers are the same length before comparing
    if (validSignature.length !== providedSignature.length) {
        return false;
    }

    return crypto.timingSafeEqual(validSignature, providedSignature);
};