import { useState } from 'react';

export function TokenTestPanel() {
  const [messages, setMessages] = useState([
    { role: 'user', content: 'Hello, this is a test message.' },
    { role: 'assistant', content: 'Hi! I\'m here to help you.' },
    { role: 'user', content: 'Can you explain how token counting works?' }
  ]);
  const [model, setModel] = useState('gpt-4o');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testTokenManagement = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/token-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model })
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Token test error:', error);
      setTestResult({ error: 'Failed to test token management' });
    } finally {
      setIsLoading(false);
    }
  };

  const addLongMessage = () => {
    const longText = 'This is a very long message. '.repeat(1000);
    setMessages(prev => [...prev, { role: 'user', content: longText }]);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🧪 Token Management Test Panel</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Model:</label>
        <select 
          value={model} 
          onChange={(e) => setModel(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Messages ({messages.length}):</label>
        <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white">
          {messages.map((msg, i) => (
            <div key={i} className="mb-2 p-2 bg-gray-100 rounded">
              <div className="text-xs text-gray-600">{msg.role}:</div>
              <div className="text-sm">{msg.content.substring(0, 100)}...</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={testTokenManagement}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Token Management'}
        </button>
        <button 
          onClick={addLongMessage}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Long Message
        </button>
        <button 
          onClick={() => setMessages([{ role: 'user', content: 'Reset' }])}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Reset
        </button>
      </div>

      {testResult && (
        <div className="border rounded p-4 bg-white">
          <h4 className="font-semibold mb-2">Test Results:</h4>
          
          {testResult.error ? (
            <div className="text-red-600">{testResult.error}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Token Check:</strong>
                  <div>Within Limits: {testResult.tokenCheck.withinLimits ? '✅' : '❌'}</div>
                  <div>Input Tokens: {testResult.tokenCheck.inputTokens.toLocaleString()}</div>
                  <div>Max Input: {testResult.tokenCheck.maxInputTokens.toLocaleString()}</div>
                  <div>Total Estimated: {testResult.tokenCheck.totalEstimated.toLocaleString()}</div>
                </div>
                
                <div>
                  <strong>Usage Summary:</strong>
                  <div>Model: {testResult.usageSummary.model}</div>
                  <div>Utilization: {testResult.usageSummary.utilizationPercentage.toFixed(1)}%</div>
                  <div>Estimated Cost: ${testResult.usageSummary.estimatedCost.toFixed(4)}</div>
                </div>
              </div>

              <div className="mt-4">
                <strong>Message Count:</strong>
                <div>Original: {testResult.originalCount}</div>
                <div>After Trimming: {testResult.trimmedCount}</div>
                {testResult.trimmedMessages && (
                  <div className="mt-2 p-2 bg-yellow-50 border rounded">
                    <strong>⚠️ Messages were trimmed!</strong>
                    <div className="text-xs mt-1">
                      {testResult.trimmedMessages.map((msg: any, i: number) => (
                        <div key={i}>{msg.role}: {msg.content.substring(0, 50)}...</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 