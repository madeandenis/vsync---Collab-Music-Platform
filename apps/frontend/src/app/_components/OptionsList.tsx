export interface Option {
    label: string;
    icon?: React.ReactNode;
    action?: (...args: any[]) => void;
}

interface OptionsListProps {
    options: Option[];
    hideLabels?: boolean
}

const OptionsList = ({ options, hideLabels = false }: OptionsListProps) => (
    <ul>
        {options.map((option, index) => (
            <li
                key={index}
                onClick={option.action}
                className="p-3 my-1 flex justify-center items-center gap-1 hover:bg-white/20 border border-white border-opacity-20 rounded-lg"
            >
                { option.icon && <span>{option.icon}</span>}
                { !hideLabels && <span className="text-xs">{option.label}</span>}
            </li>
        ))}
    </ul>
);

export default OptionsList;
