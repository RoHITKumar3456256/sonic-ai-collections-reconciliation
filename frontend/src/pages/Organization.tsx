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
    return <div className="text-center py-12 text-slate-400 text-xs">Loading organization profile...</div>;
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{organization.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Corporate entity profile, collections bank coordinates, and statutory settlement policies.
          </p>
        </div>

        {!editing ? (
          <button
            onClick={() => {
              setAccountsEmail(organization.accounts_email);
              setEditing(true);
            }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Edit Accounts Configuration
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold flex items-center space-x-1 shadow transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Profile Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900">Corporate Entity Profile</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Corporate Legal Name:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{organization.name}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Accounts Department Email:</span>
              {editing ? (
                <input
                  type="email"
                  value={accountsEmail}
                  onChange={(e) => setAccountsEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="font-mono font-bold text-blue-600 mt-0.5">{organization.accounts_email}</p>
              )}
            </div>
            <div>
              <span className="text-slate-400 font-medium">CIN Registration:</span>
              <p className="font-mono text-slate-700 mt-0.5">{organization.registration_number}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">GSTIN / Corporate Tax ID:</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{organization.tax_id}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Registered Address:</span>
              <p className="text-slate-700 mt-0.5 leading-relaxed">
                {organization.billing_address.line1}, {organization.billing_address.city}, {organization.billing_address.state} - {organization.billing_address.postal_code}, {organization.billing_address.country}
              </p>
            </div>
          </div>
        </div>

        {/* Bank Account Coordinates */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-emerald-600 border-b border-slate-100 pb-3">
            <Landmark className="w-5 h-5" />
            <h2 className="text-sm font-bold text-slate-900">Bank Remittance Coordinates</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Bank Name:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{organization.bank_details.bank_name}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Beneficiary Account Name:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{organization.bank_details.account_name}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Account Number:</span>
              <p className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">{organization.bank_details.account_number}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-medium">IFSC Code:</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{organization.bank_details.ifsc_code}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">SWIFT / BIC Code:</span>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{organization.bank_details.swift_code}</p>
              </div>
            </div>
            {organization.bank_details.upi_id && (
              <div>
                <span className="text-slate-400 font-medium">Corporate UPI VPA:</span>
                <p className="font-mono font-bold text-blue-600 mt-0.5">{organization.bank_details.upi_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Policies */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3">
          <Shield className="w-5 h-5" />
          <h2 className="text-sm font-bold text-slate-900">Collections & Settlement Policies</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">10% TDS Deduction (India)</div>
            <p className="text-slate-600 leading-relaxed">
              {organization.policies.tds_note}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">International Bank Charges</div>
            <p className="text-slate-600 leading-relaxed">
              {organization.policies.international_bank_charges}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="font-bold text-slate-900">Dispute & Extension Governance</div>
            <p className="text-slate-600 leading-relaxed">
              Disputes reviewed within {organization.policies.dispute_review_window_days} business days. Installments require Accounts Team written approval.
            </p>
            <div className="text-[11px] text-slate-400 pt-1 flex items-center space-x-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Hours: {organization.policies.working_hours}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
