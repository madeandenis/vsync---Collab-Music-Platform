import React from "react";

interface BackdropProps
{
    opacity?: number
    onClick?: (any: any) => void;
    children: React.ReactNode; 
}

export const Backdrop = ({ opacity = 100, onClick, children }: BackdropProps) => {
    return (
      <div
        className="fixed inset-0 w-screen h-screen flex justify-center items-center z-[999] bg-black"
        style={{ backgroundColor: `rgba(0, 0, 0, ${opacity / 100})` }}
        onClick={onClick}
      >
        {children}
      </div>
    );
  };
  