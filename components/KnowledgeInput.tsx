import React from 'react';

interface KnowledgeInputProps {
  knowledgeBase: string;
  setKnowledgeBase: (value: string) => void;
  onLoadKnowledge: () => void;
  onResetKnowledge: () => void;
  isLoaded: boolean;
  error: string | null;
}

export const KnowledgeInput: React.FC<KnowledgeInputProps> = ({
  knowledgeBase,
  setKnowledgeBase,
  onLoadKnowledge,
  onResetKnowledge,
  isLoaded,
  error,
}) => {
  return (
    <div className="bg-slate-800/30 rounded-lg p-6 flex flex-col border border-teal-400/20 shadow-lg backdrop-blur-md">
      <h2 className="text-2xl font-semibold mb-4 text-slate-200">1. Ingest Knowledge</h2>
      <p className="text-slate-400 mb-4">Provide the data corpus for the AI to learn from. Once loaded, this data will form its sole knowledge base for this session.</p>
      <div className="relative flex-grow flex flex-col">
        <textarea
          value={knowledgeBase}
          onChange={(e) => setKnowledgeBase(e.target.value)}
          placeholder="Paste your data here..."
          disabled={isLoaded}
          className="w-full flex-grow p-4 bg-slate-900/70 border border-slate-700 rounded-md resize-none focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Knowledge base input"
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      <div className="mt-4 flex space-x-4">
        {!isLoaded ? (
          <button
            onClick={onLoadKnowledge}
            className="w-full bg-teal-500 text-slate-900 font-bold py-3 px-4 rounded-md hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-400 transition-all duration-200 disabled:opacity-50"
            disabled={!knowledgeBase.trim()}
          >
            Load Knowledge
          </button>
        ) : (
          <button
            onClick={onResetKnowledge}
            className="w-full bg-rose-600 text-white font-bold py-3 px-4 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-rose-500 transition-colors duration-200"
          >
            Reset Knowledge
          </button>
        )}
      </div>
    </div>
  );
};