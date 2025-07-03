import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { MoreVertical, Trash2, Archive, Edit2, Share2, MoreHorizontal } from "lucide-react";

export default function ChatHistoryItem({ title }: { title: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const itemRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8, // 8px below the button
        left: rect.right - 40, // 4px to the right of the button
      });
    }
  }, [menuOpen]);

  return (
    <div
      ref={itemRef}
      className="relative group flex items-center w-full"
    >
      <Button
        variant="ghost"
        className="flex-1 w-full justify-start text-left text-gray-100 hover:text-white hover:bg-gray-700 h-auto py-2 px-3 rounded-lg truncate text-[14px] font-normal flex items-center"
      >
        <span className="truncate overflow-hidden whitespace-nowrap flex-1 max-w-[calc(100%-18px)]">{title}</span>
      </Button>
      <button
        ref={btnRef}
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-600"
        aria-label="Show actions"
        onClick={() => setMenuOpen((v) => !v)}
        tabIndex={0}
      >
        <MoreHorizontal className="w-4 h-4 text-gray-400" />
      </button>
      {menuOpen && menuPos && typeof window !== "undefined"
        ? createPortal(
            <div
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                zIndex: 1000,
                minWidth: 140,
              }}
              className="bg-[#232323] border border-[#2a2a2a] shadow-lg rounded-xl py-1 flex flex-col text-sm animate-fade-in"
            >
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-white">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-white">
                <Edit2 className="w-4 h-4" /> Rename
              </button>
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-white">
                <Archive className="w-4 h-4" /> Archive
              </button>
              <div className="border-t border-[#353740] my-1" />
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-red-400">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
