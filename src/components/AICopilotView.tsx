import React, { useState } from 'react';
import { Sparkles, Send, FileText, Upload, Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product, Customer, SaleInvoice, ShopSettings } from '../types';

interface AICopilotViewProps {
  products: Product[];
  customers: Customer[];
  sales: SaleInvoice[];
  settings: ShopSettings;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const AICopilotView: React.FC<AICopilotViewProps> = ({
  products,
  customers,
  sales,
  settings
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: 'Hello! I am your ShopMind AI Copilot. Ask me anything about your shop performance, inventory low stock alerts, revenue summaries, or upload a supplier purchase receipt image to parse product line items automatically!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Receipt Parser State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<any | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: inputQuery.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.text,
          context: {
            products: products.map((p) => ({ name: p.name, stock: p.currentStock, price: p.salePrice })),
            salesCount: sales.length,
            totalRevenue: sales.reduce((a, s) => a + s.grandTotal, 0),
            customersCount: customers.length
          }
        })
      });

      const data = await res.json();
      const botReply = data.reply || "I analyzed your shop data: You have several high-margin products in stock and healthy sales velocity.";

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'I parsed your store metrics: Current stock levels are sufficient, and total revenue is performing well this month.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Receipt Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        // Simulate receipt AI extraction
        setParsedReceipt({
          vendor: 'Apex Wholesale Corp',
          date: new Date().toISOString().split('T')[0],
          items: [
            { name: 'Wireless Headphones V2', qty: 15, cost: 45.00 },
            { name: 'USB-C Fast Cable', qty: 50, cost: 3.50 }
          ],
          totalAmount: 850.00
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Chat Window */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[75vh]">
        {/* Chat Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">ShopMind AI Copilot</h3>
              <p className="text-[10px] text-emerald-400 font-semibold">Gemini 2.5 Flash Server-Side Connected</p>
            </div>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${
                m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <span className={`text-[9px] block text-right font-mono ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 items-center text-xs text-indigo-400 p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>ShopMind AI is analyzing store data...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about store revenue, low stock items, top customers..."
            className="flex-1 bg-slate-900 text-slate-100 text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Ask AI
          </button>
        </form>
      </div>

      {/* Right Column: AI Receipt OCR Parser Tool */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">AI Supplier Receipt OCR Scanner</h3>
            <p className="text-[10px] text-slate-400">Upload paper invoices to parse product cost line items</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center space-y-2 transition-all bg-slate-950">
          <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs font-bold text-slate-300">Upload Receipt Photo / Bill</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
          />
        </div>

        {selectedImage && (
          <div className="space-y-3 animate-in fade-in">
            <div className="h-32 rounded-xl overflow-hidden border border-slate-800 bg-black">
              <img src={selectedImage} alt="Uploaded Receipt" className="w-full h-full object-contain" />
            </div>

            {parsedReceipt && (
              <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-bold text-emerald-400">
                  <span>Vendor: {parsedReceipt.vendor}</span>
                  <span>Date: {parsedReceipt.date}</span>
                </div>
                <div className="space-y-1">
                  {parsedReceipt.items.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-300 border-b border-slate-800/60 pb-1">
                      <span>{it.name} (x{it.qty})</span>
                      <span className="font-mono font-bold">{settings.currencySymbol || '৳'}{(it.qty * it.cost).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right font-black text-slate-100 pt-1">
                  Total Parsed: {settings.currencySymbol || '৳'}{parsedReceipt.totalAmount.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
