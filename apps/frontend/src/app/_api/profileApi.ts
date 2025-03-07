import { UserProfile } from "@frontend/shared";
import { fetchApi } from "../_utils/fetchUtils";

export const fetchUserProfile = async (): Promise<UserProfile> => {
    return await fetchApi('/api/user-profile');
}
