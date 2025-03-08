import { CreateGroupDto, Group, UpdateGroupDto } from "@frontend/shared";
import { fetchApi } from "../_utils/fetchUtils";

export const fetchUserGroups = async(): Promise<Group[]> => {
    return await fetchApi('/api/groups');
}

export const createUserGroup = async (groupDto: CreateGroupDto): Promise<Group> => {
    return await fetchApi('/api/groups', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupDto),
    });
};

export const updateUserGroup = async (groupId: string, groupDto: UpdateGroupDto): Promise<Group> => {
    return await fetchApi(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupDto),
    });
};

export const uploadGroupThumbnail = async (groupId: string, thumbnail: File) => {
    const formData = new FormData();
    formData.append('file', thumbnail);

    return await fetchApi(`/api/groups/${groupId}/upload-thumbnail`, {
        method: 'POST',
        body: formData,  
    });
};