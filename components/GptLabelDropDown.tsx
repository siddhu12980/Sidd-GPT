import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

export default function GptLabelDropDown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 text-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 bg-transparent"
          aria-haspopup="menu"
          aria-label="ChatGPT options"
        >
          ChatGPT
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-72 bg-[#232323] border border-[#2a2a2a] shadow-lg rounded-xl p-0 mt-2"
      >
        <DropdownMenuItem className="flex items-center gap-3 px-4 py-2 cursor-pointer data-[highlighted]:bg-[#d9d9d9]/20">
          <span className="inline-block w-5 h-5 bg-gradient-to-tr from-yellow-400 to-pink-500 rounded-full"></span>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-medium text-white">ChatGPT Plus</span>
            <span className="text-xs text-gray-400 mt-0.5">
              Our smartest model & more
            </span>
          </div>

          <button className="ml-4 px-3 py-1 bg-[#353740] hover:bg-[#40414f] text-white text-xs rounded-md font-medium focus:outline-none">
            Upgrade
          </button>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center gap-3 px-4 py-2 cursor-pointer data-[highlighted]:bg-[#d9d9d9]/20">
          <span className="inline-block w-5 h-5 bg-gradient-to-tr from-yellow-400 to-pink-500 rounded-full"></span>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-medium text-white">ChatGPT Plus</span>
            <span className="text-xs text-gray-400 mt-0.5">
              Our smartest model & more
            </span>
          </div>

          <Check className="w-4 h-4 text-white" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
