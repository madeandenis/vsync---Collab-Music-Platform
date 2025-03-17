import { APP_NAME } from "../_constants/appConfig";
import { useUserContext } from "../contexts/userContext";
import { Avatar } from "./Avatar";
import { avatarUrl } from "../_utils/avatarUtils";
import { avatarPlaceholder } from "../_utils/svgUtil";
import { platformIcon } from "../_utils/iconUtils";
import { UserProfile } from "@frontend/shared";
import { useRouter } from "next/navigation";

const platformAccountLink = (profile: UserProfile) => {
    if(profile.external_urls && profile.platform)
    {
        const platformKey = profile.platform.toLowerCase() as keyof typeof profile.external_urls;
        if(platformKey)
        {
            return profile.external_urls[platformKey];
        }
    }
}

export const ProfileHeader = () => {
    const iconSize = 30;

    const router = useRouter();
    const { profile } = useUserContext();

    function redirectToProfile() {
        router.push('/user/profile');
    }
    
    return (
        <div className={`p-5 flex justify-between items-center rounded-md bg-black/40 hover:bg-black/60 transition-all duration-500`}>
            <div className="text-xl text-white font-poppins">{APP_NAME}</div>
            {
                profile && (
                    <div className="flex gap-x-3 items-center">
                        <Avatar 
                            onClick={redirectToProfile}
                            src={avatarUrl(profile)}
                            defaultSrc={avatarPlaceholder(profile.display_name || '?', false, 'black', '#18df88')}
                            alt={`${profile.display_name} avatar`}
                            size={iconSize}
                            rounded={true}
                            className="shadow-[0_0_0_5px_#1f1f1f] hover:shadow-[0_0_0_8px_#1f1f1f] transition-shadow duration-300 cursor-pointer" 
                        />  
                        {
                            profile.platform && (
                                <a href={platformAccountLink(profile)} target="_blank" rel="noopener noreferrer">
                                    {platformIcon(profile.platform, iconSize, 'rgba(255,255,255,0.9)')}
                                </a>
                            )
                        }
                    </div>
                )
            }
        </div>
    )
}   