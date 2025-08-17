import React, { useMemo } from 'react';
import type { Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import { LinkIcon } from './icons/LinkIcon';

// This is a browser-only app, so we can safely access the 'marked' global
declare const marked: {
  parse: (markdown: string) => string;
};

interface ChatMessageProps {
  message: Message;
  agentIcon: React.FC;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, agentIcon: AgentIcon }) => {
  const isUser = message.role === 'user';

  const renderedHtml = useMemo(() => {
    if (isUser || !message.text) {
      return null;
    }
    // Basic sanitization by parsing with marked
    return { __html: marked.parse(message.text) };
  }, [message.text, isUser]);

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-slate-700/50 border border-teal-400/30 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(29,252,208,0.3)]">
          <AgentIcon />
        </div>
      )}
      <div
        className={`rounded-xl p-4 max-w-lg break-words prose prose-invert prose-sm ${
          isUser
            ? 'bg-sky-600/80 text-white rounded-br-none shadow-[0_0_10px_rgba(2,132,199,0.5)]'
            : 'bg-slate-700/50 text-slate-200 rounded-bl-none prose-p:text-slate-200 prose-li:text-slate-200'
        }`}
      >
        {isUser && message.image && (
          <div className="mb-2">
            <img src={message.image.data} alt="User upload" className="rounded-lg max-w-full h-auto max-h-60" />
          </div>
        )}
        {isUser ? (
          <p className="m-0">{message.text}</p>
        ) : (
          renderedHtml && <div dangerouslySetInnerHTML={renderedHtml} />
        )}
        
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-600/50">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 !mt-0">SOURCES</h4>
            <ul className="list-none p-0 m-0 space-y-2 text-xs">
              {message.sources.map((source, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 flex-shrink-0 pt-0.5 text-slate-500"><LinkIcon /></div>
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 break-all no-underline hover:underline">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-slate-700/50 border border-sky-400/30 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.4)]">
          <UserIcon />
        </div>
      )}
    </div>
  );
};