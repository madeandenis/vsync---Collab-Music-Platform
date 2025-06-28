import React from 'react';
import { Avatar } from '../Avatar';
import { avatarPlaceholder } from '../../_utils/svgUtil';
import { avatarUrl } from '../../_utils/avatarUtils';
import { UserProfile } from '@frontend/shared';

const ProfileCard = ({ profile, groupsCount = 0 }: { profile: UserProfile, groupsCount?: number }) => {

    const avatarProps = avatarUrl(profile) ? {
        src: avatarUrl(profile),
        size: 120,
        className: 'shadow-hover-black'
    } :
        {
            src: '',
            size: 100,
            className: "shadow-[0_0_25px_0_#148f3f] hover:shadow-[0_0_5px_0_#148f3f] transition-shadow duration-500"
        }

    return (
        <div className="container mx-auto w-[90%] max-w-lg rounded-xl bg-white/5 p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    {/* Avatar */}

                    <Avatar
                        src={avatarProps.src}
                        defaultSrc={avatarPlaceholder(profile.display_name || 'Unknown')}
                        alt={`${profile.display_name} avatar`}
                        size={avatarProps.size}
                        className={avatarProps.className}
                        rounded
                    />
                </div>
                {/* Profile Info */}
                <div className='flex flex-col gap-y-1'>
                    <h1 className="text-sm text-white text-opacity-80 font-poppins hidden sm:inline">Profile</h1>
                    <h1
                        className="text-white font-extrabold font-poppins break-words"
                        style={{
                            fontSize:
                                (profile.display_name ?? 'Unknown').length > 8
                                    ? '2.5rem'
                                    : (profile.display_name ?? 'Unknown').length  > 3
                                        ? '3.5rem'
                                        : '4.5rem',
                        }}
                    >
                        {profile.display_name}
                    </h1>
                    <div className='flex gap-1'>
                        {(profile.followers?.total ?? 0) > 0 || groupsCount > 0 ? (
                            <div className="flex gap-1 text-sm text-white text-opacity-80 font-poppins">
                                {profile.followers?.total ? (
                                    <span>
                                        {profile.followers.total} follower{profile.followers.total > 1 ? 's' : ''}
                                    </span>
                                ) : null}

                                {profile.followers?.total && groupsCount > 0 ? <span>•</span> : null}

                                {groupsCount > 0 ? (
                                    <span>
                                        {groupsCount} group{groupsCount > 1 ? 's' : ''}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
