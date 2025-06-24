import React from "react";
import { FaCrown, FaUserCheck, FaUserAlt } from "react-icons/fa";

type UserRole = "admin" | "authenticated" | "guest";

interface BadgeProps {
  role: UserRole;
}

const Badge: React.FC<BadgeProps> = ({ role }) => {
  let roleClass = "";
  let Icon;

  switch (role) {
    case "admin":
      roleClass = "bg-yellow-500/20 text-yellow-300";
      Icon = FaCrown;
      break;
    case "authenticated":
      roleClass = "bg-green-500/20 text-green-300";
      Icon = FaUserCheck;
      break;
    case "guest":
    default:
      roleClass = "bg-white/10 text-white/50";
      Icon = FaUserAlt;
      break;
  }

  return (
    <span
      className={`flex items-center gap-1 text-xs p-2 rounded-xl ${roleClass}`}
    >
      <Icon />
    </span>
  );
};

export default Badge;
