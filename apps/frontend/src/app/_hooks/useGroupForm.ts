import { useMutation } from '@tanstack/react-query';
import React, { Dispatch, SetStateAction, useRef, useState } from 'react';
import { createUserGroup, updateUserGroup, uploadGroupThumbnail } from '../_api/groupsApi';
import { CreateGroupDto, Group, UpdateGroupDto } from '@frontend/shared';
import { useUserContext } from '../contexts/userContext';
import { normalize } from '../_utils/sanitizeUtils';
import { useAlertContext } from '../contexts/alertContext';
import { useGroupsContext } from '../contexts/groupsContext';

interface GroupFormState {
    name: string;
    description: string;
    thumbnailSrc: string | null;
    thumbnailError: string | null;
}

interface GroupFormSetters {
    setName: Dispatch<SetStateAction<string>>;
    setDescription: Dispatch<SetStateAction<string>>;
    setThumbnail: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setThumbnailSrc: (file: File | null) => void | (() => void);
    setThumbnailError: (error: string) => void;
    createGroup: () => void;
    updateGroup: () => void;
    deleteGroup: () => void;
}

export interface GroupFormContext {
    state: GroupFormState;
    setters: GroupFormSetters
}

export default function useGroupForm(group?: Group) {
    const [name, setName] = useState<string>(group?.name ?? "");
    const [description, setDescription] = useState<string>(group?.description ?? "");
    const [thumbnailSrc, setThumbnailSrcState] = useState<string | null>(
        group?.imageUrl ? `${group.imageUrl}?v=${Date.now()}` : null // Cache busting
    );
    const [thumbnailError, setThumbnailErrorState] = useState<string | null>(null);
    const [thumbnail, setThumbnailState] = useState<File | null>(null);
    const timeoutId = useRef<NodeJS.Timeout | null>(null);

    const { profile } = useUserContext();
    const { setAlert } = useAlertContext();
    const { refetchAll } = useGroupsContext();

    const setThumbnailSrc = (file: File | null) => {
        if (!file) return setThumbnailSrcState(null);

        const objectUrl = URL.createObjectURL(file);
        setThumbnailSrcState(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }
    const setThumbnailError = (error: string) => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        setThumbnailErrorState(error);
        timeoutId.current = setTimeout(() => {
            setThumbnailErrorState(null);
        }, 3000);
    };

    // TODO - strip file of data & rename
    const setThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const maxSize = 1 * 1024 * 1024;
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

        if (!files) return;

        const selectedFile = files[0];

        if (!selectedFile) {
            return;
        }

        if (!allowedTypes.includes(selectedFile.type)) {
            setThumbnailError('File type must be png, jpg, jpeg, or gif');
            return;
        }
        if (selectedFile.size > maxSize) {
            setThumbnailError(`File size must be less than ${maxSize / (1024 * 1024)} MB`);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => { // called after reading is complete (readAsDataURL)
            const image = new Image();

            image.onload = () => {
                setThumbnailState(selectedFile);
                setThumbnailSrc(selectedFile);
            };

            image.onerror = () => {
                setThumbnailError('The file is not a valid image.');
            };

            image.src = reader.result as string; // try to load it into the Image object
        };
        reader.onerror = () => {
            setThumbnailError('The file is unreadable.');
        };

        reader.readAsDataURL(selectedFile);
    };

    const createGroupRequest = useMutation({
        mutationFn: createUserGroup,
        onSuccess: (group) => {
            setAlert(`${name} created!`, 'success')
            
            if(thumbnail)
            {
                uploadThumbnailRequest.mutate({groupId: group.id,thumbnail})
                return;
            }

            refetchAll();
        }
    });

    const updateGroupRequest = useMutation({
        mutationFn: ({ groupId, groupData }: { groupId: string; groupData: UpdateGroupDto }) =>
            updateUserGroup(groupId, groupData),
        onSuccess: (group) => {
            setAlert(`${name} updated!`, 'success')

            if(thumbnail)
            {
                uploadThumbnailRequest.mutate({groupId: group.id,thumbnail})
                return;
            }

            refetchAll();
        }
    });

    const uploadThumbnailRequest = useMutation({
        mutationFn: ({ groupId, thumbnail }: { groupId: string; thumbnail: File }) =>
            uploadGroupThumbnail(groupId, thumbnail),
        onSuccess: () => {
            refetchAll();
        },
        onError: () => {
            refetchAll();
        }
    });

    const createGroup = () => {
        if (!profile) return;

        const dtoName = normalize(name);
        if (dtoName === '') return;
        const dtoDescription = normalize(description);

        const groupDto: CreateGroupDto = {
            name: dtoName,
            description: dtoDescription,
            imageUrl: '',
            isPublic: false,
            platform: profile.platform,
        }

        createGroupRequest.mutate(groupDto);
    };

    const updateGroup = () => {
        if (!profile || !group) return;

        const dtoName = normalize(name);
        if (dtoName === '') return;
        const dtoDescription = normalize(description);

        const groupDto: UpdateGroupDto = {
            name: dtoName,
            description: dtoDescription,
            isPublic: false,
        }

        updateGroupRequest.mutate({
            groupId: group.id,
            groupData: groupDto
        });
    };

    const deleteGroup = () => { };

    const state: GroupFormState = {
        name,
        description,
        thumbnailSrc,
        thumbnailError,
    }
    const setters: GroupFormSetters = {
        setName,
        setDescription,
        setThumbnail,
        setThumbnailSrc,
        setThumbnailError,
        createGroup,
        updateGroup,
        deleteGroup,
    }

    return {
        state,
        setters
    } as GroupFormContext
} 