import { ReactNode } from "react";

interface ToggleSwitchProps {
  isOn: boolean;
  handleToggle?: () => void;
  size?: "sm" | "md" | "lg";
  onColor?: string;
  offColor?: string;
  thumbColor?: string;
  disabled?: boolean;
  showIcons?: boolean;
  onIcon?: ReactNode;
  offIcon?: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export default function ToggleSwitch({
  isOn,
  handleToggle,
  size = "md",
  onColor = "bg-green-500",
  offColor = "bg-gray-600",
  thumbColor = "bg-white",
  disabled = false,
  showIcons = false,
  onIcon = null,
  offIcon = null,
  ariaLabel = "Toggle switch",
  className = "",
}: ToggleSwitchProps) {
  // Size configuration
  const sizeClasses = {
    sm: {
      container: "h-5 w-9",
      thumb: "h-3 w-3",
      translate: "translate-x-4",
    },
    md: {
      container: "h-6 w-11",
      thumb: "h-4 w-4",
      translate: "translate-x-5",
    },
    lg: {
      container: "h-7 w-14",
      thumb: "h-5 w-5",
      translate: "translate-x-7",
    },
  };

  return (
    <button
      type="button"
      className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        isOn ? onColor : offColor
      } ${sizeClasses[size].container} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      onClick={!disabled ? handleToggle : undefined}
      aria-pressed={isOn}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <span
        className={`inline-flex items-center justify-center transform rounded-full transition-transform ${
          sizeClasses[size].thumb
        } ${thumbColor} ${isOn ? sizeClasses[size].translate : "translate-x-1"}`}
      >
        {showIcons && (
          <span className="absolute inset-0 flex items-center justify-center">
            {isOn ? onIcon : offIcon}
          </span>
        )}
      </span>
    </button>
  );
}