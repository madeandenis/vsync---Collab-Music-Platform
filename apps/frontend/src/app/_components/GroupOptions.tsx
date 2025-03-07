import { FaEdit, FaEllipsisH, FaPlay, FaStop, FaTrash } from 'react-icons/fa';
import OptionsList, { Option } from './OptionsList';
import { useState } from 'react';

interface GroupOptionsProps {
    size: number
    activeSession: boolean;
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


export const GroupOptions = ({size, activeSession}: GroupOptionsProps) => {
    
    const [openList, setOpenList] = useState(false);
    const toggleOpenList = () => setOpenList((prevState) => !prevState); 
    
    const options: Option[] = [activeSession ? StopSession : StartSession, EditGroup, DeleteGroup]

    return (
        <div className={`p-2 flex flex-col items-center bg-white/5 hover:bg-white/20 ${openList && 'bg-black/90 hover:bg-black/90'} transition-all rounded-full`}>
            <FaEllipsisH size={size} className='text-white' onClick={() => toggleOpenList()}/>
            { openList && <OptionsList options={options} hideLabels={true} /> }
        </div>
    );
    
}