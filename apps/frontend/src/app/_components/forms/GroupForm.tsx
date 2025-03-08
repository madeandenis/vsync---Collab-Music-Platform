import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Backdrop } from "../Backdrop";
import Thumbnail from "../thumbnails/Thumbnail";
import { FaUsers } from "react-icons/fa";
import { APP_NAME } from "../../_constants/appConfig";
import { GroupFormContext } from "../../_hooks/useGroupForm";
import { normalize } from "../../_utils/sanitizeUtils";

interface GroupFormProps {
    setOpen: Dispatch<SetStateAction<boolean>>;
    context: GroupFormContext
}

export const GroupForm = ({ setOpen, context }: GroupFormProps) => {

    const { state, setters } = context;
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    useEffect(() => {
        if (state.name) {
            setIsEditMode(true);
        }
    }, []);

    const closeModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(false);
    };
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(true);
    };

    return (
        <Backdrop opacity={40} onClick={closeModal}>
            
            {/* Modal Container */}
            <div className="container mx-auto px-6 py-4 w-3/4 max-w-2xl rounded-xl bg-graphite" onClick={handleContentClick}>

                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl text-white/90 font-nunito font-bold">
                        {isEditMode ? `Edit ${state.name}` : 'Create New Group'}
                    </h1>
                    {/* Close Button */}
                    <div className="hover:bg-white/10 w-7 h-7 transition-all rounded-full">
                        <button
                            className="text-3xl text-white/60 hover:text-white/90 -my-[7px] mx-[3.5px]"
                            onClick={closeModal}
                        >
                            &times;
                        </button>
                    </div>
                </div>
                {/* Group Thumbnail and Input Fields */}
                <div className="mt-8 flex gap-6 justify-between items-center">

                    {/* Group Thumbnail */}
                    <div className="relative shadow-hover-black">
                        {/* Thumbnail or Placeholder */}
                        <Thumbnail size={186} src={state.thumbnailSrc ?? undefined} placeHolder={<FaUsers size={80} />} alt='Placeholder for group thumbnail selector' />

                        {/* File Input (Hidden) */}
                        <input
                            type="file"
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/png, image/jpeg, image/jpg, image/gif"
                            onChange={(e) => setters.setThumbnail(e)}
                        />

                        {/* Error Message */}
                        {state.thumbnailError && (
                            <div className="absolute bottom-0 left-0 right-0 bg-red-500/40 text-white text-sm text-center py-1">
                                {state.thumbnailError}
                            </div>
                        )}

                        {/* Clear thumbnail selection */}
                        {
                            state.thumbnailSrc && (
                                <div className="absolute w-7 h-7 flex justify-center items-center bottom-2 left-1/2 transform -translate-x-1/2 text-black/80 text-2xl bg-white/30 hover:bg-red-500/30 hover:text-white/50 rounded-xl transition-all">
                                    <button className="-mt-1.5" onClick={() => setters.setThumbnailSrc(null)}>
                                        &#215;
                                    </button>
                                </div>
                            )}
                    </div>

                    {/* Input Fields */}
                    <div className="w-full mt-4 flex flex-col gap-y-4 text-white font-nunito">
                        <div className="relative">
                            <input
                                value={state.name}
                                onChange={(e) => setters.setName(e.target.value)}
                                required
                                className="peer w-full bg-[#131313] border border-white/15 focus:border-white/30 rounded p-3 focus:outline-none resize-none"
                            />
                            <label className="absolute left-1 -top-4 text-sm mb-2 opacity-0 peer-focus:opacity-100 peer-hover:opacity-100 peer-placeholder-shown:opacity-0 transition-opacity">
                                Name
                            </label>
                        </div>
                        <div className="relative">
                            <textarea
                                value={state.description}
                                onChange={(e) => setters.setDescription(e.target.value)}
                                className="peer w-full bg-[#131313] border border-white/15 focus:border-white/30 rounded p-3 focus:outline-none resize-none"
                                rows={3}
                            />
                            <label className="absolute left-1 -top-4 text-sm font-medium mb-2 opacity-0 peer-focus:opacity-100 peer-hover:opacity-100 peer-placeholder-shown:opacity-0 transition-opacity">
                                Description
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit Button and Disclaimer */}
                <div className="mt-10">
                    <button
                        type="button"
                        disabled={normalize(state.name) === ''}
                        onClick={(e) => {
                            { isEditMode ? setters.updateGroup() : setters.createGroup()}
                            closeModal(e)
                        }} 
                        className={`w-full text-lg rounded-lg py-4 text-white font-nunito bg-white/15 border border-white/5 hover:border-white/30 shadow-[0_4px_0px_rgba(0,_0,_0,_0.5)] hover:shadow-none transition-all disabled:cursor-not-allowed disabled:bg-white/0`}
                    >
                        { isEditMode ? 'Update' : 'Create' }
                    </button>
                    <p className="mt-4 text-white/80 text-xs text-center">
                        By proceeding, you allow {APP_NAME} to access the uploaded image. Ensure you have the rights to it.
                    </p>
                </div>
            </div>
        </Backdrop>
    )
}