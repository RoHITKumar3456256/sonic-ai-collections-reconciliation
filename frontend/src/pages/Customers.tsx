import React, { useState } from 'react';
import { Users, Search, Edit3, Globe, Mail, Phone, CheckCircle2 } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customer Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Accounts receivables debtor accounts. Update contact emails to test live delivery.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers..."
            className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Contact Email</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Tax ID / GSTIN</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-400">{c.id}</td>
                  <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                  <td className="py-3 px-4 text-slate-300 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>{c.country}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{c.contact_name || '—'}</td>
                  <td className="py-3 px-4 font-mono text-blue-400">{c.contact_email}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{c.currency}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{c.tax_id || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="Edit Contact Email"
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

      {/* Edit Customer Email Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Edit Customer Email</h3>
                <p className="text-xs text-slate-400">{editingCustomer.name} ({editingCustomer.id})</p>
              </div>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Replace this sample email with your own test mailbox to verify real SMTP/IMAP transmissions.
              </p>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Contact Email Address:</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmail}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold transition"
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
