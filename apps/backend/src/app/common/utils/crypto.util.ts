import crypto from 'crypto';

export function generateRandomString(size): string {
    return crypto.randomBytes(size).toString('hex');
}