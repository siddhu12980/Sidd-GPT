import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Plus,
  FileImage,
  Puzzle,
  Settings,
  Mic,
  ImageIcon,
  Globe,
  Code,
  SearchIcon,
  Lightbulb,
  ChevronRight,
  Send,
  Square,
} from "lucide-react";

export default function CustomInputArea({
  input,
  setInput,
  append,
  isLoading,
  stop,
  status,
}: {
  input: string;
  setInput: (input: string) => void;
  append: (message: { content: string; role: "user" }) => void;
  isLoading: boolean;
  stop?: () => void;
  status?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        append({ content: input.trim(), role: "user" });
        setInput("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      append({ content: input.trim(), role: "user" });
      setInput("");
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="">
        {/* Main Input Field */}
        <form onSubmit={handleSubmit}>
          <div className="bg-[#2f2f2f]  rounded-3xl px-4 py-3 mb-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              className="input-box w-full placeholder:text-lg  bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0 mb-3"
              disabled={isLoading}
            />

            {/* Controls Below Input */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-gray-200 hover:text-white hover:bg-gray-600 rounded-full"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    className="w-56 bg-[#2f2f2f] border-gray-600 text-white"
                  >
                    <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer">
                      <FileImage className="w-5 h-5" />
                      <span className="text-base">Add photos and files</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer">
                      <Puzzle className="w-5 h-5" />
                      <span className="text-base">Add from apps</span>
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-gray-200 hover:text-white hover:bg-gray-600 gap-2 h-7 px-2 rounded-full"
                    >
                      <Settings className="w-5 h-5" />
                      <span className="text-sm">Tools</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    className="w-56 bg-[#2f2f2f] border-gray-600 text-white"
                  >
                    <div className="px-2 py-1.5 text-sm font-medium text-gray-300 border-b border-gray-600">
                      Tools
                    </div>
                    <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer">
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-base">Create an image</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer">
                      <Globe className="w-5 h-5" />
                      <span className="text-base">Search the web</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer">
                      <Code className="w-5 h-5" />
                      <span className="text-base">Write or code</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer">
                      <SearchIcon className="w-5 h-5" />
                      <span className="text-base">Run deep research</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer">
                      <Lightbulb className="w-5 h-5" />
                      <span className="text-base">Think for longer</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-200 hover:text-white hover:bg-gray-600 rounded-full"
                >
                  <Mic className="w-5 h-5" />
                </Button>

                {isLoading ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-red-400 hover:text-white hover:bg-gray-600 rounded-full"
                    onClick={stop}
                  >
                    <Square className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-gray-200 hover:text-white hover:bg-gray-600 rounded-full"
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
