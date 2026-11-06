import React, { useState } from 'react';
import { Building2, Landmark, Shield, Clock, Mail, CheckCircle2, Save } from 'lucide-react';
import { Organization } from '../types';
import { api } from '../services/api';

interface OrganizationProps {
  organization: Organization | null;
  onRefresh: () => void;
}

export const OrganizationPage: React.FC<OrganizationProps> = ({ organization, onRefresh }) => {
  const [editing, setEditing] = useState(false);
  const [accountsEmail, setAccountsEmail] = useState(organization?.accounts_email || '');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!organization) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading organization profile...</div>;
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateOrganization({ accounts_email: accountsEmail });
      setNotice('Organization accounts email updated successfully.');
      setEditing(false);
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
          <h1 className="text-2xl font-bold tracking-tight text-white">{organization.name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Corporate entity profile, banking coordinates, and collections policy rules.
          </p>
        </div>

        {!editing ? (
          <button
            onClick={() => {
              setAccountsEmail(organization.accounts_email);
              setEditing(true);
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            Edit Accounts Configuration
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Profile Card */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-blue-400 border-b border-slate-800 pb-3">
            <Building2 className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-white">Legal Entity Profile</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Corporate Name:</span>
              <p className="font-semibold text-white text-sm mt-0.5">{organization.name}</p>
            </div>
            <div>
              <span className="text-slate-500">Accounts Department Email:</span>
              {editing ? (
                <input
                  type="email"
                  value={accountsEmail}
                  onChange={(e) => setAccountsEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="font-mono text-blue-400 mt-0.5">{organization.accounts_email}</p>
              )}
            </div>
            <div>
              <span className="text-slate-500">CIN / Registration No:</span>
              <p className="font-mono text-slate-300 mt-0.5">{organization.registration_number}</p>
            </div>
            <div>
              <span className="text-slate-500">GSTIN / Tax ID:</span>
              <p className="font-mono text-slate-300 mt-0.5">{organization.tax_id}</p>
            </div>
            <div>
              <span className="text-slate-500">Billing Headquarters:</span>
              <p className="text-slate-300 mt-0.5">
                {organization.billing_address.line1}, {organization.billing_address.city}, {organization.billing_address.state} - {organization.billing_address.postal_code}, {organization.billing_address.country}
              </p>
            </div>
          </div>
        </div>

        {/* Bank Account Coordinates */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
            <Landmark className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-white">Collections Bank Coordinates</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Bank Name:</span>
              <p className="font-semibold text-white text-sm mt-0.5">{organization.bank_details.bank_name}</p>
            </div>
            <div>
              <span className="text-slate-500">Beneficiary Account Name:</span>
              <p className="font-medium text-slate-200 mt-0.5">{organization.bank_details.account_name}</p>
            </div>
            <div>
              <span className="text-slate-500">Account Number:</span>
              <p className="font-mono font-bold text-slate-100 text-sm mt-0.5">{organization.bank_details.account_number}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500">IFSC Code:</span>
                <p className="font-mono text-slate-300 mt-0.5">{organization.bank_details.ifsc_code}</p>
              </div>
              <div>
                <span className="text-slate-500">SWIFT / BIC Code:</span>
                <p className="font-mono text-slate-300 mt-0.5">{organization.bank_details.swift_code}</p>
              </div>
            </div>
            {organization.bank_details.upi_id && (
              <div>
                <span className="text-slate-500">Corporate UPI VPA:</span>
                <p className="font-mono text-blue-400 mt-0.5">{organization.bank_details.upi_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Policies Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-3">
          <Shield className="w-5 h-5" />
          <h2 className="text-sm font-semibold text-white">Collections & Settlement Policies</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-semibold text-white">10% TDS Deduction (India)</div>
            <p className="text-slate-400 leading-relaxed">
              {organization.policies.tds_note}
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-semibold text-white">International Wire Charges</div>
            <p className="text-slate-400 leading-relaxed">
              {organization.policies.international_bank_charges}
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-semibold text-white">Dispute & Extension Governance</div>
            <p className="text-slate-400 leading-relaxed">
              Disputes reviewed within {organization.policies.dispute_review_window_days} business days. Extensions and installments require Accounts Team approval.
            </p>
            <div className="text-[11px] text-slate-500 pt-1 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Working Hours: {organization.policies.working_hours}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
