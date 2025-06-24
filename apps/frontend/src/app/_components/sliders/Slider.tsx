import React, { useEffect, useState } from "react";

type SliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max" | "className"> & {
    value: number;
    min: number;
    max: number;
    className?: string;
    trackColor?: string;
    fillColor?: string;
    thumbColor?: string;
    roundedThumb?: boolean;
    thumbWidth?: number,
    thumbHeight?: number,
    displayThumb?: boolean;
    width?: string;
    height?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const Slider = React.forwardRef<HTMLInputElement, SliderProps>((props, ref) => {
    const {
        value,
        min,
        max,
        className,
        onChange,
        trackColor = '#282828',
        fillColor = '#4ade80',
        thumbColor = 'white',
        thumbWidth = 12,
        thumbHeight = 12,
        roundedThumb = true,
        displayThumb = true,
        width,
        height = '5px',
        ...rest
    } = props;

    const [percentage, setPercentage] = useState<number>((value - min) / (max - min) * 100);

    useEffect(() => {
        const newPercentage = ((value - min) / (max - min)) * 100;
        setPercentage(newPercentage);
    }, [value, min, max]);

    return (
        <input
            type="range"
            ref={ref}
            className={`slider ${displayThumb ? '' : 'slider-hide-thumb'} ${className}`}
            style={{
                width: width,
                height: height,
                '--progress-percent': `${percentage}%`,
                '--fill-color': fillColor,
                '--track-color': trackColor,
                '--thumb-color': thumbColor,
                '--thumb-radius': roundedThumb ? '50%' : '0%',
                '--thumb-width': `${thumbWidth}px`,
                '--thumb-height': `${thumbHeight}px`,
            } as React.CSSProperties}
            value={value}
            min={min}
            max={max}
            onChange={onChange}
            {...rest}
        />
    );
});

Slider.displayName = "Slider";

export default Slider;