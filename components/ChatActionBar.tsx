"use client";
import { useState } from "react";
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  RefreshCw,
  Share2,
  Check,
} from "lucide-react";

export default function ChatActionBar({
  content,
  onRegenerate,
}: {
  content: string;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new window.SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="flex gap-4 mt-2 items-center text-gray-400 pt-2">
      <button onClick={handleCopy} title="Copy" className="hover:text-white">
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
      <button title="Like" className="hover:text-green-400">
        <ThumbsUp size={18} />
      </button>
      <button title="Dislike" className="hover:text-red-400">
        <ThumbsDown size={18} />
      </button>
      <button
        onClick={handleVoice}
        title="Read aloud"
        className="hover:text-blue-400"
      >
        <Volume2 size={18} />
      </button>
      <button
        onClick={onRegenerate}
        title="Regenerate"
        className="hover:text-yellow-400"
      >
        <RefreshCw size={18} />
      </button>
      <button title="Share" className="hover:text-purple-400">
        <Share2 size={18} />
      </button>
    </div>
  );
}
