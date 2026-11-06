import React, { useState } from 'react';
import {
  Users,
  Search,
  Edit3,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { Customer } from '../types';
import { api } from '../services/api';

interface CustomersProps {
  customers: Customer[];
  onRefresh: () => void;
}

export const Customers: React.FC<CustomersProps> = ({ customers, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEmailInput(customer.contact_email);
  };

  const handleSaveEmail = async () => {
    if (!editingCustomer) return;
    try {
      setSaving(true);
      await api.updateCustomer(editingCustomer.id, { contact_email: emailInput });
      setNotice(`Updated contact email for ${editingCustomer.name}`);
      setEditingCustomer(null);
      onRefresh();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Image 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise debtor accounts directory. Edit email addresses to test live reminder delivery.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* Main Customers Table matching Image 4 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">Customer Directory ({filtered.length})</span>
          <span className="text-xs text-slate-400">Domestic & International Enterprise Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Contact Email</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Tax ID / GSTIN</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{c.contact_name || '—'}</td>
                  <td className="py-3.5 px-4 font-mono text-blue-600 font-semibold">{c.contact_email}</td>
                  <td className="py-3.5 px-4 text-slate-600 flex items-center space-x-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.country}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{c.currency}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{c.tax_id || '—'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition"
                      title="Edit email for testing"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Cards matching lower section of Image 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800">To Remind</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">11 Accounts</span>
          </div>
          <p className="text-xs text-slate-500">Overdue invoices calculated dynamically with due date before reference date.</p>
          <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-100">
            <span>Automated Chasing</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800">In Progress</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">Reconciling</span>
          </div>
          <p className="text-xs text-slate-500">Bank statement transactions matching against invoice database ground truth.</p>
          <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-100">
            <span>5-Signal Algorithm</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800">Needs Custom Reply</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">Review Desk</span>
          </div>
          <p className="text-xs text-slate-500">Billing disputes, legal letters, and extension requests requiring human review.</p>
          <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-100">
            <span>3-Day Review SLA</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800">TDS Verification</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold">10% Subtotal</span>
          </div>
          <p className="text-xs text-slate-500">Form 16A certificates collected from Indian domestic entities upon invoice closure.</p>
          <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-100">
            <span>Statutory Audit</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Edit Customer Email Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Customer Email</h3>
                <p className="text-xs text-slate-500">{editingCustomer.name} ({editingCustomer.id})</p>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                Replace this sample email with your own testing mailbox to verify live SMTP outbound delivery.
              </p>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Email Address:</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmail}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow transition"
              >
                {saving ? 'Saving...' : 'Save Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
