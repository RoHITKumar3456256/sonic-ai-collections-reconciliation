import React, { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Info, Clock, Check } from 'lucide-react';
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Collections Outbound Agent</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Automated payment reminders with ground-truth validation, idempotency enforcement, and SMTP/simulated delivery.
        </p>
      </div>

      {/* Safety & Compliance Card */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start space-x-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900">Collections Governance Protocol:</div>
          <p className="text-slate-600">
            1. Reminders are generated exclusively for <strong>sent</strong> invoices with an outstanding balance past their due date.
          </p>
          <p className="text-slate-600">
            2. <strong>Draft</strong> and <strong>paid</strong> invoices are strictly barred from chasing queues.
          </p>
          <p className="text-slate-600">
            3. Each reminder logs an idempotency key to prevent accidental duplicate customer harassment.
          </p>
        </div>
      </div>

      {lastResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-slate-900">Reminder Dispatched Successfully:</div>
            <p>Recipient: <strong>{lastResult.recipient}</strong> | Delivery: <span className="uppercase font-mono font-bold text-emerald-700">{lastResult.mode}</span></p>
            <p className="font-mono text-[11px] text-emerald-700">Idempotency Key: {lastResult.idempotency_key}</p>
          </div>
        </div>
      )}

      {/* Overdue Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Eligible Invoices Ready for Outbound Notice</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
            {overdueInvoices.length} Queued
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Overdue Duration</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {overdueInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">{inv.customer_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{inv.due_date}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                      <span>{inv.days_overdue} days past due</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                    {inv.currency} {inv.balance_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>Review & Send</span>
                    </button>
                  </td>
                </tr>
              ))}
              {overdueInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Send Outbound Payment Reminder</h3>
                <p className="text-xs text-slate-500">Invoice {selectedInvoice.invoice_number} • {selectedInvoice.customer_name}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-slate-500 font-medium">Target Invoice Ground Truth:</div>
                <div className="font-bold text-slate-900">
                  Balance: {selectedInvoice.currency} {selectedInvoice.balance_due.toLocaleString()} | Due: {selectedInvoice.due_date} ({selectedInvoice.days_overdue} days overdue)
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Recipient Test Override (Optional):
                </label>
                <input
                  type="email"
                  value={overrideRecipient}
                  onChange={(e) => setOverrideRecipient(e.target.value)}
                  placeholder="Defaults to customer contact email"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Custom Operator Note / Instructions (Optional):
                </label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g. Kindly share Form 16A TDS certificate if deducting 10% TDS on subtotal."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendReminder(selectedInvoice)}
                disabled={sending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold shadow-md transition flex items-center space-x-1.5"
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
