import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";

interface AlertContent {
    title: string;
    details?: string
}

export interface AlertProps {
    type: "success" | "error" | "warning" | "info";
    content: AlertContent;
    duration?: number;
    dismissible?: boolean;
    children?: React.ReactNode;
    index?: number;
    onClose: () => void;
}

const variantStyles = {
    success: "alert-success",
    error: "alert-error",
    warning: "alert-warning",
    info: "alert-info",
};

const variantIcons = {
    success: <FaCheckCircle size={20} />,
    error: <FaTimesCircle size={20} />,
    warning: <FaExclamationTriangle size={20} />,
    info: <FaInfoCircle size={20} />,
};

export default function Alert({ type, content, duration, dismissible = true, children, index, onClose }: AlertProps) {

    const visibleIndex = (index ?? -1) > 0;

    useEffect(() => {
        if (duration) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const alertContent = (
        <div className={`${variantStyles[type]} fixed top-6 px-6 py-4 flex flex-col left-1/2 transform -translate-x-1/2 rounded-lg z-[1000]`}>
            <div className="flex items-center justify-between gap-6">
                <h1 className="text-xl font-bold">{content.title}</h1>
                <div>
                    {dismissible && (
                        <button
                            onClick={onClose}
                            className={`rounded-full flex items-center ${visibleIndex && 'bg-black/60 px-2 py-1'}`}
                        >
                            { visibleIndex && <span className="mr-2">{index}</span>}
                            <span>{variantIcons[type]}</span>
                        </button>

                    )}
                </div>
            </div>
            {
                content.details && 
                <h1 className="mt-4">
                    {content.details}
                </h1>
            }
            {/* Optional (eg. StackTrace) */}
            {children}
        </div>
    )

    return ReactDOM.createPortal(alertContent, document.body);
}