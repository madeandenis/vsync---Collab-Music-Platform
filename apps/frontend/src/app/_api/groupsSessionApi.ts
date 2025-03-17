import { GroupSession } from "@frontend/shared";
import { fetchApi } from "../_utils/fetchUtils";

export const fetchGroupSession = async (groupId: string): Promise<GroupSession> => {
    return await fetchApi(`/api/groups/${groupId}/session/status`);
};

export const startGroupSession = async (groupId: string): Promise<void> => {
    return await fetchApi(`/api/groups/${groupId}/session/start`, {
        method: 'POST',
    });
};

export const stopGroupSession = async (groupId: string): Promise<void> => {
    return await fetchApi(`/api/groups/${groupId}/session/stop`, {
        method: 'POST',
    });
};
