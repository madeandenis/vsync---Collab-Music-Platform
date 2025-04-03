import { useState } from "react";
import { FaCaretDown, FaCaretUp } from "react-icons/fa";

interface VoteButtonProps {
    voteCount: number;
    onUpvote: () => void;
    onDownvote: () => void;
    onWithdrawVote: () => void;
}

export default function VoteButton({ voteCount, onUpvote, onDownvote, onWithdrawVote }: VoteButtonProps) {
    const [voteState, setVoteState] = useState<"upvoted" | "downvoted" | "none">("none");
    
    const handleUpvote = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (voteState === "upvoted") return;
        setVoteState("upvoted");
        onUpvote();
    };

    const handleDownvote = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (voteState === "downvoted") return;
        setVoteState("downvoted");
        onDownvote();
    };

    const handleWithdrawVote = () => {
        if (voteState === "none") return; 
        setVoteState("none");
        onWithdrawVote();
    };
    
    return (
        <div 
            className="flex flex-col justify-center items-center bg-white/10 px-2 py-1 rounded-xl cursor-pointer"
            onClick={handleWithdrawVote}
        >            <FaCaretUp 
                size={18} 
                className={`cursor-pointer ${voteState === "upvoted" ? 'text-green-500' : 'text-gray-200'}`} 
                onClick={handleUpvote} 
            />
            <span className="text-sm">{voteCount}</span>
            <FaCaretDown 
                size={18} 
                className={`cursor-pointer ${voteState === "downvoted" ? 'text-red-500' : 'text-gray-200'}`} 
                onClick={handleDownvote} 
            />
        </div >
    )
}