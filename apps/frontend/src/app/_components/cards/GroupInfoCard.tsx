import React from 'react';
import { Avatar } from '../Avatar';
import { FaLock, FaGlobe } from 'react-icons/fa';
import { avatarPlaceholder } from '../../_utils/svgUtil';
import { Group } from '@frontend/shared';
import { platformIcon } from '../../_utils/iconUtils';

const GroupInfoCard = ({ group }: { group: Group }) => {
    return (
        <div className="container mx-auto w-[90%] max-w-lg rounded-xl bg-white/5 p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Group Thumbnail */}
                <Avatar
                    src={group.imageUrl ?? undefined}
                    defaultSrc={avatarPlaceholder(group.name)}
                    alt={`${group.name} thumbnail`}
                    size={150}
                />
                {/* Group Info */}
                <div className='flex flex-col gap-y-2'>
                    <h1 className="text-3xl text-white font-extrabold font-poppins break-words">{group.name}</h1>
                    {
                        group.description && 
                        <p className="text-xs text-white text-opacity-60 font-poppins break-words">{group.description}</p>
                    }
                    <div className='flex flex-wrap gap-x-4 gap-y-2 items-center font-poppins'>
                        <span className="flex items-center gap-1">
                            {group.isPublic ? (
                                <>
                                    <FaGlobe className="text-white text-opacity-60" size={14}/>
                                    <span className="text-sm text-white text-opacity-80">Public</span>
                                </>
                            ) : (
                                <>
                                    <FaLock className="text-white text-opacity-60" size={14}/>
                                    <span className="text-sm text-white text-opacity-80">Private</span>
                                </>
                            )}
                        </span>
                        <div className='flex items-center gap-1'>
                            {platformIcon(group.platform, 17)}
                            <span className="text-sm text-white text-opacity-80">{group.platform}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupInfoCard;