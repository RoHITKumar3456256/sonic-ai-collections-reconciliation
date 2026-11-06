import React, { useState, useEffect } from 'react';
import {
  Search,
  Bot,
  Send,
  Sparkles,
  Paperclip,
  Plus,
  Phone,
  MoreVertical,
  CheckCircle2,
  Clock,
  User,
  Building,
  Mail,
  ShieldAlert,
  ChevronDown,
  Layers,
  ArrowRight
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
  const [filterTab, setFilterTab] = useState<'open' | 'followup' | 'done'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyInput, setReplyInput] = useState('');

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

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const selectedCustomer = customers.find(c => c.id === selectedConv?.customer_id);

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      await api.checkInbox({
        sender: selectedPreset.sender,
        subject: selectedPreset.subject,
        body: customReplyText || selectedPreset.body
      });
      setShowSimulateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    (c.customer_name && c.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.last_category && c.last_category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Conversations & Inbound Inbox</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-channel email communications, automated LLM categorization, and customer profiles.
          </p>
        </div>

        <button
          onClick={() => {
            setCustomReplyText(selectedPreset.body);
            setShowSimulateModal(true);
          }}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center space-x-1.5"
        >
          <Bot className="w-4 h-4" />
          <span>Simulate Customer Reply</span>
        </button>
      </div>

      {/* 3-Column Layout matching Image 5 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[720px]">
        {/* Left Column (4 cols): Thread list */}
        <div className="md:col-span-4 border-r border-slate-200/80 flex flex-col h-full bg-slate-50/40">
          <div className="p-3.5 border-b border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">All Inboxes</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
                {conversations.length}
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Tabs matching Image 5 */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-semibold text-slate-600">
              {(['open', 'followup', 'done'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`flex-1 py-1 rounded-lg capitalize transition ${
                    filterTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  {tab === 'followup' ? 'Follow-up' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition flex items-start space-x-3 ${
                    isSelected ? 'bg-blue-50/60 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {conv.customer_name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {conv.customer_name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {conv.status === 'needs_attention' ? 'Escalated to Needs Attention' : 'Active conversation thread'}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-1.5">
                      {conv.last_category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                          {conv.last_category.replace('_', ' ')}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">AI Verified</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column (5 cols): Chat Stream matching Image 5 */}
        <div className="md:col-span-5 border-r border-slate-200/80 flex flex-col h-full bg-white">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {selectedConv?.customer_name?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">{selectedConv?.customer_name || 'Customer'}</div>
                <div className="text-[10px] text-slate-400">{selectedCustomer?.contact_email || 'customer@example.com'}</div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {/* Alert banner matching Image 5 yellow banner */}
            <div className="p-3 bg-[#fef9c3] border border-[#fef08a] rounded-xl text-xs text-[#854d0e] flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-[#ca8a04] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Collections Protocol:</span> Inbound messages are checked against database ground truth. Invoices are never marked paid upon customer promises or claims.
              </div>
            </div>

            {loadingMessages ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading conversation...</div>
            ) : (
              activeMessages.map((msg) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-1 px-1 flex items-center space-x-1">
                      <span>{isOutbound ? 'AcmeCorp Receivables' : msg.sender}</span>
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.is_human_reviewed && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          HUMAN APPROVED
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                        isOutbound
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      <div className="font-bold text-[11px] mb-1 opacity-90 border-b border-black/10 pb-1">
                        {msg.subject}
                      </div>
                      <div className="whitespace-pre-line text-xs">
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Input matching Image 5 */}
          <div className="p-3 border-t border-slate-200/80 bg-white space-y-2">
            <textarea
              rows={2}
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1 text-slate-400">
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Plus className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><Paperclip className="w-3.5 h-3.5" /></button>
                <button
                  onClick={() => setReplyInput("Thank you for your response. We are checking the bank statement for clearance.")}
                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Suggest Reply</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400">Enter to send</span>
                <button
                  onClick={() => {
                    if (!replyInput.trim()) return;
                    alert("Reply recorded and queued for transmission.");
                    setReplyInput('');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (3 cols): Customer Profile matching Image 5 */}
        <div className="md:col-span-3 p-5 flex flex-col justify-between bg-slate-50/60 h-full overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">Customer Profile</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xl font-bold flex items-center justify-center mx-auto shadow-md">
                {selectedCustomer?.name.charAt(0) || 'C'}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">{selectedCustomer?.name || 'Customer Profile'}</div>
                <div className="text-xs text-slate-500">{selectedCustomer?.contact_name || 'Contact Person'}</div>
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                {selectedCustomer?.country} Account
              </span>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-slate-800">Active Debtor</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Currency:</span>
                <span className="font-mono font-bold text-slate-800">{selectedCustomer?.currency}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Tax ID:</span>
                <span className="font-mono text-[11px] text-slate-700">{selectedCustomer?.tax_id || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-400">Payment Terms:</span>
                <span className="font-medium text-slate-800">{selectedCustomer?.payment_terms}</span>
              </div>
            </div>

            {/* Response Rate Bar matching Image 5 */}
            <div className="space-y-1.5 border-t border-slate-200 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Response Rate</span>
                <span className="font-bold text-emerald-600">92%</span>
              </div>
              <div className="flex gap-1 h-2">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${i < 11 ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 mt-4">
            <div className="font-bold text-slate-800">Ground Truth Isolation</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Only this customer's invoices are loaded into LLM classification memory.
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Simulate Customer Inbound Email</h3>
                <p className="text-xs text-slate-500">Test AI classification across 8 standardized categories</p>
              </div>
              <button onClick={() => setShowSimulateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Scenario Preset:</label>
                <select
                  value={selectedPreset.label}
                  onChange={(e) => {
                    const preset = SIMULATION_PRESETS.find(p => p.label === e.target.value) || SIMULATION_PRESETS[0];
                    setSelectedPreset(preset);
                    setCustomReplyText(preset.body);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                >
                  {SIMULATION_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sender Email:</label>
                <input
                  type="text"
                  value={selectedPreset.sender}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Message Body:</label>
                <textarea
                  rows={4}
                  value={customReplyText}
                  onChange={(e) => setCustomReplyText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulate}
                disabled={simulating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{simulating ? 'Processing...' : 'Inject Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
