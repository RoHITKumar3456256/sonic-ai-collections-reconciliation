import React from 'react';
import { History, CheckCircle2, ShieldCheck, ArrowDownRight, Percent } from 'lucide-react';
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Payment Ledger & Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of approved bank receipts, invoice allocations, and TDS tax deductions.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            Total Allocated: ₹{totalAmount.toLocaleString()}
          </div>
          {totalTds > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
              Total TDS Cleared: ₹{totalTds.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Verified Allocations History</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {payments.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt Date</th>
                <th className="py-3 px-4">Txn Ref</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-right">TDS Deducted</th>
                <th className="py-3 px-4">Action Mode</th>
                <th className="py-3 px-4 text-right">New Balance</th>
                <th className="py-3 px-4">Approved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 text-slate-400 font-mono">{p.payment_date}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-300">{p.transaction_reference}</td>
                  <td className="py-3 px-4 font-semibold text-white">{p.invoice_number}</td>
                  <td className="py-3 px-4 text-slate-300">{p.customer_name}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    {p.currency} {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-blue-400">
                    {p.tds_deducted > 0 ? `${p.currency} ${p.tds_deducted.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {p.action_type === 'close_invoice_tds' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        TDS Close (10%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                        Standard Receipt
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">
                    {p.new_balance === 0 ? (
                      <span className="text-emerald-400">0.00 (PAID)</span>
                    ) : (
                      <span className="text-white">{p.currency} {p.new_balance.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{p.approved_by}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No approved payments in ledger yet. Approve matches in the Reconciliation tab.
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
