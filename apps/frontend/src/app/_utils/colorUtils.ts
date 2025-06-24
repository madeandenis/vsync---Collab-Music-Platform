import { useColor } from "color-thief-react";
import { useEffect, useState } from "react";

const rgbToRgba = (rgbArray: number[], opacity = 0.2) => {
    if (!rgbArray || rgbArray.length !== 3) return `rgba(0,0,0,${opacity})`;
    const [r, g, b] = rgbArray;
    return `rgba(${r},${g},${b},${opacity})`;
};

export function useImageGradient(imageUrl: string, gradientAngle: number) {
    const [bgGradient, setBgGradient] = useState("rgba(255,255,255,0.05)");
    const { data: predominantColor } = useColor(imageUrl ?? "", "rgbArray", {
        crossOrigin: "anonymous",
    });

    useEffect(() => {
        if (predominantColor) {
            setBgGradient(`linear-gradient(${gradientAngle}deg,
                ${rgbToRgba(predominantColor, 1)} 0%,
                ${rgbToRgba(predominantColor, 0.8)} 15%,
                ${rgbToRgba(predominantColor, 0.6)} 30%,
                ${rgbToRgba(predominantColor, 0.3)} 70%,
                ${rgbToRgba(predominantColor, 0.1)} 90%,
                black 150%)`);
        }
    }, [predominantColor, gradientAngle]);

    return bgGradient;
}
