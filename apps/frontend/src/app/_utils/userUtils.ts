import { UserProfile } from "@frontend/shared";

export const extractUserId = (profile: UserProfile | null): string | null => {
    if (!profile || !profile.id || !profile.platform) {
        return null;
    }
    return `${profile.platform}-${profile.id}`;
};
