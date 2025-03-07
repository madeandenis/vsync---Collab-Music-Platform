export function avatarPlaceholder(
    username: string,
    useGradient = true,  
    textColor = 'white',
    bgColor = 'rgba(29, 185, 84, 0.8)',
    bgGradient = irisGradient(bgColor),
) {
    const initial = username.charAt(0).toUpperCase();
    const width = 100, height = 100;

    const gradientSection = useGradient ? `
        <defs>
            ${bgGradient}
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
    ` : `
        <rect width="100%" height="100%" fill="${bgColor}" />
    `;
    
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            ${gradientSection}
            <text x="50%" y="52%" font-size="${width / 2}" fill="${textColor}" dy=".3em" text-anchor="middle" font-family="'Poppins', sans-serif" font-weight="600">
                ${initial}
            </text>
        </svg>
    `;

    const base64Svg = encodeSvgToBase64(svg);
    return `data:image/svg+xml;base64,${base64Svg}`;
}

const encodeSvgToBase64 = (svg: string): string => {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(svg);  // Convert to Uint8Array
    const base64 = btoa(String.fromCharCode(...uint8Array));  // Convert to Base64
    return base64;
};

const irisGradient = (color: string) => `
    <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="15%" stop-color="transparent" />
        <stop offset="100%" stop-color="${color}" />
    </radialGradient>
`;
