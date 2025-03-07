import { CreateGroupDto, Group } from "@frontend/shared";
import { fetchApi } from "../_utils/fetchUtils";

export const fetchUserGroups = async(): Promise<Group[]> => {
    return await fetchApi('/api/groups');
}

export const createUserGroup = async (groupDto: CreateGroupDto) => {
    return await fetchApi('/api/groups', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupDto),
    });
};
