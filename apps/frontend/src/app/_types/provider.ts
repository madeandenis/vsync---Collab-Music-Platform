export enum Provider
{
    Spotify = "Spotify",
    YoutubeMusic = "YoutubeMusic", 
}

export const providerLabels: Record<Provider, string> = {
    [Provider.Spotify]: "Spotify",
    [Provider.YoutubeMusic]: "YouTube Music",
};
