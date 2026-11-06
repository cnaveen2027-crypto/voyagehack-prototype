import React, { useState, useRef, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TravelAPI } from '../services/api';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Compass,
  ArrowRight,
  Loader2,
  Calendar,
  Wallet,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  actionSuggestions?: string[];
  timestamp: string;
}

interface AIAgentChatProps {
  onNavigateTab?: (tab: string) => void;
}

export const AIAgentChat: React.FC<AIAgentChatProps> = ({ onNavigateTab }) => {
  const { activeTrip, updateActiveTrip, setItinerary, setBudgetPlan } = useTrip();
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: `Greetings ${currentUser.name}! I am VoyageMind AI, your personal multi-agent travel concierge. I'm currently tracking your voyage to **${activeTrip.destination || 'your destination'}** (${activeTrip.durationDays} days from ${activeTrip.origin || 'your hometown'}). What would you like to explore, modify, or optimize?`,
      actionSuggestions: [
        'Recommend alternative destinations',
        'Compare flights & rail options',
        'Optimize my budget breakdown',
        'What should I pack for this trip?'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Format history
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: m.text,
      }));

      const res = await TravelAPI.chatAgent({
        message: query,
        history,
        currentTrip: activeTrip,
      });

      const agentMsg: ChatMessage = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: res.reply,
        actionSuggestions: res.actionSuggestions || ['View Itinerary', 'Compare Stays', 'Adjust Budget'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Detect if user asked to change destination or budget
      const destMatch = query.match(/(?:change destination to|go to|fly to|visit)\s+([A-Za-z\s,]+)/i);
      if (destMatch && destMatch[1].length < 35) {
        updateActiveTrip({ destination: destMatch[1].trim() });
      }

      const budgetMatch = query.match(/(?:budget is|increase budget to|reduce budget to|budget of)\s*(\$|€|£|₹)?\s*(\d+)/i);
      if (budgetMatch) {
        const newBudget = parseInt(budgetMatch[2]);
        if (newBudget > 0) {
          updateActiveTrip({ budget: newBudget });
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'agent',
          text: 'I encountered an error connecting with the travel service. However, your trip context is safely stored. What specific detail would you like to review next?',
          actionSuggestions: ['Check Itinerary', 'Explore Stays'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action.includes('itinerary') || action.includes('Itinerary')) {
      if (onNavigateTab) onNavigateTab('itinerary');
      return;
    }
    if (action.includes('destination') || action.includes('Destination')) {
      if (onNavigateTab) onNavigateTab('destinations');
      return;
    }
    if (action.includes('flight') || action.includes('rail') || action.includes('transport') || action.includes('Transport')) {
      if (onNavigateTab) onNavigateTab('transport');
      return;
    }
    if (action.includes('stay') || action.includes('hotel') || action.includes('Stay')) {
      if (onNavigateTab) onNavigateTab('stays');
      return;
    }
    if (action.includes('budget') || action.includes('Budget')) {
      if (onNavigateTab) onNavigateTab('budget');
      return;
    }
    handleSend(action);
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100vh-100px)] min-h-[550px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl my-4">
      {/* Chat Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">VoyageMind AI Concierge</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] font-semibold text-emerald-400">
                ACTIVE CONTEXT
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{activeTrip.origin}</span>
              <span>→</span>
              <span className="text-blue-400 font-semibold">{activeTrip.destination}</span>
              <span>•</span>
              <span>{activeTrip.currency} {activeTrip.budget.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: `reset_${Date.now()}`,
                sender: 'agent',
                text: `Reset trip conversation. Active destination is **${activeTrip.destination}**. How can I help you plan?`,
                actionSuggestions: ['Generate Itinerary', 'Search Flights', 'Optimize Budget'],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          title="Reset conversation"
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>

                {/* Agent Action Suggestions */}
                {!isUser && msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {msg.actionSuggestions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(action)}
                        className="px-2.5 py-1 bg-slate-800/80 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500 text-blue-300 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{action}</span>
                        <ArrowRight className="w-3 h-3 text-blue-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 rounded-tl-none flex items-center gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>VoyageMind AI is analyzing parameters and consulting live knowledge...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything about ${activeTrip.destination || 'your trip'}, modify itinerary, or check budgets...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
