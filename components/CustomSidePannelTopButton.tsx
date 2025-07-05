import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CustomSidePannelTopButton({
  buttonText,
  icon,
  onClick,
  iconSize = "w-6 h-6",
}: {
  buttonText?: string;
  icon: React.ReactNode;
  onClick: () => void;
  iconSize?: string;
}) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <Button
      className="w-full bg-transparent cursor-pointer hover:bg-gray-700/50 text-white border-none justify-start h-9 px-3 rounded-lg"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex w-full flex-row items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <div className={`${iconSize} flex items-center justify-center`}>
            {icon}
          </div>
          {buttonText && <span className="text-sm">{buttonText}</span>}
        </span> 
        {hovered && (
          <span className="text-sm text-gray-400">Ctrl + Shift + O</span>
        )}
      </div>
    </Button>
  );
}
