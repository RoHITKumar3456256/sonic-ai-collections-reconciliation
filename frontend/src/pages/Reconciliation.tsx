import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  Percent,
  Search
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
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<any>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [manualModalSug, setManualModalSug] = useState<ReconciliationSuggestion | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [manualActionType, setManualActionType] = useState<string>('leave_balance_open');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await api.uploadBankCsv(file);
      setUploadSummary(res.summary);
      onRefresh();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSampleData = async () => {
    try {
      setUploading(true);
      // Fetch data/bank_statement_sample.csv and submit
      const sampleCsvText = `date,description,reference,credit,debit,currency
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

      const blob = new Blob([sampleCsvText], { type: 'text/csv' });
      const file = new File([blob], 'bank_statement_sample.csv', { type: 'text/csv' });
      const res = await api.uploadBankCsv(file);
      setUploadSummary(res.summary);
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
    if (!manualModalSug || !selectedInvoiceId) return;
    try {
      setActionInProgress(manualModalSug.id);
      await api.manualSelectSuggestion(manualModalSug.id, selectedInvoiceId, manualActionType);
      setManualModalSug(null);
      setSelectedInvoiceId('');
      onRefresh();
    } catch (err: any) {
      alert(`Manual link failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bank Statement Reconciliation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic multi-signal matching engine, TDS deduction calculation, debit exclusion, and human approval desk.
          </p>
        </div>

        <button
          onClick={handleLoadSampleData}
          disabled={uploading}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Load 14-Row Assignment CSV</span>
        </button>
      </div>

      {/* CSV Dropzone / Uploader */}
      <div className="p-6 bg-slate-900 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Upload Bank Statement CSV</h3>
          <p className="text-xs text-slate-400 mt-1">
            Accepts UTF-8 CSV containing <code className="text-blue-400">date, description, reference, credit, debit, currency</code>.
          </p>
        </div>
        <div className="flex justify-center">
          <label className="cursor-pointer px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition">
            <span>{uploading ? 'Parsing & Matching...' : 'Browse CSV File'}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Upload Summary Banner */}
      {uploadSummary && (
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-300 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-400">Total Statement Rows:</span>
            <div className="text-base font-bold text-white">{uploadSummary.total_rows_parsed}</div>
          </div>
          <div>
            <span className="text-slate-400">Credit Rows Matched:</span>
            <div className="text-base font-bold text-emerald-400">{uploadSummary.credit_transactions_count}</div>
          </div>
          <div>
            <span className="text-slate-400">Debit Rows Excluded:</span>
            <div className="text-base font-bold text-rose-400">{uploadSummary.debit_transactions_excluded}</div>
          </div>
          <div>
            <span className="text-slate-400">Governance:</span>
            <div className="text-xs font-semibold text-white mt-1">No payment applied before approval</div>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Reconciliation Candidates & Human Approvals ({suggestions.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {suggestions.map((sug) => {
            const isApproved = sug.status === 'approved';
            const isRejected = sug.status === 'rejected';
            const confidencePct = Math.round(sug.confidence_score * 100);

            return (
              <div
                key={sug.id}
                className={`p-5 rounded-xl border transition space-y-4 ${
                  isApproved
                    ? 'bg-emerald-950/10 border-emerald-900/40'
                    : isRejected
                    ? 'bg-slate-900/50 border-slate-800 opacity-60'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {sug.transaction_date}
                    </span>
                    <span className="font-semibold text-sm text-white">{sug.transaction_description}</span>
                    <span className="font-mono text-xs text-slate-500">Ref: {sug.transaction_reference}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-base font-bold text-emerald-400">
                      + {sug.transaction_currency} {sug.transaction_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {isApproved ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5" />
                        <span>APPROVED</span>
                      </span>
                    ) : isRejected ? (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        REJECTED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        PENDING APPROVAL
                      </span>
                    )}
                  </div>
                </div>

                {/* Candidate & Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Left: Matched Invoice */}
                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-medium">Candidate Invoice:</span>
                    {sug.candidate_invoice_number ? (
                      <div>
                        <div className="font-bold text-white text-sm">{sug.candidate_invoice_number}</div>
                        <div className="text-slate-300">{sug.candidate_customer_name}</div>
                        <div className="text-slate-400 text-[11px] mt-1">
                          Balance Due: {sug.transaction_currency} {sug.candidate_balance_due?.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-amber-400 font-medium pt-1">
                        No confident candidate found (Non-invoice receipt)
                      </div>
                    )}
                  </div>

                  {/* Middle: Confidence & Score Signals */}
                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Match Confidence:</span>
                      <span className={`font-bold ${confidencePct >= 80 ? 'text-emerald-400' : confidencePct >= 50 ? 'text-amber-400' : 'text-slate-500'}`}>
                        {confidencePct}%
                      </span>
                    </div>
                    {sug.breakdown && (
                      <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-mono text-slate-400 pt-1">
                        <div className="p-1 bg-slate-900 rounded">
                          <div>Inv#</div>
                          <div className="text-white font-semibold">{sug.breakdown.invoice_number_score * 100}%</div>
                        </div>
                        <div className="p-1 bg-slate-900 rounded">
                          <div>Name</div>
                          <div className="text-white font-semibold">{Math.round(sug.breakdown.payer_name_score * 100)}%</div>
                        </div>
                        <div className="p-1 bg-slate-900 rounded">
                          <div>Amt</div>
                          <div className="text-white font-semibold">{sug.breakdown.amount_score * 100}%</div>
                        </div>
                        <div className="p-1 bg-slate-900 rounded">
                          <div>Date</div>
                          <div className="text-white font-semibold">{sug.breakdown.date_proximity_score * 100}%</div>
                        </div>
                        <div className="p-1 bg-slate-900 rounded">
                          <div>Curr</div>
                          <div className="text-white font-semibold">{sug.breakdown.currency_score * 100}%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Explanation Reason */}
                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-500 font-medium">Reconciliation Reason:</span>
                    <p className="text-slate-300 leading-relaxed">
                      {sug.reason}
                    </p>
                  </div>
                </div>

                {/* Operator Actions Bar */}
                {!isApproved && !isRejected && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setManualModalSug(sug);
                        setSelectedInvoiceId(sug.candidate_invoice_id || '');
                      }}
                      disabled={actionInProgress === sug.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                    >
                      Manually Link Invoice
                    </button>

                    <button
                      onClick={() => handleReject(sug)}
                      disabled={actionInProgress === sug.id}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-medium border border-rose-900/50 transition"
                    >
                      Reject Match
                    </button>

                    {sug.candidate_invoice_number && (
                      <>
                        {sug.suggested_action === 'close_invoice_tds' ? (
                          <button
                            onClick={() => handleApprove(sug, 'close_invoice_tds')}
                            disabled={actionInProgress === sug.id}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition flex items-center space-x-1"
                          >
                            <Percent className="w-3.5 h-3.5" />
                            <span>Approve: Close with TDS Deduction (10%)</span>
                          </button>
                        ) : sug.suggested_action === 'leave_balance_open' ? (
                          <button
                            onClick={() => handleApprove(sug, 'leave_balance_open')}
                            disabled={actionInProgress === sug.id}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                          >
                            Approve: Partial Payment (Leave Open)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(sug, 'leave_balance_open')}
                            disabled={actionInProgress === sug.id}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Full Settlement</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {suggestions.length === 0 && (
            <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-base font-semibold text-white">No Statement Uploaded Yet</h3>
              <p className="text-xs text-slate-400">
                Click <strong>"Load 14-Row Assignment CSV"</strong> or browse a bank statement file to run matching.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Link Invoice Modal */}
      {manualModalSug && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Manual Invoice Allocation</h3>
                <p className="text-xs text-slate-400">
                  Transaction: {manualModalSug.transaction_description} ({manualModalSug.transaction_currency} {manualModalSug.transaction_amount})
                </p>
              </div>
              <button onClick={() => setManualModalSug(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Select Open Invoice to Allocate:</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose an Open Invoice --</option>
                  {invoices
                    .filter(i => i.balance_due > 0)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} • {inv.customer_name} • Balance: {inv.currency} {inv.balance_due.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Allocation Choice:</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="actionType"
                      value="leave_balance_open"
                      checked={manualActionType === 'leave_balance_open'}
                      onChange={() => setManualActionType('leave_balance_open')}
                    />
                    <span className="text-slate-300">Standard allocation (Leave any remaining balance open)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="actionType"
                      value="close_invoice_tds"
                      checked={manualActionType === 'close_invoice_tds'}
                      onChange={() => setManualActionType('close_invoice_tds')}
                    />
                    <span className="text-slate-300">Close invoice with TDS deduction (Form 16A verified)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setManualModalSug(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSelectSubmit}
                disabled={!selectedInvoiceId}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold transition"
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
