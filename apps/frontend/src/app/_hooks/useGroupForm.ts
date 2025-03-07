import { useMutation } from '@tanstack/react-query';
import React, { Dispatch, SetStateAction, useRef, useState } from 'react';
import { createUserGroup } from '../_api/groupsApi';
import { CreateGroupDto, Group } from '@frontend/shared';
import { useUserContext } from '../contexts/userContext';
import { normalize } from '../_utils/sanitizeUtils';
import { useAlertContext } from '../contexts/alertContext';
import { useGroupsContext } from '../contexts/groupsContext';

interface GroupFormState {
    name: string;
    description: string | undefined;
    thumbnailSrc: string | undefined;
    thumbnailError: string | undefined;
}

interface GroupFormSetters {
    setName: Dispatch<SetStateAction<string>>;
    setDescription: Dispatch<SetStateAction<string | undefined>>;
    setThumbnail: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setThumbnailSrc: (file?: File) => void | (() => void);
    setThumbnailError: (error: string) => void;
    createGroup: () => void;
    updateGroup: () => void;
    deleteGroup: () => void;
}

export default function useGroupForm(group?: Group) {
    const [name, setName] = useState<string>(group?.name ?? '');
    const [description, setDescription] = useState<string | undefined>(group?.description ?? undefined);
    const [thumbnailSrc, setThumbnailSrcState] = useState<string | undefined>(group?.imageUrl ?? undefined);
    const [thumbnailError, setThumbnailErrorState] = useState<string | undefined>(undefined);
    const timeoutId = useRef<NodeJS.Timeout | null>(null);

    const { profile } = useUserContext();
    const { setAlert } = useAlertContext(); 
    const { refetch } = useGroupsContext();

    const setThumbnailSrc = (file?: File) => {
        if(!file) return setThumbnailSrcState(undefined);

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
            setThumbnailErrorState(undefined);
        }, 3000);
    };


    const setThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const maxSize = 2 * 1024 * 1024;
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

    const mutation = useMutation({
        mutationFn: createUserGroup,
        onSuccess: () => {
            setAlert(`${name} created!`, 'success')
            refetch();
        }
    });

    const createGroup = () => {
        if (!profile) return;

        const dtoName = normalize(name);
        const dtoDescription = normalize(description);

        const groupDto: CreateGroupDto = {
            name: dtoName, 
            description: dtoDescription, 
            imageUrl: '',
            isPublic: false,
            platform: profile.platform, 
        } 

        mutation.mutate(groupDto);
    };

    const updateGroup = () => {};
    const deleteGroup = () => {};

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
    }
} 