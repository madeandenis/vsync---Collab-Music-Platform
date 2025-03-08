import { FaEdit, FaEllipsisH, FaPlay, FaStop, FaTrash } from 'react-icons/fa';
import OptionsList, { Option } from './OptionsList';
import { useEffect, useRef, useState } from 'react';
import { EditGroupForm } from './forms/EditGroupForm';
import { Group } from '@frontend/shared';

interface GroupOptionsProps {
    buttonSize: number;
    group: Group;
}

const StartSession: Option = {
    label: 'Start Session',
    icon: <FaPlay className='text-emerald-500' />,
}
const StopSession: Option = {
    label: 'Stop Session',
    icon: <FaStop className='text-emerald-500' />,
}
const EditGroup: Option = {
    label: 'Edit Group',
    icon: <FaEdit className='text-blue-300' />,
}
const DeleteGroup: Option = {
    label: 'Delete Group',
    icon: <FaTrash className='text-rose-600' />,
}

export const GroupOptions = ({ buttonSize, group }: GroupOptionsProps) => {

    const [openList, setOpenList] = useState(false);
    const [openEditForm, setEditOpenForm] = useState(false);
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
        };

        // attach
        document.addEventListener('mousedown', handleClickOutside);
        // dettach
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    EditGroup.action = setEditOpenForm;

    const options: Option[] = [group.isActive ? StopSession : StartSession, EditGroup, DeleteGroup]

    return (
        <div
            ref={groupOptionsRef}
            className={
                `p-2 flex flex-col items-center
                    ${openList
                    ? 'bg-black/90 hover:bg-black/90'
                    : 'bg-white/15 hover:bg-white/30'
                }
                    transition-all rounded-full`
            }>
            <FaEllipsisH size={buttonSize} className='text-white' onClick={() => toggleOpenList()} />
            {openList && <OptionsList options={options} hideLabels={true} />}
            {openEditForm && <EditGroupForm setOpen={setEditOpenForm} group={group} />}
        </div>
    );

}