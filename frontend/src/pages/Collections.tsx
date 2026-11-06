import React, { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Info } from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../services/api';

interface CollectionsProps {
  overdueInvoices: Invoice[];
  onRefresh: () => void;
}

export const Collections: React.FC<CollectionsProps> = ({ overdueInvoices, onRefresh }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [overrideRecipient, setOverrideRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSendReminder = async (invoice: Invoice) => {
    try {
      setSending(true);
      setLastResult(null);
      const res = await api.sendReminder({
        invoice_id: invoice.id,
        custom_message: customMessage || undefined,
        override_recipient: overrideRecipient || undefined
      });
      setLastResult(res);
      setSelectedInvoice(null);
      setCustomMessage('');
      setOverrideRecipient('');
      onRefresh();
    } catch (err: any) {
      alert(`Reminder failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Collections Outbound Agent</h1>
        <p className="text-sm text-slate-400 mt-1">
          Automated payment reminders with ground-truth validation, idempotency enforcement, and SMTP/simulated delivery.
        </p>
      </div>

      {/* Safety & Compliance Banner */}
      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 flex items-start space-x-3 text-xs text-blue-300">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white">Collections Governance Protocol:</div>
          <p>
            1. Reminders are generated exclusively for <strong>sent</strong> invoices with an outstanding balance past their due date.
          </p>
          <p>
            2. <strong>Draft</strong> and <strong>paid</strong> invoices are strictly barred from chasing queues.
          </p>
          <p>
            3. Each reminder logs a daily idempotency key to prevent accidental duplicate customer harassment.
          </p>
        </div>
      </div>

      {lastResult && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex items-start space-x-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-white">Reminder Dispatched Successfully:</div>
            <p>Recipient: <strong>{lastResult.recipient}</strong> | Mode: <span className="uppercase font-mono">{lastResult.mode}</span></p>
            <p className="font-mono text-[11px] text-emerald-400">Idempotency Key: {lastResult.idempotency_key}</p>
          </div>
        </div>
      )}

      {/* Overdue Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Eligible Invoices Ready for Outbound Notice</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
            {overdueInvoices.length} Queued
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Days Overdue</th>
                <th className="py-3 px-4 text-right">Outstanding Balance</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {overdueInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-semibold text-white">{inv.invoice_number}</td>
                  <td className="py-3 px-4 text-slate-300 font-medium">{inv.customer_name}</td>
                  <td className="py-3 px-4 text-slate-400">{inv.due_date}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                      {inv.days_overdue} days past due
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">
                    {inv.currency} {inv.balance_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>Review & Send</span>
                    </button>
                  </td>
                </tr>
              ))}
              {overdueInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No overdue invoices currently requiring collection notice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Send Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Send Outbound Payment Reminder</h3>
                <p className="text-xs text-slate-400">Invoice {selectedInvoice.invoice_number} • {selectedInvoice.customer_name}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800/40 rounded-lg space-y-1">
                <div className="text-slate-400">Target Invoice Facts (from Ground Truth DB):</div>
                <div className="font-semibold text-white">
                  Balance: {selectedInvoice.currency} {selectedInvoice.balance_due.toLocaleString()} | Due: {selectedInvoice.due_date} ({selectedInvoice.days_overdue} days overdue)
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Recipient Test Override (Optional):
                </label>
                <input
                  type="email"
                  value={overrideRecipient}
                  onChange={(e) => setOverrideRecipient(e.target.value)}
                  placeholder="Defaults to customer contact email or CUSTOMER_TEST_EMAIL"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Custom Operator Note / Instructions (Optional):
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g. Kindly share the Form 16A TDS certificate if deducting 10% TDS."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendReminder(selectedInvoice)}
                disabled={sending}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium shadow flex items-center space-x-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Dispatching...' : 'Dispatch Reminder'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
