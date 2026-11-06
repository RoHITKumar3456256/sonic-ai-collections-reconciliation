import React from 'react';
import { History, CheckCircle2, ShieldCheck, ArrowDownRight, Percent, Calendar } from 'lucide-react';
import { Payment } from '../types';

interface PaymentsProps {
  payments: Payment[];
}

export const Payments: React.FC<PaymentsProps> = ({ payments }) => {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalTds = payments.reduce((sum, p) => sum + p.tds_deducted, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment Ledger & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit record of verified bank receipts, invoice allocations, and TDS tax deductions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
            Total Allocated: ₹{totalAmount.toLocaleString()}
          </div>
          {totalTds > 0 && (
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold">
              Total TDS Cleared: ₹{totalTds.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Verified Bank Receipts ({payments.length})</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Idempotent Allocations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Receipt Date</th>
                <th className="py-3 px-4">Txn Ref</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-right">TDS Deducted</th>
                <th className="py-3 px-4">Allocation Type</th>
                <th className="py-3 px-4 text-right">New Balance</th>
                <th className="py-3 px-4">Approved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 text-slate-600">{p.payment_date}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.transaction_reference}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{p.invoice_number}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{p.customer_name}</td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                    +{p.currency} {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-purple-700">
                    {p.tds_deducted > 0 ? `${p.currency} ${p.tds_deducted.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {p.action_type === 'close_invoice_tds' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        TDS Close (10%)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Standard Receipt
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold">
                    {p.new_balance === 0 ? (
                      <span className="text-emerald-600">0.00 (PAID)</span>
                    ) : (
                      <span className="text-slate-800">{p.currency} {p.new_balance.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{p.approved_by}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No approved payments in ledger yet. Review matches in Bank Reconciliation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
