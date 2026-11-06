import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  Calendar,
  X
} from 'lucide-react';
import { Invoice } from '../types';

interface InvoicesProps {
  invoices: Invoice[];
  onSendReminder: (invId: string) => void;
}

export const Invoices: React.FC<InvoicesProps> = ({ invoices, onSendReminder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'sent' | 'paid' | 'draft'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'overdue') return inv.is_overdue;
    return inv.status === statusFilter;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const exportCsv = () => {
    const headers = "Invoice ID,Customer,Total,Balance Due,Currency,Due Date,Status\n";
    const rows = filteredInvoices.map(i =>
      `"${i.invoice_number}","${i.customer_name}",${i.total},${i.balance_due},"${i.currency}","${i.due_date}","${i.status}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "invoices_export.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Image 3 (Monexa style) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ledger with dynamic overdue calculation and tax deduction compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>This Month</span>
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export as .CSV</span>
          </button>

          <button
            onClick={() => alert("AcmeCorp invoicing is integrated with billing sync. Create new contract in ERP.")}
            className="flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar matching Image 3 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector buttons */}
          {(['all', 'overdue', 'sent', 'paid', 'draft'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === filter
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}

          <span className="h-4 w-px bg-slate-200 mx-1"></span>

          {/* Active filter pill tags matching Image 3 */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
            <span>Total: &gt;₹10,000</span>
            <X className="w-3 h-3 text-slate-400 cursor-pointer" />
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
            <span>Dynamic Overdue</span>
            <Check className="w-3 h-3 text-emerald-500" />
          </div>
        </div>

        {/* Search Input matching Image 3 */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice or customer..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white px-1 border border-slate-200 rounded">
            ⌘/
          </span>
        </div>
      </div>

      {/* Main Table matching Image 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Amount Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Product / Items</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedIds.includes(inv.id);
                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-blue-50/30 transition ${
                      isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(inv.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      #{inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {inv.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {inv.currency} {inv.balance_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.is_overdue ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                          <span>OVERDUE ({inv.days_overdue}d)</span>
                        </span>
                      ) : inv.status === 'paid' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>PAID</span>
                        </span>
                      ) : inv.status === 'draft' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Edit className="w-3 h-3 text-amber-600" />
                          <span>DRAFT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>SENT (ACTIVE)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {inv.items ? `${inv.items.length} items` : '1 service item'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.due_date}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                        title="View Invoice Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No invoices matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching Image 3 */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            Showing <span className="font-bold text-slate-800">1-{filteredInvoices.length}</span> of <span className="font-bold text-slate-800">{invoices.length}</span> results
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span>Rows per page</span>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-semibold focus:outline-none">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Invoice #{selectedInvoice.invoice_number}</h3>
                <p className="text-xs text-slate-500">{selectedInvoice.customer_name}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Issue Date:</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedInvoice.issue_date}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Due Date:</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedInvoice.due_date}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Subtotal:</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedInvoice.currency} {selectedInvoice.subtotal.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">GST / Tax:</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedInvoice.currency} {selectedInvoice.tax.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Total Amount:</span>
                <div className="text-base font-bold text-slate-900">
                  {selectedInvoice.currency} {selectedInvoice.total.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">Remaining Balance:</span>
                <div className={`text-base font-bold ${selectedInvoice.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedInvoice.currency} {selectedInvoice.balance_due.toLocaleString()}
                </div>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
                <strong>Statutory Note:</strong> {selectedInvoice.notes}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition"
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
