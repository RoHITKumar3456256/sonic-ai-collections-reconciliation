import React, { useState, useEffect } from 'react';
import {
  MessagesSquare,
  Send,
  PlusCircle,
  Clock,
  User,
  Building,
  CheckCircle,
  HelpCircle,
  Bot
} from 'lucide-react';
import { Conversation, Message, Customer } from '../types';
import { api } from '../services/api';

interface ConversationsProps {
  conversations: Conversation[];
  customers: Customer[];
  onRefresh: () => void;
}

const SIMULATION_PRESETS = [
  {
    label: "Dispute Billing (INV-1004)",
    sender: "billing@kestrelfoods.example.com",
    subject: "Dispute regarding INV-1004",
    body: "We have reviewed invoice INV-1004 and found an incorrect billing rate. We formally dispute this amount."
  },
  {
    label: "Payment Claim (Already Paid)",
    sender: "accounts@orbispackaging.example.com",
    subject: "Payment remitted for INV-1003",
    body: "Please note we have already paid INR 200,000 for invoice INV-1003 via RTGS. Here is the confirmation."
  },
  {
    label: "Payment Promise (Pay Next Week)",
    sender: "finance@quillontech.example.com",
    subject: "Expected clearance date for INV-1001",
    body: "We are scheduling our batch run and will clear invoice INV-1001 by next Friday."
  },
  {
    label: "Extension Request (Installment)",
    sender: "admin@mapleretail.example.com",
    subject: "Request for payment extension",
    body: "Due to temporary cash flow constraints, we request a 30-day extension or installment plan for INV-1010."
  },
  {
    label: "Legal Threat",
    sender: "dr.redwood@redwoodclinic.example.com",
    subject: "Legal notice regarding contract",
    body: "Do not contact us further regarding INV-1005. Our attorney is reviewing your service breach for court litigation."
  },
  {
    label: "Routine Query (Balance & Bank)",
    sender: "accounts@brightlinelogistics.example.com",
    subject: "Query on open balance and bank details",
    body: "Hi team, could you please send our current statement of open invoices and HDFC Bank payment details?"
  },
  {
    label: "Unknown Sender",
    sender: "stranger99@unknowncompany.com",
    subject: "Invoice status inquiry",
    body: "Hi, what is our outstanding balance and bank account number for remittance?"
  }
];

export const Conversations: React.FC<ConversationsProps> = ({
  conversations,
  customers,
  onRefresh
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(SIMULATION_PRESETS[0]);
  const [customReplyText, setCustomReplyText] = useState('');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId]);

  const loadMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.getConversationMessages(convId);
      setActiveMessages(res.messages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleTriggerSimulatedReply = async () => {
    try {
      setSimulating(true);
      await api.checkInbox({
        sender: selectedPreset.sender,
        subject: selectedPreset.subject,
        body: customReplyText || selectedPreset.body
      });
      setShowSimulateModal(false);
      setCustomReplyText('');
      onRefresh();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customer Communications</h1>
          <p className="text-sm text-slate-400 mt-1">
            Threaded email conversations, AI categorization, and human-in-the-loop review trails.
          </p>
        </div>

        <button
          onClick={() => {
            setCustomReplyText(selectedPreset.body);
            setShowSimulateModal(true);
          }}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition"
        >
          <Bot className="w-4 h-4" />
          <span>Simulate Customer Reply (Demo)</span>
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[650px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Left: Conversations Thread List */}
        <div className="border-r border-slate-800 flex flex-col h-full bg-slate-900/60">
          <div className="p-3.5 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            All Threads ({conversations.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left p-4 transition ${
                    isSelected ? 'bg-blue-600/15 border-l-2 border-blue-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate max-w-[170px]">
                      {conv.customer_name || 'Customer'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate">
                      {conv.status === 'needs_attention' ? (
                        <span className="text-amber-400 font-medium">Needs Attention</span>
                      ) : (
                        <span>Active Thread</span>
                      )}
                    </span>
                    {conv.last_category && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                        {conv.last_category}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No active email threads. Dispatch a reminder or simulate an incoming email.
              </div>
            )}
          </div>
        </div>

        {/* Right: Message Details */}
        <div className="md:col-span-2 flex flex-col h-full bg-slate-950/40">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">
                Thread History: {conversations.find(c => c.id === selectedConvId)?.customer_name || 'Selected Customer'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {activeMessages.length} Messages
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="text-center py-12 text-xs text-slate-500">Loading conversation history...</div>
            ) : (
              activeMessages.map((msg) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mb-1 px-1">
                      <span>{isOutbound ? 'AcmeCorp Receivables' : msg.sender}</span>
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                      {msg.is_human_reviewed && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          HUMAN APPROVED
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        isOutbound
                          ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none'
                          : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1.5 text-white/90 border-b border-white/10 pb-1">
                        {msg.subject}
                      </div>
                      <div className="whitespace-pre-line font-sans text-xs">
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {!loadingMessages && activeMessages.length === 0 && (
              <div className="text-center py-20 text-xs text-slate-500">
                No messages logged in this thread yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulated Customer Reply Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Simulate Customer Inbound Email</h3>
                <p className="text-xs text-slate-400">Test AI classification and review queue routing</p>
              </div>
              <button onClick={() => setShowSimulateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Select Test Scenario:</label>
                <select
                  value={selectedPreset.label}
                  onChange={(e) => {
                    const preset = SIMULATION_PRESETS.find(p => p.label === e.target.value) || SIMULATION_PRESETS[0];
                    setSelectedPreset(preset);
                    setCustomReplyText(preset.body);
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  {SIMULATION_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Sender Email:</label>
                <input
                  type="text"
                  value={selectedPreset.sender}
                  disabled
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Subject:</label>
                <input
                  type="text"
                  value={selectedPreset.subject}
                  disabled
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Message Body:</label>
                <textarea
                  rows={4}
                  value={customReplyText}
                  onChange={(e) => setCustomReplyText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 resize-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerSimulatedReply}
                disabled={simulating}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold flex items-center space-x-1.5 shadow transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{simulating ? 'Injecting & Processing...' : 'Simulate Inbound Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
