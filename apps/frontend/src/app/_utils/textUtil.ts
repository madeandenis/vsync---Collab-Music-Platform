export const truncateText = (text: string, maxLength?: number) => {
    if (maxLength && text.length > maxLength) {
        return text.slice(0, maxLength) + "...";
    }
    return text;
};

export const capitalizeText = (text: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
};
