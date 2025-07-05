import { useRef, useState } from "react";
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
  FileText,
  X,
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
import { useUser } from "@clerk/nextjs";

export default function CustomInputArea({
  input,
  setInput,
  handleSendButtonClick,
  isLoading,
  stop,
  status,
  handleAttachClick,
}: {
  input: string;
  setInput: (input: string) => void;
  handleSendButtonClick: (message: {
    content: string;
    role: "user";
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }) => void;
  isLoading: boolean;
  stop?: () => void;
  status?: string;
  handleAttachClick?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const { user } = useUser();
  const [showAuthPopover, setShowAuthPopover] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || pendingFile) {
        sendMessage();
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() || pendingFile) {
      sendMessage();
    }
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      let uploadApi = "/api/upload-file";
      // Accept images and files (pdf, docx, etc)
      if (!file.type.startsWith("image/")) {
        uploadApi = "/api/upload-file";
      }
      const res = await fetch(uploadApi, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPendingFile({
          url: data.result.secure_url,
          name: file.name,
          type: file.type,
        });
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePendingFile() {
    setPendingFile(null);
  }

  function sendMessage() {
    if (!pendingFile && !input.trim()) return;
    if (pendingFile) {
      // If image
      if (pendingFile.type.startsWith("image/")) {
        handleSendButtonClick({
          content: input.trim() || "What is in this image?",
          role: "user",
          type: "image",
          fileUrl: pendingFile.url,
          fileName: pendingFile.name,
          fileType: pendingFile.type,
        });
      } else {
        // If file (pdf, docx, etc)
        handleSendButtonClick({
          content: input.trim() || `Analyze this file: ${pendingFile.name}`,
          role: "user",
          type: "file",
          fileUrl: pendingFile.url,
          fileName: pendingFile.name,
          fileType: pendingFile.type,
        });
      }
      setPendingFile(null);
      setInput("");
    } else if (input.trim()) {
      handleSendButtonClick({
        content: input.trim(),
        role: "user",
        type: "text",
      });
      setInput("");
    }
  }

  return (
    <div className="w-full max-w-3xl">
      {/* Hidden file input for image/file upload */}
      <input
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div className="">
        {/* File/Image Preview */}
        {pendingFile && (
          <div className="flex items-center gap-3 mb-2 bg-[#232323] rounded-xl p-2 relative w-fit">
            {pendingFile.type.startsWith("image/") ? (
              <img
                src={pendingFile.url}
                alt="preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-blue-400" />
                <span className="text-sm text-white max-w-[120px] truncate">
                  {pendingFile.name}
                </span>
              </div>
            )}
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-black rounded-full p-1 hover:bg-gray-700"
              onClick={removePendingFile}
              aria-label="Remove file"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        {/* Main Input Field */}
        <form onSubmit={handleFormSubmit}>
          <div className="bg-[#2f2f2f] rounded-3xl px-4 py-3 mb-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                pendingFile ? "Ask anything about this..." : "Ask anything"
              }
              className="input-box w-full placeholder:text-lg bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0 mb-3"
              disabled={isLoading || uploading}
            />
            {/* Controls Below Input */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DropdownMenu
                  open={showAuthPopover}
                  onOpenChange={setShowAuthPopover}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-gray-200 hover:text-white hover:bg-gray-600 rounded-full"
                      onClick={() => {
                        if (!user) {
                          setShowAuthPopover(true);
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    className="w-80 bg-[#232323] border-gray-600 text-white p-0"
                    onInteractOutside={() => setShowAuthPopover(false)}
                  >
                    {!user ? (
                      <div className="p-4">
                        <div className="bg-gradient-to-tr from-indigo-200 to-pink-100 h-20 w-full rounded-t" />
                        <div className="p-2">
                          <h2 className="font-semibold text-lg mb-2">
                            Try advanced features for free
                          </h2>
                          <p className="text-sm text-gray-400 mb-4">
                            Get smarter responses, upload files, create images,
                            and more by logging in.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              className="w-full"
                              onClick={() =>
                                (window.location.href = "/sign-in")
                              }
                            >
                              Log in
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() =>
                                (window.location.href = "/sign-up")
                              }
                            >
                              Sign up for free
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <DropdownMenuItem
                          className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer"
                          onClick={() => {
                            if (handleAttachClick) {
                              handleAttachClick();
                            } else {
                              fileInputRef.current?.click();
                            }
                          }}
                        >
                          <FileImage className="w-5 h-5" />
                          <span className="text-base">
                            Add photos and files
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-600 cursor-pointer">
                          <Puzzle className="w-5 h-5" />
                          <span className="text-base">Add from apps</span>
                          <ChevronRight className="w-5 h-5 ml-auto" />
                        </DropdownMenuItem>
                      </>
                    )}
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
                  disabled={uploading}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                {isLoading || uploading ? (
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
                    disabled={
                      (!input.trim() && !pendingFile) || isLoading || uploading
                    }
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            {uploading && (
              <div className="text-xs text-gray-400 mt-2">
                Uploading file...
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
