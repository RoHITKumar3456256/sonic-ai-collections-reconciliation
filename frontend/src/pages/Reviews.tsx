import React, { useState } from 'react';
import { AlertCircle, Send, CheckCircle2, ShieldAlert, Clock, UserCheck, MessageSquare, ChevronRight } from 'lucide-react';
import { ReviewItem } from '../types';
import { api } from '../services/api';

interface ReviewsProps {
  reviews: ReviewItem[];
  onRefresh: () => void;
}

export const Reviews: React.FC<ReviewsProps> = ({ reviews, onRefresh }) => {
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [editedReply, setEditedReply] = useState('');
  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleOpenReview = (rev: ReviewItem) => {
    setSelectedReview(rev);
    setEditedReply(rev.ai_draft_reply);
  };

  const handleSendDraft = async () => {
    if (!selectedReview) return;
    try {
      setSending(true);
      await api.sendReviewDraft(selectedReview.id, editedReply);
      setSuccessNotice(`Approved reply sent to ${selectedReview.sender_email}`);
      setSelectedReview(null);
      onRefresh();
    } catch (err: any) {
      alert(`Send failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-300">CRITICAL</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">HIGH PRIORITY</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Needs Attention Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Human review desk for customer disputes, payment extension requests, legal notices, and exceptions.
          </p>
        </div>

        <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold">
          {reviews.length} Items Awaiting Review
        </span>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:shadow-md transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                {getUrgencyBadge(rev.urgency)}
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                  {rev.category.replace('_', ' ')}
                </span>
                <span className="text-sm font-bold text-slate-900">{rev.subject}</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(rev.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Customer:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{rev.customer_name || 'Unknown'}</p>
                <p className="text-slate-500 font-mono text-[11px]">{rev.sender_email}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-slate-400 font-medium">Escalation Trigger:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-0.5 font-medium">
                  {rev.reason_for_review}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-400 font-medium">AI Drafted Response:</span>
              <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 text-slate-700 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                {rev.ai_draft_reply}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleOpenReview(rev)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Review & Dispatch Reply</span>
              </button>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Review Queue Empty</h3>
            <p className="text-xs text-slate-400">
              No disputes, legal threats, or unverified exceptions currently waiting for human intervention.
            </p>
          </div>
        )}
      </div>

      {/* Review Modal Editor */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Operator Review & Authorization</h3>
                <p className="text-xs text-slate-500">To: {selectedReview.sender_email} ({selectedReview.customer_name})</p>
              </div>
              <button onClick={() => setSelectedReview(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <strong>Escalation Reason:</strong> {selectedReview.reason_for_review}
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-700 font-semibold">
                Edit Outbound Reply (Approved financial response):
              </label>
              <textarea
                rows={8}
                value={editedReply}
                onChange={(e) => setEditedReply(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDraft}
                disabled={sending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold flex items-center space-x-1.5 shadow-md transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending...' : 'Authorize & Dispatch'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
