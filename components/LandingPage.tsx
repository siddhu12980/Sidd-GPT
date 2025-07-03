"use client";
import CustomInputArea from "./Custom_input_area";
import {
  GraduationCap,
  FileText,
  Sparkles,
  Code2,
  PenLine,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
export default function LandingPage() {
  const router = useRouter();
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
              className="px-5 py-1.5 rounded-full border border-white/30 text-white bg-transparent hover:bg-white/10 text-sm font-medium"
            >
              Log in
            </button>
          </div>
          <div>
            <button
              onClick={() => {
                router.push("/sign-up");
              }}
              className="px-5 py-1.5 rounded-full bg-white text-black font-medium text-sm hover:bg-gray-200"
            >
              Sign up for free
            </button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-semibold mb-8">ChatGPT</h1>

        {/* <CustomInputArea onSubmit={() => {}} setIsInputActive={() => {}} /> */}

        {/* Suggestion Buttons */}
        <div className="flex flex-wrap gap-3 justify-around mt-4">
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
    </div>
  );
}
