"use client";

import { useState } from "react";
import { TokenTestPanel } from "@/components/TokenTestPanel";
import { TokenCounter } from "@/components/TokenCounter";

export default function TestPage() {
  const [testMessages, setTestMessages] = useState([
    { role: "user", content: "Hello, this is a test message." },
    { role: "assistant", content: "Hi! I'm here to help you." },
    { role: "user", content: "Can you explain how token counting works?" },
  ]);
  const [rateLimitResults, setRateLimitResults] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testRateLimiting = async () => {
    setIsLoading(true);
    setRateLimitResults([]);

    const results = [];
    const API_URL = "/api/chat";

    // Make 15 requests rapidly (should hit the 10/minute limit)
    for (let i = 0; i < 15; i++) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: `Test message ${i + 1}` }],
            userId: "test-user",
            sessionId: "test-session", // Add sessionId for memory isolation
          }),
        });

        const data = await response.json().catch(() => ({}));

        results.push({
          request: i + 1,
          status: response.status,
          data: data,
          timestamp: new Date().toLocaleTimeString(),
        });

        // Small delay to see results in real-time
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          request: i + 1,
          status: "ERROR",
          data: { error: (error as Error).message },
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    }

    setRateLimitResults(results);
    setIsLoading(false);

    const rateLimited = results.filter((r) => r.status === 429).length;
    const successful = results.filter((r) => r.status === 200).length;
  };

  const fetchUsageData = async () => {
    try {
      const response = await fetch("/api/usage?period=day");
      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
      setUsageData({ error: "Failed to fetch usage data" });
    }
  };

  const addLongMessage = () => {
    const longText =
      "This is a very long message that will test token limits. ".repeat(500);
    setTestMessages((prev) => [...prev, { role: "user", content: longText }]);
  };

  const resetMessages = () => {
    setTestMessages([
      { role: "user", content: "Hello, this is a test message." },
      { role: "assistant", content: "Hi! I'm here to help you." },
      { role: "user", content: "Can you explain how token counting works?" },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 API Testing Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token Management Testing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Token Management Testing
            </h2>
            <TokenTestPanel />
          </div>

          {/* Real-time Token Counter */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Real-time Token Counter
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Test Messages:
              </label>
              <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                {testMessages.map((msg, i) => (
                  <div key={i} className="mb-2 p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600 font-medium">
                      {msg.role}:
                    </div>
                    <div className="text-sm">
                      {msg.content.substring(0, 80)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <TokenCounter
              messages={testMessages}
              model="gpt-4o"
              className="mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={addLongMessage}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Add Long Message
              </button>
              <button
                onClick={resetMessages}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Reset Messages
              </button>
            </div>
          </div>

          {/* Rate Limiting Testing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Rate Limiting Testing
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This will send 15 rapid requests to test the 10/minute rate limit.
            </p>

            <button
              onClick={testRateLimiting}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
            >
              {isLoading ? "Testing..." : "Test Rate Limiting"}
            </button>

            {rateLimitResults.length > 0 && (
              <div className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">Rate Limit Test Results:</h3>
                <div className="max-h-60 overflow-y-auto">
                  {rateLimitResults.map((result, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 mb-1 text-sm"
                    >
                      <span className="font-mono text-xs">
                        {result.timestamp}
                      </span>
                      <span className="font-mono">
                        #{result.request.toString().padStart(2, "0")}
                      </span>
                      <span
                        className={
                          result.status === 429
                            ? "text-red-600 font-semibold"
                            : result.status === 200
                            ? "text-green-600 font-semibold"
                            : "text-yellow-600 font-semibold"
                        }
                      >
                        {result.status === 429
                          ? "❌ RATE LIMITED"
                          : result.status === 200
                          ? "✅ SUCCESS"
                          : `⚠️ ${result.status}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Successful:</strong>{" "}
                      {rateLimitResults.filter((r) => r.status === 200).length}
                    </div>
                    <div>
                      <strong>Rate Limited:</strong>{" "}
                      {rateLimitResults.filter((r) => r.status === 429).length}
                    </div>
                    <div>
                      <strong>Working:</strong>{" "}
                      {rateLimitResults.filter((r) => r.status === 429).length >
                      0
                        ? "✅ YES"
                        : "❌ NO"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Usage Tracking */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Usage Tracking</h2>
            <p className="text-sm text-gray-600 mb-4">
              Check your current usage statistics and costs.
            </p>

            <button
              onClick={fetchUsageData}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 mb-4"
            >
              Fetch Usage Data
            </button>

            {usageData && (
              <div className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">Usage Summary:</h3>
                {usageData.error ? (
                  <div className="text-red-600">{usageData.error}</div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Period:</strong>{" "}
                      {usageData.summary?.period || "N/A"}
                    </div>
                    <div>
                      <strong>Total Tokens:</strong>{" "}
                      {usageData.summary?.totalTokens?.toLocaleString() || "0"}
                    </div>
                    <div>
                      <strong>Total Requests:</strong>{" "}
                      {usageData.summary?.totalRequests || "0"}
                    </div>
                    <div>
                      <strong>Total Cost:</strong> $
                      {usageData.summary?.totalCost?.toFixed(4) || "0.0000"}
                    </div>
                  </div>
                )}

                {usageData.usage && usageData.usage.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Daily Breakdown:</h4>
                    <div className="max-h-40 overflow-y-auto">
                      {usageData.usage.map((entry: any, i: number) => (
                        <div
                          key={i}
                          className="text-xs p-2 bg-white rounded border mb-1"
                        >
                          <div>
                            <strong>{entry.date}</strong>
                          </div>
                          <div>
                            Tokens: {entry.tokensUsed.toLocaleString()} |
                            Requests: {entry.requestsMade} | Cost: $
                            {entry.cost.toFixed(4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Server Logs Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Server Logs</h2>
          <p className="text-sm text-gray-600 mb-4">
            Check your server console for detailed debug logs when making
            requests.
          </p>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
            <div>// Expected logs in your server console:</div>
            <div>=== Token Management Debug ===</div>
            <div>Model: gpt-4o</div>
            <div>Original messages count: X</div>
            <div>
              Token check result:{" "}
              {JSON.stringify({
                withinLimits: true,
                tokenCount: 150,
                model: "gpt-4o",
              })}
            </div>
            <div>=== End Token Management Debug ===</div>
          </div>
        </div>
      </div>
    </div>
  );
}
