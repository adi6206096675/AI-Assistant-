import React from 'react';
import { Agent } from '../agents';

interface AgentSelectorProps {
    agents: Agent[];
    activeAgentId: string;
    onAgentSelect: (agentId: string) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ agents, activeAgentId, onAgentSelect }) => {
    return (
        <aside className="bg-slate-800/30 rounded-lg p-4 flex flex-col items-center gap-4 border border-teal-400/20 shadow-lg backdrop-blur-md self-start">
            {agents.map(agent => (
                <button
                    key={agent.id}
                    onClick={() => onAgentSelect(agent.id)}
                    aria-label={`Select agent: ${agent.name}`}
                    aria-pressed={activeAgentId === agent.id}
                    className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-teal-400
                        ${
                            activeAgentId === agent.id 
                                ? 'bg-teal-500/20 border border-teal-400/50 shadow-[0_0_15px_rgba(29,252,208,0.3)]' 
                                : 'bg-slate-700/50 hover:bg-slate-700'
                        }
                    `}
                >
                    <div className={activeAgentId === agent.id ? 'text-teal-300' : 'text-slate-300'}>
                        <agent.icon />
                    </div>
                    <span className={`text-xs font-semibold ${activeAgentId === agent.id ? 'text-slate-100' : 'text-slate-400'}`}>
                        {agent.name}
                    </span>
                </button>
            ))}
        </aside>
    );
};
