'use client';

import { useState } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';

interface AISearchProps {
  onSearch: (query: string) => void;
}

/**
 * AI-powered search component that helps users find relevant jobs using natural language
 */
export default function AISearch({ onSearch }: AISearchProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const handleAISearch = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('AI search request failed');
      }

      const data = await response.json();
      setAiResponse(data.response);

      // Extract key terms from AI response for search
      const searchTerms = extractSearchTerms(data.response);
      onSearch(searchTerms);
    } catch (error) {
      console.error('AI search failed:', error);
      setAiResponse(
        'Sorry, AI search is temporarily unavailable. Please try a regular search instead.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const extractSearchTerms = (response: string): string => {
    // Simple extraction - in a real app, you might want more sophisticated parsing
    const commonTerms = [
      'engineer',
      'developer',
      'manager',
      'researcher',
      'analyst',
      'specialist',
    ];
    const foundTerms = commonTerms.filter((term) =>
      response.toLowerCase().includes(term.toLowerCase())
    );

    if (foundTerms.length > 0) {
      return foundTerms.join(' ');
    }

    // Fallback to original prompt
    return prompt;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      handleAISearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            AI-Powered Job Search
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="ai-prompt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Describe the job you want
          </label>
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., I want a remote AI engineering role at a startup where I can work on machine learning models and have flexible hours..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Searching with AI...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Search className="h-5 w-5 mr-2" />
              Search with AI
            </div>
          )}
        </button>
      </form>

      {aiResponse && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">AI Suggestions:</h3>
          <p className="text-blue-800 text-sm">{aiResponse}</p>
        </div>
      )}
    </div>
  );
}
