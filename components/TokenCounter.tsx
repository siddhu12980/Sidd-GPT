import { useMemo, useState, useEffect } from 'react';

interface TokenCounterProps {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  className?: string;
}

export function TokenCounter({ messages, model = "gpt-4o", className = "" }: TokenCounterProps) {
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTokenCount = async () => {
      if (messages.length === 0) {
        setUsageSummary(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/token-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, model })
        });
        
        const result = await response.json();
        if (!result.error) {
          setUsageSummary(result.usageSummary);
        }
      } catch (error) {
        console.error('Token count error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchTokenCount, 300);
    return () => clearTimeout(timeoutId);
  }, [messages, model]);

  if (isLoading) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
          <span>Counting tokens...</span>
        </div>
      </div>
    );
  }

  if (!usageSummary) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        No messages to count
      </div>
    );
  }

  const getColorClass = () => {
    if (usageSummary.utilizationPercentage > 90) return 'text-red-500';
    if (usageSummary.utilizationPercentage > 75) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className={`text-xs ${getColorClass()} ${className}`}>
      <div className="flex items-center gap-2">
        <span>
          {usageSummary.inputTokens.toLocaleString()} / {usageSummary.maxTokens.toLocaleString()} tokens
        </span>
        <span>({usageSummary.utilizationPercentage.toFixed(1)}%)</span>
        <span>•</span>
        <span>~${usageSummary.estimatedCost.toFixed(4)}</span>
      </div>
    </div>
  );
} 