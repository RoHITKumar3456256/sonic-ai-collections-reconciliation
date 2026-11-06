import React, { useState } from 'react';
import {
  Upload,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Percent,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { ReconciliationSuggestion, Invoice } from '../types';
import { api } from '../services/api';

interface ReconciliationProps {
  suggestions: ReconciliationSuggestion[];
  invoices: Invoice[];
  onRefresh: () => void;
}

export const Reconciliation: React.FC<ReconciliationProps> = ({
  suggestions,
  invoices,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [manualModalSug, setManualModalSug] = useState<ReconciliationSuggestion | null>(null);
  const [manualInvoiceId, setManualInvoiceId] = useState<string>('');
  const [manualActionType, setManualActionType] = useState<string>('leave_balance_open');

  const filteredSuggestions = suggestions.filter(s =>
    s.transaction_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.candidate_customer_name && s.candidate_customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const matchedCount = suggestions.filter(s => s.status === 'approved').length;
  const totalCount = suggestions.length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await api.uploadBankCsv(file);
      onRefresh();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLoadAssignmentCsv = async () => {
    try {
      setUploading(true);
      const sampleCsv = `date,description,reference,credit,debit,currency
2026-09-05,KESTREL FOODS / INV 1004,TXN904812,59000.00,,INR
2026-09-10,ORBIS PKG / PART PAYMENT,TXN905103,200000.00,,INR
2026-09-21,QUILLON TECH,TXN906841,324000.00,,INR
2026-09-25,NORDLYS RETAIL / RE 1024,TXN907294,9200.00,,EUR
2026-09-28,HARBOUR ANALYTICS / INV1021,TXN908115,12500.00,,USD
2026-09-30,BRIGHTLINE LOGISTICS / INV-1002,TXN909021,236000.00,,INR
2026-10-02,REDWOOD CLINIC,TXN910402,59000.00,,INR
2026-10-05,OFFICE RENT OCT (debit),DEB911001,,45000.00,INR
2026-10-08,THORNFIELD MEDIA,TXN912093,7350.50,,GBP
2026-10-12,SAFFRON PEAK HOSP / OCT DUES,TXN913482,194700.00,,INR
2026-10-15,SOFTWARE VENDOR (debit),DEB914100,,1200.00,USD
2026-10-20,R K SHARMA / CLINIC DUES,TXN915820,88500.00,,INR
2026-10-24,MAPLE RETAIL SERVICES,TXN916904,12750.00,,INR
2026-10-31,INTEREST PAID,INT917300,431.22,,INR`;

      const blob = new Blob([sampleCsv], { type: 'text/csv' });
      const file = new File([blob], 'bank_statement_sample.csv', { type: 'text/csv' });
      await api.uploadBankCsv(file);
      onRefresh();
    } catch (err: any) {
      alert(`Sample load failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (sug: ReconciliationSuggestion, actionType: string) => {
    try {
      setActionInProgress(sug.id);
      await api.approveSuggestion(sug.id, actionType);
      onRefresh();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (sug: ReconciliationSuggestion) => {
    try {
      setActionInProgress(sug.id);
      await api.rejectSuggestion(sug.id);
      onRefresh();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleManualSelectSubmit = async () => {
    if (!manualModalSug || !manualInvoiceId) return;
    try {
      setActionInProgress(manualModalSug.id);
      await api.manualSelectSuggestion(manualModalSug.id, manualInvoiceId, manualActionType);
      setManualModalSug(null);
      setManualInvoiceId('');
      onRefresh();
    } catch (err: any) {
      alert(`Manual link failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bank Reconciliation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Match bank transactions with receipts and invoices using calibrated multi-signal heuristics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleLoadAssignmentCsv}
            disabled={uploading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load 14-Row Test Statement</span>
          </button>

          <label className="cursor-pointer px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition flex items-center space-x-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Parsing...' : 'Upload Statement'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Search & Filter Bar matching Image 1 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date Range</span>
          </button>

          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Two-Column Layout matching Image 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols = ~60%): Transactions Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4 text-right">AMOUNT</th>
                  <th className="py-3 px-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSuggestions.map((sug) => {
                  const isApproved = sug.status === 'approved';
                  const isPossible = sug.confidence_score >= 0.50 && !isApproved && sug.status !== 'rejected';
                  const isSelected = selectedSuggestionId === sug.id;

                  return (
                    <tr
                      key={sug.id}
                      onClick={() => setSelectedSuggestionId(sug.id)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-teal-50/60'
                          : isApproved
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {sug.transaction_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 uppercase tracking-tight text-[11px]">
                          {sug.transaction_description}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {sug.transaction_reference}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        +{sug.transaction_currency} {sug.transaction_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]">
                            MATCHED
                          </span>
                        ) : isPossible ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#fef3c7] text-[#d97706] border border-[#fde68a]">
                            POSSIBLE MATCH
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ffe4e6] text-[#e11d48] border border-[#fecdd3]">
                            UNMATCHED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredSuggestions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                      No statement records loaded. Click "Load 14-Row Test Statement" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Bar matching Image 1 */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-slate-700">
                {matchedCount}/{totalCount} transactions matched
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono">
                Debit rows excluded automatically
              </span>
            </div>

            <button
              onClick={() => alert(`Reconciliation status: ${matchedCount} of ${totalCount} receipts approved and allocated to ledger.`)}
              className="px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs font-bold rounded-xl shadow transition"
            >
              ✓ Complete Reconciliation
            </button>
          </div>
        </div>

        {/* Right Column (5 cols = ~40%): Matching Suggestions Panel matching Image 1 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Matching Suggestions</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic invoice candidate matches with similarity score bars.
              </p>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredSuggestions.map((sug) => {
                const isApproved = sug.status === 'approved';
                const isRejected = sug.status === 'rejected';
                const confidencePct = Math.round(sug.confidence_score * 100);

                return (
                  <div
                    key={sug.id}
                    className={`p-4 rounded-xl border transition space-y-3 ${
                      isApproved
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : isRejected
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Top: Customer & Amount */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {sug.candidate_customer_name || 'No Matching Customer'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {sug.candidate_invoice_number ? `Invoice #${sug.candidate_invoice_number}` : 'Non-customer bank receipt'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Txn Date: {sug.transaction_date}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-xs text-slate-900">
                          +{sug.transaction_currency} {sug.transaction_amount.toLocaleString()}
                        </div>
                        {isApproved && (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 mt-1">
                            <Check className="w-3 h-3 mr-0.5" /> APPROVED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Similarity Bar matching Image 1 */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Similarity:</span>
                        <span className="font-bold text-amber-600">{confidencePct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#d97706] h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(5, confidencePct))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Concise Reason */}
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">
                      {sug.reason}
                    </div>

                    {/* Action Buttons */}
                    {!isApproved && !isRejected && (
                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            setManualModalSug(sug);
                            setManualInvoiceId(sug.candidate_invoice_id || '');
                          }}
                          disabled={actionInProgress === sug.id}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition"
                        >
                          Manual Link
                        </button>

                        <button
                          onClick={() => handleReject(sug)}
                          disabled={actionInProgress === sug.id}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-lg transition"
                        >
                          Reject
                        </button>

                        {sug.candidate_invoice_number && (
                          <>
                            {sug.suggested_action === 'close_invoice_tds' ? (
                              <button
                                onClick={() => handleApprove(sug, 'close_invoice_tds')}
                                disabled={actionInProgress === sug.id}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition flex items-center space-x-1"
                              >
                                <Percent className="w-3 h-3" />
                                <span>Approve (Close 10% TDS)</span>
                              </button>
                            ) : sug.suggested_action === 'leave_balance_open' ? (
                              <button
                                onClick={() => handleApprove(sug, 'leave_balance_open')}
                                disabled={actionInProgress === sug.id}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition"
                              >
                                Approve (Leave Open)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprove(sug, 'leave_balance_open')}
                                disabled={actionInProgress === sug.id}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition flex items-center space-x-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve Settlement</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Link Modal */}
      {manualModalSug && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manually Link Open Invoice</h3>
                <p className="text-xs text-slate-500">
                  {manualModalSug.transaction_description} (+{manualModalSug.transaction_currency} {manualModalSug.transaction_amount})
                </p>
              </div>
              <button onClick={() => setManualModalSug(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Select Open Invoice:</label>
                <select
                  value={manualInvoiceId}
                  onChange={(e) => setManualInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Invoice --</option>
                  {invoices
                    .filter(i => i.balance_due > 0)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} • {inv.customer_name} • Bal: {inv.currency} {inv.balance_due.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Allocation Choice:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="act"
                      value="leave_balance_open"
                      checked={manualActionType === 'leave_balance_open'}
                      onChange={() => setManualActionType('leave_balance_open')}
                    />
                    <span className="text-slate-700">Standard receipt (Keep remaining balance open)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="act"
                      value="close_invoice_tds"
                      checked={manualActionType === 'close_invoice_tds'}
                      onChange={() => setManualActionType('close_invoice_tds')}
                    />
                    <span className="text-slate-700">Close invoice with 10% TDS deduction (Form 16A verified)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setManualModalSug(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSelectSubmit}
                disabled={!manualInvoiceId}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow transition"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
