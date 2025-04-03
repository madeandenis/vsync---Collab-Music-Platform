import { FaEdit, FaEllipsisH, FaTrash, FaPlay } from 'react-icons/fa';
import OptionsList, { Option } from './OptionsList';
import { useState, useRef, useEffect } from 'react';
import { EditGroupForm } from '../forms/EditGroupForm';
import { Group } from '@frontend/shared';
import DeleteGroupForm from '../forms/DeleteGroupForm';

interface GroupOptionsProps {
    buttonSize: number;
    group: Group;
    startSessionAction: () => void;  // Start Session action passed as prop
}

export const GroupOptions = ({ buttonSize, group, startSessionAction }: GroupOptionsProps) => {
    const [openList, setOpenList] = useState(false);
    const [openEditForm, setEditOpenForm] = useState(false);
    const [openDeleteForm, setDeleteOpenForm] = useState(false);
    const groupOptionsRef = useRef<HTMLDivElement>(null);

    const toggleOpenList = () => setOpenList((prevState) => !prevState);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                groupOptionsRef.current &&
                !groupOptionsRef.current.contains(event.target as Node)
            ) {
                setOpenList(false); // Close the list
            }
        };i

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const EditGroup: Option = {
        label: 'Edit Group',
        icon: <FaEdit className='text-blue-300' />,
        action: () => setEditOpenForm(true),
    };

    const DeleteGroup: Option = {
        label: 'Delete Group',
        icon: <FaTrash className='text-red-500' />,
        action: () => setDeleteOpenForm(true),
    };

    const StartSession: Option = {
        label: 'Start Session',
        icon: <FaPlay className='text-green-500' />,
        action: startSessionAction,  // The start session action
    };

    const options: Option[] = [EditGroup, DeleteGroup];

    // Only add the start session option if the group isn't active yet
    if (!group.isActive) {
        options.push(StartSession);
    }

    return (
        <div
            ref={groupOptionsRef}
            className={`p-1 flex flex-col items-center rounded-full ${
                openList
                    ? 'bg-black/90 hover:bg-black/90 rounded-xl'
                    : 'bg-transparent'
            } transition-all ease-in-out`}
        >
            <FaEllipsisH size={buttonSize} className="text-white/80" onClick={() => toggleOpenList()} />
            {openList && <OptionsList options={options} hideLabels={true} />}
            {openEditForm && <EditGroupForm setOpen={setEditOpenForm} group={group} />}
            {openDeleteForm && <DeleteGroupForm setOpen={setDeleteOpenForm} group={group} />}
        </div>
    );
};
