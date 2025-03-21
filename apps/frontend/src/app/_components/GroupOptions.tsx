import { FaEdit, FaEllipsisH, FaTrash } from 'react-icons/fa';
import OptionsList, { Option } from './OptionsList';
import { useEffect, useRef, useState } from 'react';
import { EditGroupForm } from './forms/EditGroupForm';
import { Group } from '@frontend/shared';
import DeleteGroupForm from './forms/DeleteGroupForm';

interface GroupOptionsProps {
    buttonSize: number;
    group: Group;
}

export const GroupOptions = ({ buttonSize, group }: GroupOptionsProps) => {

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
        };

        // attach
        document.addEventListener('mousedown', handleClickOutside);
        // dettach
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const EditGroup: Option = {
        label: 'Edit Group',
        icon: <FaEdit className='text-blue-300' />,
        action: () => setEditOpenForm(true),
    }
    const DeleteGroup: Option = {
        label: 'Delete Group',
        icon: <FaTrash className='text-red-500' />,
        action: () => setDeleteOpenForm(true),
    }

    const options: Option[] = [EditGroup, DeleteGroup]

    return (
        <div
            ref={groupOptionsRef}
            className={
                `p-1 flex flex-col items-center rounded-full
                    ${openList
                    ? 'bg-black/90 hover:bg-black/90 rounded-xl'
                    : 'bg-transparent'
                }
                transition-all ease-in-out`
            }>
            <FaEllipsisH size={buttonSize} className='text-white/80' onClick={() => toggleOpenList()} />
            {openList && <OptionsList options={options} hideLabels={true} />}
            {openEditForm && <EditGroupForm setOpen={setEditOpenForm} group={group} />}
            {openDeleteForm && <DeleteGroupForm setOpen={setDeleteOpenForm} group={group}/>}
        </div>
    );

}