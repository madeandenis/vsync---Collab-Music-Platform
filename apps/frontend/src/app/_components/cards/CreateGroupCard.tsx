"use client";

import ThumbnailCard from "./ThumbnailCard";
import { useState } from "react";
import { CreateGroupForm } from "../forms/CreateGroupForm";
import Thumbnail from "../thumbnails/Thumbnail";
import { FaPlus } from "react-icons/fa";
import { useGroupsContext } from "../../contexts/groupsContext";

interface CreateGroupCardProps
{
    size: number
}

export const CreateGroupCard = ({ size }: CreateGroupCardProps) => {
    const [openForm, setOpenForm] = useState(false);

    const { refetchAll } = useGroupsContext();

    const thumbnail = <Thumbnail 
        src={undefined}
        placeHolder={<FaPlus size={size/5} />}
        alt={'create-group-thumbnail'}
        size={size}
    />
    
    return( 
        <>
            <ThumbnailCard 
                thumbnail={thumbnail}
                name={'Create group'}
                onClick={() => setOpenForm(true)}
            />
            {openForm && <CreateGroupForm setOpen={setOpenForm} refetchAll={refetchAll}/>}
        </>
    )
}