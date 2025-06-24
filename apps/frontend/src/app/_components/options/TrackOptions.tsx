import { useRef, useState } from "react";
import { FaEllipsisH, FaEllipsisV, FaTrash } from "react-icons/fa";
import OptionsList, { Option } from "./OptionsList";
import { useMediaQuery } from 'react-responsive';
import { useClickOutside } from "../../_utils/domUtils";

interface TrackOptionsProps {
  buttonSize: number;
  removeTrack?: () => void;
}

export const TrackOptions = ({ buttonSize, removeTrack }: TrackOptionsProps) => {
  const [openList, setOpenList] = useState(false);
  const trackOptionsRef = useRef<HTMLDivElement | null>(null);
  
  const isSmallScreen = useMediaQuery({ minWidth: 500 });
  
  const toggleOpenList = () => setOpenList((prev) => !prev);
  useClickOutside(trackOptionsRef, () => setOpenList(false));

  const DeleteTrack: Option = {
    label: "Delete Track",
    icon: <FaTrash className="text-red-500 cursor-pointer" size={16} />,
    action: () => removeTrack && removeTrack(),
  };

  const options: Option[] = [DeleteTrack];

  return (
    <div
      ref={trackOptionsRef}
      className={`flex flex-col items-center px-1
        ${openList ? "bg-white/10 rounded-xl" : "bg-transparent"}`}
    >
      {
        openList ?
          (
            <FaEllipsisH
              size={buttonSize}
              className="text-white/80 cursor-pointer"
              onClick={toggleOpenList}
            />
          )
          :
          (
            isSmallScreen ?
              <FaEllipsisV
                size={buttonSize}
                className="text-white/80 cursor-pointer"
                onClick={toggleOpenList}
              />
              :
              <FaEllipsisH
                size={buttonSize}
                className="text-white/80 cursor-pointer"
                onClick={toggleOpenList}
              />
          )
      }
      {openList && <OptionsList options={options} hideLabels={true} />}
    </div>
  );
};
