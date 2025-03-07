interface AvatarProps {
    src: string | undefined;
    defaultSrc: string;
    alt?: string;
    size?: number;
    rounded?: boolean;
    className?: string; 
    onClick?: () => void;
}

export const Avatar = (props: AvatarProps) => {
    return (
        <img
            src={props.src ? props.src : props.defaultSrc}
            alt={props.alt}
            loading="lazy"
            className={`${props.rounded ? "rounded-full" : "rounded-lg"} ${props.className}`}
            style={{ width: `${props.size}px`, height: `${props.size}px`, objectFit: "cover" }}
            onClick={props.onClick}
        />
    );
}