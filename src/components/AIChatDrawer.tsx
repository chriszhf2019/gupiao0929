import React, { useState, useRef, useEffect } from 'react';
import { StockData, ChatMessage } from '../types/stock';
import { aiService } from '../services/aiService';
import { Bot, Send, X, User, Sparkles } from 'lucide-react';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockData;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  stock,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          sender: 'ai',
          text: `你好！我是针对【${stock.name} (${stock.symbol})】的 AI 股票分析师。你可以向我询问任何关于该股票五步法（宏观行业、财务基本面、估值百分位、技术支撑压力、建仓分批策略）的问题。`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, stock.symbol]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // 携带最近 10 轮对话历史，让 AI 具备多轮上下文记忆
      const history = messages.slice(-10).map((m) => ({
        role: m.sender === 'ai' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      }));
      const aiReply = await aiService.sendChatMessage(userText, stock, history);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `结合 ${stock.name} 的财务与技术面：目前 PE 为 ${stock.valuation.peTTM} 倍（处历史 ${stock.valuation.historicalPePercentile}% 百分位），支撑位位于 ${stock.technical.supportLevel1} ${stock.currency}，建议参考分批建仓策略。`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-left text-slate-100">
      
      {/* Drawer Header */}
      <div className="p-4 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-blue-600 text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>AI 专属股票分析师</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400">正在咨询: {stock.name} ({stock.symbol})</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-800/40 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto text-[11px]">
        <button
          onClick={() => setInput(`分析下 ${stock.name} 的毛利率和竞争优势？`)}
          className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-300 shrink-0 cursor-pointer"
        >
          毛利率/护城河
        </button>
        <button
          onClick={() => setInput(`现在处于历史估值低位吗？估值怎么看？`)}
          className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-300 shrink-0 cursor-pointer"
        >
          估值安全度
        </button>
        <button
          onClick={() => setInput(`现在的支撑位和压力位分别是多少？应该怎么建仓？`)}
          className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-300 shrink-0 cursor-pointer"
        >
          买点与支撑位
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 ${isAi ? '' : 'flex-row-reverse space-x-reverse'}`}
            >
              <div className={`p-1.5 rounded-full shrink-0 ${isAi ? 'bg-blue-600/20 text-blue-400' : 'bg-indigo-600 text-white'}`}>
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                isAi
                  ? 'bg-slate-800/80 border border-slate-700/80 text-slate-100 rounded-tl-none'
                  : 'bg-blue-600 text-white rounded-tr-none'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-[9px] mt-1 text-right ${isAi ? 'text-slate-500' : 'text-blue-200'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Bot className="w-4 h-4 text-blue-400 animate-bounce" />
            <span>AI 分析师思考中...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          placeholder="问问 AI 关于该股票的分析..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
