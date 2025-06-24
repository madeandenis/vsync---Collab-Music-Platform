import React from "react";

interface BackdropProps {
  opacity?: number; 
  zIndex?: number;  
  onClick?: (e: React.MouseEvent) => void;  
  children: React.ReactNode;
}

export const Backdrop = ({ opacity = 100, zIndex = 999, onClick, children }: BackdropProps) => {
  return (
    <div
      className="fixed inset-0 w-screen h-screen flex justify-center items-center"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${opacity / 100})`,  
        zIndex: zIndex, 
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
