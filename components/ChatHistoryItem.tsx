import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import {
  MoreVertical,
  Trash2,
  Archive,
  Edit2,
  Share2,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/router";

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatHistoryItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const itemRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;

      // Check if the clicked element is part of our menu system
      const isMenuButton = target.closest("[data-menu-button]");
      const isMenuPortal = target.closest("[data-menu-portal]");
      const isMenuItem = target.closest("[data-menu-item]");
      const isInItem = itemRef.current && itemRef.current.contains(target);

      // If click is inside any part of our menu system, don't close
      if (isMenuButton || isMenuPortal || isMenuItem || isInItem) {
        return;
      }

      // Otherwise, close the menu
      setMenuOpen(false);
      setIsRenaming(false);
    }

    if (menuOpen || isRenaming) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, isRenaming]);

  useEffect(() => {
    if (menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8, // 8px below the button
        left: rect.right - 40, // 4px to the right of the button
      });
    }
  }, [menuOpen]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      // Create shareable link
      const shareUrl = `${window.location.origin}/chat/${conversation._id}`;

      if (navigator.share) {
        await navigator.share({
          title: conversation.title,
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsRenaming(true);
    setNewTitle(conversation.title);
  };

  const handleRenameSave = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setIsRenaming(false);
        // Trigger a page refresh to update the conversation list
        window.location.reload();
      } else {
        alert("Failed to rename conversation");
      }
    } catch (error) {
      console.error("Rename failed:", error);
      alert("Failed to rename conversation");
    }
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setNewTitle(conversation.title);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      // For now, just show a message. You can implement actual archiving later
      alert("Archive functionality coming soon!");
    } catch (error) {
      console.error("Archive failed:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm(`Are you sure you want to delete "${conversation.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversation._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Trigger a page refresh to update the conversation list
        window.location.href = "/";
      } else {
        alert("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete conversation");
    }
  };

  return (
    <div ref={itemRef} className="relative group flex items-center w-full">
      {isRenaming ? (
        <div className="flex-1 flex items-center px-3 py-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRenameSave();
              } else if (e.key === "Escape") {
                handleRenameCancel();
              }
            }}
            className="flex-1 bg-transparent text-white text-sm border-none outline-none focus:outline-none"
            autoFocus
          />
        </div>
      ) : (
        <Button
          variant="ghost"
          className={`flex-1 w-full justify-start text-left text-gray-100 hover:text-white hover:bg-gray-700 h-auto py-2 px-3 rounded-lg truncate text-[14px] font-normal flex items-center ${
            isActive ? "bg-gray-700 text-white" : ""
          }`}
          onClick={onClick}
        >
          <span className="truncate overflow-hidden whitespace-nowrap flex-1 max-w-[calc(100%-18px)]">
            {conversation.title}
          </span>
        </Button>
      )}

      {!isRenaming && (
        <button
          ref={btnRef}
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-600"
          aria-label="Show actions"
          onClick={() => setMenuOpen((v) => !v)}
          tabIndex={0}
          data-menu-button
        >
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      )}

      {menuOpen && menuPos && typeof window !== "undefined"
        ? createPortal(
            <div
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                zIndex: 9999,
                minWidth: 140,
              }}
              className="bg-[#232323] border border-[#2a2a2a] shadow-lg rounded-xl py-1 flex flex-col text-sm animate-fade-in"
              onClick={(e) => e.stopPropagation()}
              data-menu-portal
            >
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-white w-full text-left"
                data-menu-item
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={handleRename}
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-white w-full text-left"
                data-menu-item
              >
                <Edit2 className="w-4 h-4" /> Rename
              </button>
              <button
                onClick={handleArchive}
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-white w-full text-left"
                data-menu-item
              >
                <Archive className="w-4 h-4" /> Archive
              </button>
              <div className="border-t border-[#353740] my-1" />
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-red-400 w-full text-left"
                data-menu-item
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
