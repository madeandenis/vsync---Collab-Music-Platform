import { GroupSession } from "@frontend/shared";
import { FaCaretDown } from "react-icons/fa";
import { Avatar } from "../Avatar";
import { avatarPlaceholder } from "../../_utils/svgUtil";
import { capitalizeText, truncateText } from "../../_utils/textUtil";
import { useState } from "react";
import Badge from "../Badge";

interface GroupParticipantsProps {
    session: GroupSession;
    currentUserId?: string;
    onKickMember?: (memberId: string) => void;
}

export function GroupParticipants({
    session,
    currentUserId,
    onKickMember,
}: GroupParticipantsProps) {
    const [isListOpen, setIsListOpen] = useState(false);
    const { participants } = session;

    return (
        <div className="relative flex flex-col gap-1 font-poppins">
            <div
                className="flex flex-row items-center justify-between gap-3 p-2 bg-white/10 text-white/80 rounded cursor-pointer"
                onClick={() => setIsListOpen((prev) => !prev)}
            >
                <div className="flex items-center gap-2 text-sm">
                    <span>Active listeners</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                        <span>{participants.length}</span>
                        <FaCaretDown className="text-green-300 w-3 h-3" />
                    </div>
                </div>
            </div>
            {
                isListOpen &&
                <ul className="absolute top-full bg-charcoalBlack p-2 space-y-1 rounded w-52 z-10 max-h-64 overflow-y-auto scrollbar">
                    {
                        participants.map((participant) => (
                            <li
                                className="flex flex-row items-center justify-between bg-white/10 p-1.5 rounded"
                                key={participant.sessionId}
                            >
                                <div className="flex items-center gap-2">
                                    <a href={participant.linkedAccount?.providerAccountUrl} target="_blank" rel="noopener noreferrer">
                                        <Avatar
                                            src={participant.avatarUrl}
                                            defaultSrc={avatarPlaceholder(participant.username || 'Unknown')}
                                            alt={`${participant.username} avatar`}
                                            size={28}
                                        />
                                    </a>
                                    <span
                                        title={participant.username}
                                        className="text-white/80 text-sm"
                                    >
                                        {truncateText(participant.username, 13)}
                                    </span>
                                </div>
                                <div title={capitalizeText(participant.role)}>
                                    <Badge role={participant.role} />
                                </div>
                            </li>
                        ))
                    }
                </ul>
            }
        </div>
    )
}