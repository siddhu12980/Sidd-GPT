import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GptLabelDropDown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-lg font-medium hover:bg-transparent focus:ring-0 focus:ring-offset-0 bg-transparent"
          aria-label="ChatGPT options"
        >
          ChatGPT
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
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

          <Button
            variant="secondary"
            size="sm"
            className="ml-4 bg-[#353740] hover:bg-[#40414f] text-white text-xs"
          >
            Upgrade
          </Button>
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
