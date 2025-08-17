import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { Agent } from '../agents';
import { ChatMessage } from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface ChatInterfaceProps {
  agent: Agent;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isReady: boolean;
  imageToSend: { file: File, preview: string } | null;
  setImageToSend: (image: { file: File, preview: string } | null) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent, messages, onSendMessage, isLoading, isReady, imageToSend, setImageToSend }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setImageToSend({ file, preview });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() !== '' || imageToSend) {
      onSendMessage(currentMessage);
      setCurrentMessage('');
      // Image is cleared in parent component after sending
    }
  };

  const placeholderText = isReady ? `Message ${agent.name}...` : "Load knowledge to begin session";
  const canUseVision = agent.capabilities?.includes('vision');

  return (
    <div className="bg-slate-800/30 rounded-lg p-6 flex flex-col border border-teal-400/20 shadow-lg backdrop-blur-md h-[75vh] lg:h-auto">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 flex-shrink-0 bg-slate-700/50 border border-teal-400/30 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(29,252,208,0.3)]">
          <agent.icon />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-200">{agent.name}</h2>
          <p className="text-sm text-slate-400">{agent.description}</p>
        </div>
      </div>
      <div className="flex-grow bg-slate-900/50 rounded-md p-4 overflow-y-auto mb-4 relative chat-container">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-md z-10">
            <p className="text-slate-400 text-center p-4">Please load a knowledge base to activate the chat interface.</p>
          </div>
        )}
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} agentIcon={agent.icon} />
          ))}
          {isLoading && messages[messages.length-1]?.role === 'model' && (
             <div className="flex justify-start items-center gap-3">
                <div className="w-8 h-8 flex-shrink-0 bg-slate-700/50 border border-teal-400/30 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(29,252,208,0.3)]">
                    <agent.icon />
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 max-w-lg rounded-bl-none">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse-orb" style={{animationDelay: '0s'}}></div>
                        <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse-orb" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse-orb" style={{animationDelay: '0.4s'}}></div>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {imageToSend && (
        <div className="mb-3 p-2 bg-slate-700/50 rounded-lg relative self-start">
            <img src={imageToSend.preview} alt="Image preview" className="h-20 w-20 object-cover rounded" />
            <button
                onClick={() => setImageToSend(null)}
                className="absolute -top-2 -right-2 bg-slate-800 text-slate-300 rounded-full p-0.5 hover:bg-rose-500 hover:text-white transition-colors"
                aria-label="Remove image"
            >
                <XCircleIcon />
            </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center space-x-3 relative">
         {canUseVision && (
            <>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                    aria-hidden="true"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isReady || isLoading || !!imageToSend}
                    className="flex-shrink-0 bg-slate-700/50 text-slate-300 rounded-full p-3 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-400 transition-all duration-200"
                    aria-label="Attach image"
                >
                    <PaperclipIcon />
                </button>
            </>
         )}
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder={placeholderText}
          disabled={!isReady || isLoading}
          className="flex-grow bg-slate-700/50 border border-slate-600 rounded-full py-3 px-5 focus:ring-2 focus:ring-teal-400 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Chat input"
        />
        <button
          type="submit"
          disabled={!isReady || isLoading || (!currentMessage.trim() && !imageToSend)}
          className="bg-teal-500 text-slate-900 rounded-full p-3 hover:bg-teal-400 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-400 transition-all duration-200 transform hover:scale-110 active:scale-100"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};