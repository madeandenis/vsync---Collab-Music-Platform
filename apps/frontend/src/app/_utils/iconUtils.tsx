import { UserProfile } from "@frontend/shared";
import { FaSpotify } from "react-icons/fa";
import { SiYoutubemusic } from "react-icons/si";

export const platformIcon = (platform: UserProfile['platform'], iconSize: number, customColor?: string) => {
    let color: string;

    if (customColor) {
      color = customColor;
    } else {
      switch (platform) {
        case 'Spotify':
          color = '#1DB954'; 
          break;
        case 'YoutubeMusic':
          color = '#FF0000'; 
          break;
        default:
          color = '#000000'; 
      }
    }
  
    switch (platform) {
      case 'Spotify':
        return <FaSpotify size={iconSize} color={color} />;
      case 'YoutubeMusic':
        return <SiYoutubemusic size={iconSize} color={color} />;
      default:
        return null;    
    }
};
