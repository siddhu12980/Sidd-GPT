"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PricingPage() {
  const [selectedTab, setSelectedTab] = useState("Personal")
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#212121] text-white">
      {/* Header */}
      <header className="border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-medium">ChatGPT</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-normal text-white mb-8">Upgrade your plan</h1>

          {/* Tab Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-[#404040] rounded-full p-1 flex">
              <Button
                variant={selectedTab === "Personal" ? "default" : "ghost"}
                className={`px-6 py-2 rounded-full text-sm ${
                  selectedTab === "Personal"
                    ? "bg-[#606060] text-white"
                    : "text-gray-400 hover:text-white hover:bg-transparent"
                }`}
                onClick={() => setSelectedTab("Personal")}
              >
                Personal
              </Button>
              <Button
                variant={selectedTab === "Business" ? "default" : "ghost"}
                className={`px-6 py-2 rounded-full text-sm ${
                  selectedTab === "Business"
                    ? "bg-[#606060] text-white"
                    : "text-gray-400 hover:text-white hover:bg-transparent"
                }`}
                onClick={() => setSelectedTab("Business")}
              >
                Business
              </Button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-[#3a3a3a] border border-gray-600 rounded-lg p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-medium mb-4">Free</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-light">$0</span>
                <span className="text-gray-400 ml-2">USD/month</span>
              </div>
              <p className="text-gray-300 mb-8">Explore how AI can help you with everyday tasks</p>
              <Button disabled className="w-full bg-gray-600 text-gray-400 hover:bg-gray-600 cursor-not-allowed py-3">
                Your current plan
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Access to GPT-4o mini and reasoning</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Standard voice mode</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Real-time data from the web with search</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Limited access to GPT-4o and o1-mini</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Limited access to file uploads, advanced data analysis, and image generation
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Use custom GPTs</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                Have an existing plan? <span className="underline cursor-pointer">See billing help</span>
              </p>
            </div>
          </div>

          {/* Plus Plan */}
          <div className="bg-[#3a3a3a] border-2 border-green-500 rounded-lg p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-black px-4 py-1 rounded-full text-sm font-medium">POPULAR</span>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-medium mb-4">Plus</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-light">$20</span>
                <span className="text-gray-400 ml-2">USD/month</span>
              </div>
              <p className="text-gray-300 mb-8">Level up productivity and creativity with expanded access</p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3">Get Plus</Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Everything in Free</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Extended limits on messaging, file uploads, advanced data analysis, and image generation
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Standard and advanced voice mode</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Access to deep research, multiple reasoning models (o1-mini, o1-mini-high, and o3), and a research
                  preview of GPT-4.5
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Create and use tasks, projects, and custom GPTs</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Limited access to Sora video generation</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Opportunities to test new features</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-xs text-gray-400">Limits apply</p>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#3a3a3a] border border-gray-600 rounded-lg p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-medium mb-4">Pro</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-light">$200</span>
                <span className="text-gray-400 ml-2">USD/month</span>
              </div>
              <p className="text-gray-300 mb-8">Get the best of OpenAI with the highest level of access</p>
              <Button className="w-full bg-white text-black hover:bg-gray-200 py-3">Get Pro</Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Everything in Plus</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Unlimited access to all reasoning models and GPT-4o</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Unlimited access to advanced voice mode</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Extended access to deep research, which conducts multi-step online research for complex tasks
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Access to research previews of GPT-4.5 and Operator</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  Access to o1 pro mode, which uses more compute for the best answers to the hardest questions
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Extended access to Sora video generation</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Access to a research preview of Codex agent</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                Unlimited subject to abuse guardrails. <span className="underline cursor-pointer">Learn more</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
