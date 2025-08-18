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
  disabled,
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
    // NEW: Multiple attachments support
    attachmentUrls?: string[];
    attachmentTypes?: string[];
    attachmentNames?: string[];
  }) => void;
  isLoading: boolean;
  stop?: () => void;
  status?: string;
  handleAttachClick?: () => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // NEW: Support for multiple pending files
  const [pendingFiles, setPendingFiles] = useState<
    {
      url: string;
      name: string;
      type: string;
    }[]
  >([]);

  // LEGACY: Keep single file support for backward compatibility
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
      if (input.trim() || pendingFile || pendingFiles.length > 0) {
        sendMessage();
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() || pendingFile || pendingFiles.length > 0) {
      sendMessage();
    }
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // Support multiple files
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload-file", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          return {
            url: data.result.secure_url,
            name: file.name,
            type: file.type,
          };
        } else {
          throw new Error(data.error || "Upload failed");
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // If only one file, use legacy single file state for backward compatibility
      if (uploadedFiles.length === 1) {
        setPendingFile(uploadedFiles[0]);
      } else {
        // Multiple files - use new multiple files state
        setPendingFiles(uploadedFiles);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePendingFile() {
    setPendingFile(null);
  }

  // NEW: Function to remove a specific file from multiple files
  function removePendingFileAt(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // NEW: Function to clear all pending files
  function clearAllPendingFiles() {
    setPendingFiles([]);
    setPendingFile(null);
  }

  function sendMessage() {
    if (!pendingFile && !input.trim() && pendingFiles.length === 0) return;

    // NEW: Handle multiple attachments
    if (pendingFiles.length > 0) {
      console.log("🎯 Sending multiple attachments:", pendingFiles.length);

      handleSendButtonClick({
        content: input.trim() || `Analyze these ${pendingFiles.length} files`,
        role: "user",
        type: "mixed",
        attachmentUrls: pendingFiles.map((f) => f.url),
        attachmentTypes: pendingFiles.map((f) =>
          f.type.startsWith("image/") ? "image" : "pdf"
        ),
        attachmentNames: pendingFiles.map((f) => f.name),
      });

      clearAllPendingFiles();
      setInput("");
    }
    // LEGACY: Handle single file
    else if (pendingFile) {
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
    }
    // Text only
    else if (input.trim()) {
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
        multiple
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div className="">
        {/* NEW: Multiple Files Preview */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-[#232323] rounded-xl p-2 relative"
              >
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.url}
                    alt="preview"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-400" />
                    <span className="text-sm text-white max-w-[80px] truncate">
                      {file.name}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute -top-1 -right-1 bg-black rounded-full p-1 hover:bg-gray-700"
                  onClick={() => removePendingFileAt(index)}
                  aria-label="Remove file"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
         
          </div>
        )}

        {/* LEGACY: Single File Preview */}
        {pendingFile && pendingFiles.length === 0 && (
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
                disabled
                  ? "Sign in to chat with ChatGPT"
                  : pendingFiles.length > 0
                  ? `Ask about these ${pendingFiles.length} files...`
                  : pendingFile
                  ? "Ask anything about this..."
                  : "Ask anything"
              }
              className="input-box w-full placeholder:text-lg bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0 mb-3"
              disabled={disabled || isLoading || uploading}
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
                      disabled={disabled}
                      onClick={() => {
                        if (disabled || !user) {
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
                      disabled ||
                      (!input.trim() &&
                        !pendingFile &&
                        pendingFiles.length === 0) ||
                      isLoading ||
                      uploading
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
