const sanitize = (input: string, escaped: boolean): string => {
    let output = input;
    if (escaped) {
        output = output
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    output = output.replace(/<script.*?>.*?<\/script>/gi, '');
    return output;
};

export function normalize(input?: string): string {
    if(!input) return '';
    
    let output = input
                .trim()
                .replace(/\s+/g, ' ');

    return sanitize(output, false);
}
