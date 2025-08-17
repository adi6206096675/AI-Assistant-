import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Chat, Part } from "@google/genai";
import { KnowledgeInput } from './components/KnowledgeInput';
import { ChatInterface } from './components/ChatInterface';
import { AgentSelector } from './components/AgentSelector';
import { StreakTracker } from './components/StreakTracker';
import { createChatSession, sendMessageStream } from './services/geminiService';
import { AGENTS, Agent } from './agents';
import type { Message, Source } from './types';

type ChatHistories = Record<string, Message[]>;
type ChatSessions = Record<string, Chat | null>;

// Helper function to convert a File object to a GoogleGenerativeAI.Part
async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}


const App: React.FC = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [isKnowledgeLoaded, setIsKnowledgeLoaded] = useState<boolean>(false);
  
  const [chatHistories, setChatHistories] = useState<ChatHistories>({});
  const [chatSessions, setChatSessions] = useState<ChatSessions>({});
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeAgentId, setActiveAgentId] = useState<string>(AGENTS[0].id);
  const [imageToSend, setImageToSend] = useState<{ file: File, preview: string } | null>(null);
  
  const [streak, setStreak] = useState<number>(0);

  const activeAgent = useMemo(() => AGENTS.find(agent => agent.id === activeAgentId)!, [activeAgentId]);
  const activeChatHistory = useMemo(() => chatHistories[activeAgentId] || [], [chatHistories, activeAgentId]);
  const activeChatSession = useMemo(() => chatSessions[activeAgentId] || null, [chatSessions, activeAgentId]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('lastVisitDate');
    const currentStreak = parseInt(localStorage.getItem('streakCount') || '0', 10);

    if (lastVisit === today) {
        setStreak(currentStreak);
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = 1;
    if (lastVisit === yesterday.toDateString()) {
      newStreak = currentStreak + 1;
    } 
    
    setStreak(newStreak);
    localStorage.setItem('streakCount', newStreak.toString());
    localStorage.setItem('lastVisitDate', today);
  }, []);

  const initializeChat = useCallback((agent: Agent, kb: string = '') => {
      const isDataAnalyst = agent.id === 'data-analyst';
      let systemInstruction = agent.systemInstruction;
      if (isDataAnalyst) {
        systemInstruction = systemInstruction.replace('{{KNOWLEDGE_BASE}}', kb);
      }
      
      const session = createChatSession(systemInstruction, agent.tools);
      setChatSessions(prev => ({ ...prev, [agent.id]: session }));

      let welcomeMessage = agent.welcomeMessage;
      if (agent.id === 'evo-companion' && streak > 1) {
        welcomeMessage = `Welcome back! It's great to see you again. We're on a ${streak}-day streak! What's on your mind?`;
      }

      setChatHistories(prev => ({ ...prev, [agent.id]: [{ role: 'model', text: welcomeMessage }] }));
  }, [streak]);

  // Initialize first agent on mount
  useEffect(() => {
    if (!chatHistories[activeAgentId]) {
      initializeChat(activeAgent);
    }
  }, [activeAgent, activeAgentId, chatHistories, initializeChat]);


  const handleAgentChange = (agentId: string) => {
    if (agentId === activeAgentId) return;
    setActiveAgentId(agentId);
    setImageToSend(null); // Clear any pending images
    
    // Reset knowledge state if switching away from data analyst
    if (activeAgent.id === 'data-analyst') {
      setIsKnowledgeLoaded(false);
      setKnowledgeBase('');
      setError(null);
    }

    // Initialize chat for the new agent if it doesn't exist
    if (!chatHistories[agentId]) {
      const newAgent = AGENTS.find(a => a.id === agentId)!;
      initializeChat(newAgent);
    }
  };


  const handleLoadKnowledge = useCallback(() => {
    if (knowledgeBase.trim().length > 0 && activeAgent.id === 'data-analyst') {
      setIsKnowledgeLoaded(true);
      initializeChat(activeAgent, knowledgeBase);
      setError(null);
    } else {
      setError('Please provide data for the knowledge base.');
    }
  }, [knowledgeBase, activeAgent, initializeChat]);
  
  const handleResetKnowledge = useCallback(() => {
      setIsKnowledgeLoaded(false);
      setKnowledgeBase('');
      setError(null);
      // Re-initialize the data-analyst agent to its default state
      initializeChat(activeAgent);
  }, [activeAgent, initializeChat]);

  const handleSendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading || !activeChatSession) return;

    setError(null);

    // 1. Prepare parts for the API call
    const messageParts: (string | Part)[] = [question];
    let imageForHistory: Message['image'] | undefined = undefined;

    if (imageToSend && activeAgent.capabilities?.includes('vision')) {
        const imagePart = await fileToGenerativePart(imageToSend.file);
        messageParts.push(imagePart);
        imageForHistory = { data: imageToSend.preview, mimeType: imageToSend.file.type };
    }

    // 2. Optimistically update UI
    const newUserMessage: Message = { role: 'user', text: question, image: imageForHistory };
    const newModelMessage: Message = { role: 'model', text: '' };
    
    setChatHistories(prev => ({
        ...prev,
        [activeAgentId]: [...(prev[activeAgentId] || []), newUserMessage, newModelMessage]
    }));
    setIsLoading(true);
    setImageToSend(null); // Clear image after it's been sent

    try {
      await sendMessageStream(
        activeChatSession,
        messageParts,
        (chunk) => { // onChunk handler
            setChatHistories(prev => {
                const currentHistory = prev[activeAgentId] ? [...prev[activeAgentId]] : [];
                const lastMessage = currentHistory[currentHistory.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.text += chunk;
                }
                return { ...prev, [activeAgentId]: currentHistory };
            });
        },
        (metadata) => { // onComplete handler for metadata
            if (metadata?.groundingChunks) {
                const sources: Source[] = metadata.groundingChunks
                    .map(chunk => chunk.web)
                    .filter((web): web is { uri: string; title: string; } => !!web?.uri)
                    .map(web => ({ uri: web.uri, title: web.title || web.uri }));
                
                if (sources.length > 0) {
                     setChatHistories(prev => {
                        const currentHistory = prev[activeAgentId] ? [...prev[activeAgentId]] : [];
                        const lastMessage = currentHistory[currentHistory.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            lastMessage.sources = sources;
                        }
                        return { ...prev, [activeAgentId]: currentHistory };
                    });
                }
            }
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
       setChatHistories(prev => {
            const currentHistory = prev[activeAgentId] ? [...prev[activeAgentId]] : [];
            const lastMessage = currentHistory[currentHistory.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
                lastMessage.text = 'My apologies, I encountered an error. Please try again.';
            }
            return { ...prev, [activeAgentId]: currentHistory };
        });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeChatSession, activeAgentId, imageToSend, activeAgent.capabilities]);

  const isChatReady = activeAgent.id !== 'data-analyst' || isKnowledgeLoaded;

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8 selection:bg-teal-400/30">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(20,111,120,0.4),_transparent_40%)] z-0"></div>
      <div className="relative z-10 w-full max-w-7xl">
        <header className="w-full mb-6 flex justify-between items-center">
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400 animate-glow">
              Nexus AI Agent Platform
            </h1>
            <p className="text-slate-400 mt-2">
            Select an agent and start your conversation.
            </p>
          </div>
          <StreakTracker count={streak} />
        </header>
        
        <div className="flex gap-6">
          <AgentSelector 
            agents={AGENTS}
            activeAgentId={activeAgentId}
            onAgentSelect={handleAgentChange}
          />
          <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeAgent.id === 'data-analyst' && (
                  <KnowledgeInput
                    knowledgeBase={knowledgeBase}
                    setKnowledgeBase={setKnowledgeBase}
                    onLoadKnowledge={handleLoadKnowledge}
                    onResetKnowledge={handleResetKnowledge}
                    isLoaded={isKnowledgeLoaded}
                    error={error}
                  />
              )}
              <div className={activeAgent.id === 'data-analyst' ? '' : 'lg:col-span-2'}>
                  <ChatInterface
                    agent={activeAgent}
                    messages={activeChatHistory}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    isReady={isChatReady}
                    imageToSend={imageToSend}
                    setImageToSend={setImageToSend}
                  />
              </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;