const sanitize = (input: string): string => {
    const escapedInput = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    const sanitizedInput = escapedInput.replace(/<script.*?>.*?<\/script>/gi, '');
    return sanitizedInput;
};
export function normalize(input?: string): string {
    if(!input) return '';
    
    return sanitize(
        input
        .trim()
        .replace(/\s+/g, ' ')
    )
}
