import { useState } from "react";
import { FaCaretDown, FaCaretUp, FaSortDown, FaSortUp } from "react-icons/fa";

interface VoteButtonProps {
    voteCount: number;
    onUpvote: () => void;
    onDownvote: () => void;
}

export default function VoteButton({ voteCount, onUpvote, onDownvote }: VoteButtonProps) {
    const [isUpvoted, setIsUpvoted] = useState(false);
    const [isDownvoted, setIsDownvoted] = useState(false);
    
    const handleUpvote = () => {
        setIsUpvoted(true);
        setIsDownvoted(false);
        onUpvote();
    };
    
    const handleDownvote = () => {
        setIsDownvoted(true);
        setIsUpvoted(false);
        onDownvote();
    };
    
    return (
        <div className="ml-4 flex flex-col justify-center items-center bg-white/10 px-2 py-1 rounded-xl">
            <FaCaretUp 
                size={20} 
                className={`cursor-pointer ${isUpvoted ? 'text-green-500' : 'text-gray-200'}`} 
                onClick={handleUpvote} 
            />
            <span>{voteCount}</span>
            <FaCaretDown 
                size={20} 
                className={`cursor-pointer ${isDownvoted ? 'text-red-500' : 'text-gray-200'}`} 
                onClick={handleDownvote} 
            />
        </div >
    )
}