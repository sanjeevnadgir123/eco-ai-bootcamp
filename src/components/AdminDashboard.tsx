import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  Eye, 
  Users, 
  IndianRupee, 
  LogOut, 
  RefreshCw, 
  Sparkles, 
  AlertTriangle, 
  Mail, 
  Phone, 
  ArrowLeft 
} from 'lucide-react';
import { registrationService } from '../services/registrationService';
import { neonService, NeonHealthStatus } from '../services/neonService';
import { authService, AdminUser } from '../services/authService';
import { exportRegistrationsToCsv } from '../utils/csvExport';
import { StudentRegistration, PaymentStatus } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(authService.getCurrentUser());
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Detail & Action Modals
  const [selectedReg, setSelectedReg] = useState<StudentRegistration | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [neonStatus, setNeonStatus] = useState<NeonHealthStatus | null>(null);

  useEffect(() => {
    neonService.checkHealth().then(setNeonStatus);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);


  const loadData = async () => {
    setLoading(true);
    try {
      const records = await registrationService.getAllRegistrations();
      setRegistrations(records);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    setTimeout(() => {
      const res = authService.login(loginEmail, loginPassword);
      if (res.success && res.user) {
        setCurrentUser(res.user);
      } else {
        setLoginError(res.error || 'Authentication failed.');
      }
      setIsLoggingIn(false);
    }, 400);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleApprovePayment = async (id: string) => {
    setActionLoading(true);
    try {
      await registrationService.updatePaymentStatus(id, 'APPROVED');
      await loadData();
      if (selectedReg && (selectedReg.id === id || selectedReg.registrationId === id)) {
        setSelectedReg((prev) => prev ? { ...prev, paymentStatus: 'APPROVED', registrationStatus: 'CONFIRMED' } : null);
      }
      setToastMessage('Payment approved! Official invitation email sent to student.');
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err: any) {
      console.error('Approval failed:', err);
      setToastMessage(`Failed to approve payment: ${err?.message || 'Database error'}`);
      setTimeout(() => setToastMessage(''), 6000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedReg) return;
    setActionLoading(true);
    try {
      const regKey = selectedReg.registrationId || selectedReg.id;
      await registrationService.updatePaymentStatus(
        regKey,
        'REJECTED',
        rejectionReason.trim() || 'Payment details could not be verified'
      );
      setRejectModalOpen(false);
      setRejectionReason('');
      await loadData();
      setSelectedReg(null);
      setToastMessage('Payment rejected. Notification email sent to student.');
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setToastMessage(`Failed to reject payment: ${err?.message || 'Database error'}`);
      setTimeout(() => setToastMessage(''), 6000);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered registrations
  const filtered = registrations.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.fullName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.phone.includes(term) ||
      r.registrationId.toLowerCase().includes(term) ||
      (r.utrNumber && r.utrNumber.toLowerCase().includes(term));

    const matchesStatus = filterStatus === 'ALL' || r.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalRegistrations = registrations.length;
  const pendingCount = registrations.filter((r) => r.paymentStatus === 'PENDING_VERIFICATION').length;
  const approvedCount = registrations.filter((r) => r.paymentStatus === 'APPROVED').length;
  const rejectedCount = registrations.filter((r) => r.paymentStatus === 'REJECTED').length;
  const totalRevenue = registrations
    .filter((r) => r.paymentStatus === 'APPROVED')
    .reduce((acc, curr) => acc + curr.feeAmount, 0);

  // If not authenticated, render Login Form
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl border-slate-200 shadow-2xl relative bg-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] mx-auto mb-3 shadow-sm">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Administrator Portal
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ECO AI Bootcamp 2026 &bull; Department of ECE, AGMRCET
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                OFFICIAL ADMINISTRATOR EMAIL
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter official administrator email"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-cyan-500 shadow-xs placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                SECURITY PASSWORD
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter security password"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-cyan-500 shadow-xs placeholder:text-slate-400"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Log In to Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard Interface
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-sm transition-colors"
              title="Return to Public Website"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  ECO ADMIN DASHBOARD
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Logged in as <strong>{currentUser.email}</strong> &bull; AGMRCET Varur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportRegistrationsToCsv(registrations)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-cyan-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={loadData}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Refresh Registrations from Database"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-600 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="glass-card p-4.5 rounded-2xl border-slate-200/90 shadow-sm bg-white hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Total Registrations
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalRegistrations}
            </span>
          </div>

          <div className="glass-card p-4.5 rounded-2xl border-amber-200 bg-amber-50/50 shadow-sm hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
                Pending Verification
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-800 font-mono tracking-tight">
              {pendingCount}
            </span>
          </div>

          <div className="glass-card p-4.5 rounded-2xl border-emerald-200 bg-emerald-50/50 shadow-sm hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                Approved Payments
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 font-mono tracking-tight">
              {approvedCount}
            </span>
          </div>

          <div className="glass-card p-4.5 rounded-2xl border-rose-200 bg-rose-50/50 shadow-sm hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800">
                Rejected Payments
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-800 font-mono tracking-tight">
              {rejectedCount}
            </span>
          </div>

          <div className="glass-card p-4.5 rounded-2xl border-cyan-200 bg-cyan-50/50 col-span-2 sm:col-span-1 shadow-sm hover:border-cyan-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-800">
                Verified Revenue
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-800 font-mono tracking-tight">
              ₹{totalRevenue}
            </span>
          </div>
        </div>

        {/* Registrations Directory */}
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="glass-card p-4 rounded-2xl border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-white shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, phone, UTR..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500 shadow-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Registrations Table */}
          <div className="glass-card rounded-2xl border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Registration ID</th>
                    <th className="px-4 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Submitted UTR</th>
                    <th className="px-4 py-3.5">Payment Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No registration records found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {reg.registrationId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{reg.fullName}</span>
                          <span className="text-[11px] text-slate-500">{reg.email}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {reg.phone}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                          {reg.utrNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {reg.paymentStatus === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Approved
                            </span>
                          )}
                          {reg.paymentStatus === 'PENDING_VERIFICATION' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Verification
                            </span>
                          )}
                          {reg.paymentStatus === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-800">
                              <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedReg(reg)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-xs"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {reg.paymentStatus === 'PENDING_VERIFICATION' && (
                              <>
                                <button
                                  onClick={() => handleApprovePayment(reg.registrationId || reg.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold shadow-xs"
                                  title="Approve Payment"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReg(reg);
                                    setRejectModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 font-bold shadow-xs"
                                  title="Reject Payment"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReg && !rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-3xl border-slate-200 shadow-2xl relative bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h4 className="text-lg font-extrabold text-slate-900">
                Registration Verification
              </h4>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">Registration ID</span>
                  <strong className="text-slate-900 font-mono">{selectedReg.registrationId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Student Name</span>
                  <strong className="text-slate-900">{selectedReg.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Email Address</span>
                  <strong className="text-cyan-700">{selectedReg.email}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Phone Number</span>
                  <strong className="text-slate-700">{selectedReg.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Bootcamp Fee</span>
                  <strong className="text-emerald-700 font-mono">
                    ₹{selectedReg.feeAmount}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Submitted UTR</span>
                  <strong className="text-indigo-700 font-mono text-sm">{selectedReg.utrNumber || 'N/A'}</strong>
                </div>
              </div>

              {selectedReg.rejectionReason && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <strong>Rejection Reason:</strong> {selectedReg.rejectionReason}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              {selectedReg.paymentStatus === 'PENDING_VERIFICATION' && (
                <>
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-bold"
                  >
                    Reject Payment
                  </button>
                  <button
                    onClick={() => handleApprovePayment(selectedReg.registrationId || selectedReg.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                  >
                    Approve Payment (₹{selectedReg.feeAmount})
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border-rose-200 shadow-2xl space-y-4 bg-white">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Reject Registration Payment</span>
            </h4>
            <p className="text-xs text-slate-600">
              Please enter the official reason for rejecting UTR reference <strong>{selectedReg.utrNumber}</strong>:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Transaction reference not found in bank statement, amount mismatch, etc."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-rose-400"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
