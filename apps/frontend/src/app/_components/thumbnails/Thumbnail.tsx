import React, { Children } from 'react';

interface ThumbnailProps {
    src: string | undefined;
    placeHolder: React.ReactNode
    alt?: string;
    size?: number;
    children?: React.ReactNode;
}

const Thumbnail = (props: ThumbnailProps) => {
    return (
        <div
            className='flex justify-center items-center cursor-pointer
                     bg-[#121212] bg-opacity-80 text-gray-300
                     transition-all duration-300 
                     border-2 border-white border-opacity-5 rounded group relative'
            style={{width: props.size,height: props.size}}
        >
            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black opacity-10 group-hover:opacity-50 transition-opacity duration-300 rounded"></div>
            {
                props.src ? 
                    (
                        <img
                            src={props.src}
                            alt={props.alt}
                            className="w-full h-full object-cover rounded"
                        />
                    ) : 
                    (
                        props.placeHolder
                    )
            }
            {props.children}
        </div>
    );
};

export default Thumbnail;
