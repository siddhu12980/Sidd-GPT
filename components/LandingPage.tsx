"use client";
import CustomInputArea from "./CustomInputArea";
import {
  GraduationCap,
  FileText,
  Sparkles,
  Code2,
  PenLine,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isMobile = useIsMobile();

  const handleAttachClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#212121] text-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 w-full">
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium">ChatGPT</span>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <button
              onClick={() => {
                router.push("/sign-in");
              }}
              className="px-5 py-1.5 rounded-full bg-white text-black font-medium text-sm hover:bg-gray-200"
            >
              Log in
            </button>
          </div>

          {!isMobile && (
            <div>
              <button
                onClick={() => {
                  router.push("/sign-up");
                }}
                className="px-5 py-1.5 rounded-full border border-white/30 text-white bg-transparent hover:bg-white/10 text-sm font-medium"
              >
                Sign up for free
              </button>
            </div>
          )}
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
        <h1 className="text-3xl font-semibold mb-8">ChatGPT</h1>

        {/* Desktop: Centered, Mobile: Hidden */}
        <div className="hidden sm:block w-full max-w-2xl">
          <CustomInputArea
            input={""}
            setInput={() => {}}
            handleSendButtonClick={handleAttachClick} // Show login modal for any interaction
            isLoading={false}
            handleAttachClick={handleAttachClick}
            disabled={true} // Disable input for unauthenticated users
          />
        </div>

        {/* Mobile: Fixed bottom, Desktop: Hidden */}
        <div className="block sm:hidden fixed bottom-0 left-0 right-0 w-full bg-[#212121] z-50 px-2 pb-2">
          <div className="max-w-2xl mx-auto">
            <CustomInputArea
              input={""}
              setInput={() => {}}
              handleSendButtonClick={handleAttachClick} // Show login modal for any interaction
              isLoading={false}
              handleAttachClick={handleAttachClick}
              disabled={true} // Disable input for unauthenticated users
            />
          </div>
        </div>

        {/* Suggestion Buttons */}
        <div className="flex flex-wrap gap-2 justify-around mt-4 ">
          <button className="rounded-full border border-white/20 px-4 py-2 text-white text-sm bg-transparent hover:bg-white/10 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-inherit" />
            Get advice
          </button>
          <button className="rounded-full border border-orange-400/40 px-4 py-2 text-orange-300 text-sm bg-transparent hover:bg-orange-400/10 flex items-center gap-2">
            <FileText className="w-4 h-4 text-inherit" />
            Summarize text
          </button>
          <button className="rounded-full border border-blue-400/40 px-4 py-2 text-blue-300 text-sm bg-transparent hover:bg-blue-400/10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-inherit" />
            Surprise me
          </button>
          <button className="rounded-full border border-blue-400/40 px-4 py-2 text-blue-300 text-sm bg-transparent hover:bg-blue-400/10 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-inherit" />
            Code
          </button>
          <button className="rounded-full border border-purple-400/40 px-4 py-2 text-purple-300 text-sm bg-transparent hover:bg-purple-400/10 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-inherit" />
            Help me write
          </button>
          <button className="rounded-full border border-white/20 px-4 py-2 text-white text-sm bg-transparent hover:bg-white/10 flex items-center gap-2">
            <MoreHorizontal className="w-4 h-4 text-inherit" />
            More
          </button>
        </div>
      </main>
      {/* Login Required Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent
          className={`p-0 overflow-hidden ${
            isMobile
              ? "fixed bottom-0 left-0 right-0 mx-auto rounded-t-2xl rounded-b-none w-full max-w-xs min-h-[0]"
              : "max-w-xs"
          }`}
          style={
            isMobile
              ? { margin: 0, borderRadius: "1.5rem 1.5rem 0 0", minHeight: 0 }
              : {}
          }
        >
          <div className="bg-gradient-to-tr from-indigo-200 to-pink-100 h-20 w-full" />
          <div className={`p-3 ${isMobile ? "pb-4" : "p-4"}`}>
            <h2
              className={`font-semibold ${
                isMobile ? "text-base mb-1" : "text-lg mb-2"
              }`}
            >
              Try advanced features for free
            </h2>
            <p
              className={`text-gray-500 ${
                isMobile ? "text-xs mb-3" : "text-sm mb-4"
              }`}
            >
              Get smarter responses, upload files, create images, and more by
              logging in.
            </p>
            <div className="flex gap-2">
              <Button
                className="w-full text-sm py-2"
                onClick={() => router.push("/sign-in")}
              >
                Log in
              </Button>
              {!isMobile && (
                <Button
                  variant="outline"
                  className="w-full text-sm py-2"
                  onClick={() => router.push("/sign-up")}
                >
                  Sign up for free
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
