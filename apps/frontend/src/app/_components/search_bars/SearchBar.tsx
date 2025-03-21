import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { IoIosSearch } from "react-icons/io";
import { TiDelete } from "react-icons/ti";
import Spinner from "../Spinner";

interface SearchBarProps {
    onSearchQueryChange: Dispatch<SetStateAction<string | null>>;
    onSearchTrigger: () => void;
    onClear?: () => void;
    isLoading: boolean;
    placeholderText?: string;
}

const SearchBar = ({ onSearchQueryChange, onSearchTrigger, isLoading, placeholderText }: SearchBarProps) => {
    const [inputValue, setInputValue] = useState<string>("");

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            onSearchTrigger();
        }, 1000);

        // Cleanup the timeout if the input value changes
        return () => clearTimeout(delayDebounceFn);
    }, [inputValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        onSearchQueryChange(value);
    };

    const clearInput = () => {
        setInputValue('');
        onSearchQueryChange(null);
    };

    return (
        <div className="flex justify-center items-center rounded-lg bg-white/10">
            <input
                value={inputValue}
                onChange={handleInputChange}
                className="p-2 m-1 bg-white/0 outline-none text-slate-200 placeholder-slate-200"
                placeholder={placeholderText}
            >
            </input>
            <div className="flex-grow"></div>
            <button
                type="submit"
                onClick={onSearchTrigger}
                disabled={isLoading}
                className="p-2 m-1"
            >
                {
                    isLoading ? (
                        <Spinner size={22} />
                    ) : inputValue === "" ? (
                        <IoIosSearch size={22} className="text-white/80 hover:text-white" />
                    ) : (
                        <TiDelete
                            size={26}
                            className="text-white/80 hover:text-white"
                            onClick={() => clearInput()}
                        />
                    )
                }
            </button>
        </div>
    )
};

export default SearchBar;