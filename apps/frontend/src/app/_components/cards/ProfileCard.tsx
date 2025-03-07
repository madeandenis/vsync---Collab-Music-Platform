import React from 'react';
import { Avatar } from '../Avatar';
import { avatarPlaceholder } from '../../_utils/svgUtil';
import { avatarUrl } from '../../_utils/avatarUtils';
import { UserProfile } from '@frontend/shared';

const ProfileCard = ({profile, groupsCount = 0}: {profile: UserProfile, groupsCount?: number}) => {

    return (
        <div className="container mx-auto px-10 py-10 w-3/4 max-w-3xl rounded-xl bg-white/5">
            <div className="flex items-top space-x-6">
                {/* Avatar */}
                <Avatar
                    src={avatarUrl(profile)}
                    defaultSrc={avatarPlaceholder(profile.display_name || 'Unknown')}
                    alt={`${profile.display_name} avatar`}
                    size={100}
                    rounded
                    className="shadow-[0_0_25px_0_#148f3f] hover:shadow-[0_0_5px_0_#148f3f] transition-shadow duration-500"
                />
                {/* Profile Info */}
                <div className='flex flex-col gap-y-2 -mt-3'>
                    <h1 className="text-sm text-white text-opacity-80 font-poppins">Profile</h1>
                    <h1 className="text-6xl text-white font-extrabold font-poppins">{profile.display_name}</h1>
                    <div className='flex gap-1'>
                        {
                            profile.followers?.total && (
                                <h1 className="text-sm text-white text-opacity-80 font-poppins">{profile.followers.total} followers</h1>
                            )
                        }
                        {
                            groupsCount > 0 && (
                                <h1 className="text-sm text-white text-opacity-80 font-poppins">• {groupsCount} groups</h1>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
