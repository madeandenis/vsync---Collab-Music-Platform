import { Dispatch, SetStateAction, useState } from 'react';
import { Group } from '@frontend/shared';
import { Backdrop } from '../Backdrop';
import { useMutation } from '@tanstack/react-query';
import { deleteUserGroup } from '../../_api/groupsApi';
import { useGroupsContext } from '../../contexts/groupsContext';

interface DeleteGroupFormProps {
    setOpen: Dispatch<SetStateAction<boolean>>;
    group: Group
}

const DeleteGroupForm = ({ setOpen, group }: DeleteGroupFormProps) => {
    const { refetchAll } = useGroupsContext();
    
    const closeModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(false);
    };
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(true);
    };

    const deleteMutation = useMutation({
        mutationFn: (groupId: string) => deleteUserGroup(groupId),
        onSuccess: () => {
            refetchAll();
            setOpen(false);
        },
        onError: () => {
            setOpen(false);
        },
    });

    function deleteGroup() {
        deleteMutation.mutate(group.id);
    };

    const handleCancel = () => {
        if (deleteMutation.isPending) {
            deleteMutation.reset(); 
        }
        setOpen(false);
    };
    
    return (
        <Backdrop opacity={40} onClick={closeModal}>
            <div className="p-6 max-w-sm mx-auto bg-charcoalBlack rounded-xl text-white/90 border border-gray-700" onClick={handleContentClick}>
                <h2 className="text-xl font-semibold text-red-500 mb-4">Delete Group</h2>

                <p className="mb-6 text-sm">
                    Are you sure you want to delete the group <span className="text-base font-bold">{group.name}</span> ? This action cannot be undone.
                </p>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-sm rounded disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={deleteMutation.isPending}
                        onClick={deleteGroup}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-sm rounded disabled:opacity-50"
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </Backdrop>

    );
};

export default DeleteGroupForm;
