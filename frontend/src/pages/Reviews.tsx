import React, { useState } from 'react';
import { AlertCircle, Send, CheckCircle2, ShieldAlert, Clock, UserCheck, MessageSquare } from 'lucide-react';
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
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">CRITICAL</span>;
      case 'high':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">HIGH PRIORITY</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Needs Attention Queue</h1>
          <p className="text-sm text-slate-400 mt-1">
            Human-in-the-loop review desk for customer disputes, extensions, legal notices, and sensitive exceptions.
          </p>
        </div>

        <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
          {reviews.length} Escalated Items Awaiting Action
        </span>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-3">
                {getUrgencyBadge(rev.urgency)}
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {rev.category.replace('_', ' ')}
                </span>
                <span className="text-sm font-semibold text-white">{rev.subject}</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(rev.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Customer:</span>
                <p className="font-semibold text-slate-200">{rev.customer_name || 'Unknown'}</p>
                <p className="text-slate-400 text-[11px] font-mono">{rev.sender_email}</p>
              </div>

              <div className="md:col-span-2 space-y-1">
                <span className="text-slate-500 font-medium">Reason for Human Escalation:</span>
                <p className="text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  {rev.reason_for_review}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-500 font-medium">AI Drafted Response:</span>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-slate-300 font-mono text-[11px] whitespace-pre-line">
                {rev.ai_draft_reply}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleOpenReview(rev)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center space-x-1.5 shadow transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Review & Dispatch Reply</span>
              </button>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">Review Queue Clean</h3>
            <p className="text-xs text-slate-400">
              No disputes, legal threats, or unverified exceptions currently waiting for operator review.
            </p>
          </div>
        )}
      </div>

      {/* Review Modal Editor */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Human Edit & Outbound Approval</h3>
                <p className="text-xs text-slate-400">To: {selectedReview.sender_email} ({selectedReview.customer_name})</p>
              </div>
              <button onClick={() => setSelectedReview(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-xs text-amber-300">
              <strong>Escalation Context:</strong> {selectedReview.reason_for_review}
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-400 font-medium">
                Edit Outbound Draft (All financial commitments will be sent under your authorization):
              </label>
              <textarea
                rows={8}
                value={editedReply}
                onChange={(e) => setEditedReply(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDraft}
                disabled={sending}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold flex items-center space-x-1.5 shadow transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending...' : 'Authorize & Send Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
