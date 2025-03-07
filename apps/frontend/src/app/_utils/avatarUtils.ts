import { UserProfile } from "@frontend/shared";

export const avatarUrl = (profile: UserProfile) => {
    if (profile.images && profile.images.length > 0) {
        return profile.images[0].url;
    }
};