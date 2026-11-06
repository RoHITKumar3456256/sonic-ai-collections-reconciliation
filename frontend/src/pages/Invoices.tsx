import React, { useState } from 'react';
import { Search, Filter, Eye, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Invoice } from '../types';

interface InvoicesProps {
  invoices: Invoice[];
  onSendReminder: (invId: string) => void;
}

export const Invoices: React.FC<InvoicesProps> = ({ invoices, onSendReminder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'sent' | 'paid' | 'draft'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'overdue') return inv.is_overdue;
    return inv.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Invoice Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete billing ledger across enterprise accounts with live dynamic overdue computation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice or customer..."
              className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            {(['all', 'overdue', 'sent', 'paid', 'draft'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-semibold text-white flex items-center space-x-2">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{inv.invoice_number}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-medium">{inv.customer_name}</td>
                  <td className="py-3 px-4 text-slate-400">{inv.issue_date}</td>
                  <td className="py-3 px-4 text-slate-400">{inv.due_date}</td>
                  <td className="py-3 px-4">
                    {inv.is_overdue ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <AlertCircle className="w-3 h-3" />
                        <span>Overdue ({inv.days_overdue}d)</span>
                      </span>
                    ) : inv.status === 'paid' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Paid</span>
                      </span>
                    ) : inv.status === 'draft' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-300">
                        <span>Draft</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <Clock className="w-3 h-3" />
                        <span>Sent (Active)</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {inv.currency} {inv.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-200">
                    {inv.currency} {inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">
                    {inv.balance_due > 0 ? (
                      <span className={inv.is_overdue ? "text-rose-400" : "text-white"}>
                        {inv.currency} {inv.balance_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-emerald-400">0.00</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="View Invoice Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No invoices matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedInvoice.invoice_number}</h3>
                <p className="text-xs text-slate-400">{selectedInvoice.customer_name}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-800/40 border border-slate-800">
                <span className="text-slate-500">Issue Date:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{selectedInvoice.issue_date}</p>
              </div>
              <div className="p-2.5 rounded bg-slate-800/40 border border-slate-800">
                <span className="text-slate-500">Due Date:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{selectedInvoice.due_date}</p>
              </div>
              <div className="p-2.5 rounded bg-slate-800/40 border border-slate-800">
                <span className="text-slate-500">Subtotal:</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {selectedInvoice.currency} {selectedInvoice.subtotal.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded bg-slate-800/40 border border-slate-800">
                <span className="text-slate-500">Applicable Tax (GST):</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {selectedInvoice.currency} {selectedInvoice.tax.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-lg flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400">Total Invoice Amount:</span>
                <div className="text-base font-bold text-white">
                  {selectedInvoice.currency} {selectedInvoice.total.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Remaining Balance:</span>
                <div className={`text-base font-bold ${selectedInvoice.balance_due > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedInvoice.currency} {selectedInvoice.balance_due.toLocaleString()}
                </div>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg text-xs text-blue-300">
                <strong>Policy Note:</strong> {selectedInvoice.notes}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                Close
              </button>
              {selectedInvoice.is_overdue && (
                <button
                  onClick={() => {
                    const id = selectedInvoice.id;
                    setSelectedInvoice(null);
                    onSendReminder(id);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow transition"
                >
                  Send Payment Reminder
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
