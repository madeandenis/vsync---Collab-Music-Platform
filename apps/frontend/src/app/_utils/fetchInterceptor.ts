export const fetchInterceptor = (url: string, status: number) => {
    // Special-case Spotify analytics requests
    if (
        url.includes("cpapi.spotify.com") ||
        url.includes("event/item_before_load")
    ) {
        if (status === 404 || status === 400) {
            console.log(`Intercepted ${status} response for ${url.split("?")[0]}`);
            return { };
        }
    }
    return null;
};
