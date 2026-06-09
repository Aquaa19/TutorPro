import React, { useState, useMemo } from 'react';
import { IndianRupee, AlertTriangle, CheckCircle, Clock, Search, Filter, Share2, Plus, MessageCircle, X, Printer } from 'lucide-react';
import { Student, Batch, Payment, TutorProfile } from '../types';
import { printInvoice } from '../utils/printInvoice';

interface FeeManagementProps {
  students: Student[];
  batches: Batch[];
  payments: Payment[];
  tutorProfile: TutorProfile;
  onRecordPayment: (payment: Omit<Payment, 'id'>) => void;
  openLogPaymentDirectly?: boolean;
}

export default function FeeManagement({
  students,
  batches,
  payments,
  tutorProfile,
  onRecordPayment,
  openLogPaymentDirectly = false,
}: FeeManagementProps) {
  const [selectedMonth, setSelectedMonth] = useState('June 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'overdue'>('all');
  
  // Payment Logging Modal states
  const [isLoggingPayment, setIsLoggingPayment] = useState(openLogPaymentDirectly);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Bulk reminders state
  const [isBulkPanelOpen, setIsBulkPanelOpen] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<Array<{ student: Student; daysLate: number; outstandingAmount: number; status: 'queued' | 'sent' | 'skipped'; checked: boolean }>>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  const handleOpenBulkReminders = () => {
    const unpaidItems = studentsFeeStatusList
      .filter(item => !item.isPaid)
      .map(item => ({
        student: item.student,
        daysLate: item.daysLate,
        outstandingAmount: item.outstandingAmount,
        status: 'queued' as const,
        checked: true
      }));
    setBulkQueue(unpaidItems);
    setCurrentQueueIndex(0);
    setIsBulkPanelOpen(true);
  };

  // Current statistics calculation
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    const totalExpected = activeStudents.reduce((sum, s) => sum + s.monthlyFee, 0);
    
    const totalCollected = payments
      .filter(p => p.monthFor === selectedMonth && p.status === 'paid')
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const totalOutstanding = totalExpected - totalCollected;
    const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100;

    return {
      totalExpected,
      totalCollected,
      totalOutstanding,
      collectionPercentage,
    };
  }, [students, payments, selectedMonth]);

  // Compute fee statuses for each student for the selectedMonth
  const studentsFeeStatusList = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    
    // Custom deadline simulation: 1st of each month
    // Today is June 8, 2026.
    const today = new Date('2026-06-08T11:03:15Z');
    
    return activeStudents.map(student => {
      const studentMonthPayments = payments.filter(p => p.studentId === student.id && p.monthFor === selectedMonth && p.status === 'paid');
      const totalPaid = studentMonthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const isPaid = totalPaid >= student.monthlyFee;
      
      let paymentStatus: 'paid' | 'half_paid' | 'partially_paid' | 'unpaid' = 'unpaid';
      if (totalPaid <= 0) {
        paymentStatus = 'unpaid';
      } else if (totalPaid >= student.monthlyFee) {
        paymentStatus = 'paid';
      } else if (totalPaid === student.monthlyFee / 2) {
        paymentStatus = 'half_paid';
      } else {
        paymentStatus = 'partially_paid';
      }

      const outstandingAmount = Math.max(0, student.monthlyFee - totalPaid);
      const latestPayment = studentMonthPayments.sort((a,b) => b.date.localeCompare(a.date))[0];
      
      // Calculate days late:
      // Deadline is now the custom billing start day of the selected month
      let daysLate = 0;
      if (!isPaid) {
        try {
          const [monthName, yearStr] = selectedMonth.split(' ');
          const billingDay = student.billingDay || 1;
          const deadline = new Date(`${monthName} ${billingDay}, ${yearStr}`);
          const diffTime = today.getTime() - deadline.getTime();
          daysLate = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        } catch (err) {
          daysLate = 7;
        }
      }

      return {
        student,
        isPaid,
        paymentStatus,
        totalPaid,
        outstandingAmount,
        payment: latestPayment,
        daysLate,
      };
    }).filter(item => {
      const bMatchesSearch = item.student.name.toLowerCase().includes(searchQuery.toLowerCase());
      const bMatchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'paid' 
        ? item.isPaid 
        : !item.isPaid;
      return bMatchesSearch && bMatchesStatus;
    }).sort((a,b) => b.daysLate - a.daysLate); // Overdue students sorting first
  }, [students, payments, selectedMonth, searchQuery, statusFilter]);

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !payAmount) {
      alert("Please check that Student name is selected and Amount is entered.");
      return;
    }

    onRecordPayment({
      studentId: selectedStudentId,
      amountPaid: Number(payAmount),
      date: payDate,
      monthFor: selectedMonth,
      mode: payMode,
      status: 'paid'
    });

    // Reset forms
    setSelectedStudentId('');
    setPayAmount('');
    setIsLoggingPayment(false);
  };

  // Preset core fee when student is selected
  const handleStudentSelectInForm = (studentId: string) => {
    setSelectedStudentId(studentId);
    const targetStudent = students.find(s => s.id === studentId);
    if (targetStudent) {
      setPayAmount(targetStudent.monthlyFee.toString());
    }
  };

  // WhatsApp reminder helpers
  const triggerOverdueWhatsApp = (student: Student, days: number, outstandingAmount: number) => {
    const formattedPhone = student.parentPhone.replace(/[^0-9+]/g, '');
    const billingDay = student.billingDay || 1;
    const suffix = billingDay === 1 || billingDay === 21 || billingDay === 31 
      ? '1st' 
      : billingDay === 2 || billingDay === 22 
      ? '2nd' 
      : billingDay === 3 || billingDay === 23 
      ? '3rd' 
      : `${billingDay}th`;

    const text = `*FEE DUE REMINDER*\n` +
      (tutorProfile.instituteName ? `*Institute*: ${tutorProfile.instituteName}\n` : '') +
      `---------------------------\n` +
      `Dear Parent,\n` +
      `This is a gentle reminder that the tuition fee for *${student.name}* for the month of *${selectedMonth}* is overdue. \n\n` +
      `• *Monthly Tuition Rate*: ₹${student.monthlyFee}\n` +
      `• *Outstanding Balance*: *₹${outstandingAmount}*\n` +
      `• *Days Overdue*: ${days} days (Due Date: ${suffix} of month)\n\n` +
      `Kindly complete the outstanding payment of *₹${outstandingAmount}* ${tutorProfile.upiId ? `using UPI ID: *${tutorProfile.upiId}* or via cash` : 'via cash or online transfer'} as soon as possible.\n\n` +
      `If you have already paid, please ignore this or send a screenshot of the receipt.\n\n` +
      `Thank you!\n${tutorProfile.name}`;
      
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };  return (
    <div className="space-y-6">
      {/* Header section with Payment Logging trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight">Finances & Fee Ledger</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Aesthetic collections tracking & dues lists</p>
        </div>

        <button
          onClick={() => {
            setIsLoggingPayment(true);
            setSelectedStudentId('');
            setPayAmount('');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gold text-dark-bg hover:bg-gold-light cursor-pointer font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Payment Ledger
        </button>
      </div>

      {/* Stats Board for month select */}
      <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-305">Monthly Revenue Snapshot</h2>
          <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white outline-none border-none pr-1.5 cursor-pointer font-sans"
            >
              <option value="June 2026" className="bg-[#121318]">June 2026 (Current)</option>
              <option value="May 2026" className="bg-[#121318]">May 2026</option>
              <option value="April 2026" className="bg-[#121318]">April 2026</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 border-t border-white/5 pt-5">
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Paid & Collected</p>
            <p className="text-3xl font-serif italic text-emerald-400">
              ₹{stats.totalCollected}
            </p>
            <p className="text-[10px] text-slate-400">
              Collection progress rate: <strong className="text-white font-medium">{stats.collectionPercentage}%</strong>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Overdue & Outstanding</p>
            <p className="text-3xl font-serif italic text-rose-455">
              ₹{stats.totalOutstanding}
            </p>
            <p className="text-[10px] text-slate-405">Pending student payments</p>
          </div>

          <div className="sm:col-span-2 md:col-span-1 space-y-2.5 self-center">
            <div className="w-full bg-[#1b1c22] rounded-full h-2 overflow-hidden border border-white/5">
              <div 
                className="h-2 rounded-full bg-emerald-400" 
                style={{ width: `${stats.collectionPercentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 font-mono text-right uppercase tracking-wider">Expected: ₹{stats.totalExpected}</p>
          </div>
        </div>
      </div>

      {/* Fee logging modal layout */}
      {isLoggingPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121318] border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <h3 className="text-base font-serif italic text-white flex items-center gap-1.5">
                <IndianRupee className="w-5 h-5 text-gold" />
                Record Payment Entry
              </h3>
              <button 
                onClick={() => setIsLoggingPayment(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-405 font-mono">Select Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={e => handleStudentSelectInForm(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white outline-none cursor-pointer"
                  required
                >
                  <option value="" className="bg-[#121318]">-- Choose student --</option>
                  {students.filter(s=>s.status==='active').map(s => (
                    <option key={s.id} value={s.id} className="bg-[#121318]">{s.name} ({s.grade} • ₹{s.monthlyFee}/m)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-405 font-mono">Month For *</label>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white outline-none cursor-pointer"
                    required
                  >
                    <option value="June 2026" className="bg-[#121318]">June 2026</option>
                    <option value="May 2026" className="bg-[#121318]">May 2026</option>
                    <option value="April 2026" className="bg-[#121318]">April 2026</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-405 font-mono">Credited Amount (INR) *</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-405 font-mono">Payment Mode *</label>
                  <select
                    value={payMode}
                    onChange={e => setPayMode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white outline-none cursor-pointer"
                    required
                  >
                    <option value="UPI" className="bg-[#121318]">UPI Transfer</option>
                    <option value="Cash" className="bg-[#121318]">Cash Handover</option>
                    <option value="Bank Transfer" className="bg-[#121318]">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-405 font-mono">Credited Date *</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsLoggingPayment(false)}
                  className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg hover:text-white text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-505 text-white font-bold rounded-lg"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Due list filters search bar */}
      <div className="bg-dark-card border border-white/5 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* State filters tab */}
        <div className="flex bg-[#121318] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg cursor-pointer transition-all ${
              statusFilter === 'all' 
                ? 'bg-white/5 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Active ({studentsFeeStatusList.length})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg cursor-pointer transition-all ${
              statusFilter === 'overdue' 
                ? 'bg-rose-500/15 text-rose-400 font-bold border border-rose-500/10' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dues Pending
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-4 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg cursor-pointer transition-all ${
              statusFilter === 'paid' 
                ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/10' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            June Paid
          </button>
        </div>

        {/* Quick search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search student names..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
          />
        </div>
      </div>

      {/* Due list view cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gold" />
            Collections & Due Ledger ({selectedMonth})
          </h3>
          {studentsFeeStatusList.some(item => !item.isPaid) && (
            <button
              onClick={handleOpenBulkReminders}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.08)] active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Bulk Reminders Dispatcher
            </button>
          )}
        </div>

        {studentsFeeStatusList.length === 0 ? (
          <div className="bg-dark-card border border-white/5 rounded-3xl p-12 text-center text-slate-550">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500/60 mb-2" />
            <p className="font-serif italic text-white text-base">No pending items found</p>
            <p className="text-xs text-slate-500 mt-1">Excellent! Roster accounts are consistent with current filter parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentsFeeStatusList.map(item => {
              const bMatch = batches.find(b => b.id === item.student.batchId);
              return (
                <div
                  key={item.student.id}
                  className={`bg-dark-card border p-6 rounded-2xl shadow-xl flex flex-col justify-between gap-4 transition-all hover:-translate-y-0.5 ${
                    item.paymentStatus === 'paid'
                      ? 'border-emerald-500/10 bg-gradient-to-br from-dark-card to-emerald-500/[0.02] hover:border-emerald-500/20' 
                      : item.paymentStatus === 'half_paid'
                      ? 'border-amber-500/10 bg-gradient-to-br from-dark-card to-amber-500/[0.02] hover:border-amber-500/20'
                      : item.paymentStatus === 'partially_paid'
                      ? 'border-yellow-500/10 bg-gradient-to-br from-dark-card to-yellow-500/[0.02] hover:border-yellow-500/20'
                      : 'border-white/5 bg-gradient-to-br from-dark-card to-rose-500/[0.01] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-serif italic text-white">{item.student.name}</h4>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border uppercase tracking-wider ${
                          item.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                            : item.paymentStatus === 'half_paid'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : item.paymentStatus === 'partially_paid'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {item.paymentStatus === 'paid'
                            ? 'PAID'
                            : item.paymentStatus === 'half_paid'
                            ? 'HALF PAID'
                            : item.paymentStatus === 'partially_paid'
                            ? 'PARTIAL PAID'
                            : 'PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.student.grade} • {item.student.subject}</p>
                      <p className="text-[10px] text-slate-500 truncate font-sans">Batch: {bMatch ? bMatch.name : 'No batch'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-serif italic text-white">₹{item.student.monthlyFee}</span>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wide">Monthly Due</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 flex-wrap gap-2">
                    <div>
                      {item.paymentStatus === 'paid' ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Logged: {item.payment?.date}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                            Dues: <strong className="text-white text-xs font-semibold">₹{item.outstandingAmount}</strong> ({item.daysLate} days late)
                          </div>
                          {item.totalPaid > 0 && (
                            <div className="text-[9px] text-slate-400 font-mono">
                              Paid so far: ₹{item.totalPaid}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!item.isPaid ? (
                        <>
                          <button
                            onClick={() => triggerOverdueWhatsApp(item.student, item.daysLate, item.outstandingAmount)}
                            className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Dispatch WhatsApp Alert"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedStudentId(item.student.id);
                              setPayAmount(item.student.monthlyFee.toString());
                              setIsLoggingPayment(true);
                            }}
                            className="px-4 py-2 bg-gold text-dark-bg hover:bg-gold-light rounded-lg text-xs font-bold uppercase tracking-widest text-[9px] cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.12)] active:scale-95 transition-all"
                          >
                            Enter Payment
                          </button>
                        </>
                      ) : (
                        item.payment && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const text = `*TUITION FEE RECEIPT*\n` +
                                  `---------------------------\n` +
                                  (tutorProfile.instituteName ? `*Institute*: ${tutorProfile.instituteName}\n` : '') +
                                  `*Tutor*: ${tutorProfile.name} (${tutorProfile.phone})\n` +
                                  `*Date*: ${item.payment?.date}\n` +
                                  `*Receipt ID*: #${item.payment?.id.slice(0, 8)}\n\n` +
                                  `Received from *${item.student.name}* a sum of *₹${item.payment?.amountPaid}* via *${item.payment?.mode}* of tuition fee for the month of *${selectedMonth}*.\n\n` +
                                  `Status: *PAID & COMPLETED*\n\n` +
                                  `Thank you!`;
                                
                                const formattedPhone = item.student.parentPhone.replace(/[^0-9+]/g, '');
                                const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
                                window.open(url, '_blank');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5 text-gold" />
                              WhatsApp
                            </button>
                            <button
                              onClick={() => {
                                if (item.payment) {
                                  printInvoice(item.student, item.payment, tutorProfile);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-350 border border-white/10 hover:bg-gold hover:text-dark-bg transition-all cursor-pointer"
                              title="Download Invoice PDF / Print"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Invoice PDF
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
        )}
      </div>

      {/* Bulk WhatsApp Reminder Queue Panel */}
      {isBulkPanelOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121318] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-lg font-serif italic text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-rose-400" />
                  Bulk WhatsApp Reminders
                </h2>
                <p className="text-xs text-slate-400 mt-1">Queue up and dispatch overdue fee notifications sequentially.</p>
              </div>
              <button
                onClick={() => setIsBulkPanelOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Queue Controls */}
              {bulkQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-500 italic">
                  No pending reminders in queue.
                </div>
              ) : (
                <>
                  {/* Progress Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Queue Progress</span>
                      <span className="text-white font-bold">
                        {bulkQueue.filter(q => q.status !== 'queued').length} / {bulkQueue.filter(q => q.checked).length} processed
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full transition-all duration-300"
                        style={{
                          width: `${(bulkQueue.filter(q => q.status !== 'queued').length / Math.max(1, bulkQueue.filter(q => q.checked).length)) * 100}%`
                        }}
                      />
                    </div>

                    {/* Active Queue Action Box */}
                    {(() => {
                      // Find first checked & queued item
                      const activeIndex = bulkQueue.findIndex((q, idx) => q.checked && q.status === 'queued' && idx >= currentQueueIndex);
                      if (activeIndex === -1) {
                        return (
                          <div className="text-center py-4 space-y-2">
                            <p className="text-xs text-emerald-450 font-semibold flex items-center justify-center gap-1.5">
                              <CheckCircle className="w-4 h-4" /> All queued reminders processed!
                            </p>
                            <button
                              onClick={() => {
                                setBulkQueue(prev => prev.map(q => ({ ...q, status: 'queued' })));
                                setCurrentQueueIndex(0);
                              }}
                              className="text-[10px] font-bold uppercase tracking-widest text-gold hover:underline cursor-pointer"
                            >
                              Restart Queue
                            </button>
                          </div>
                        );
                      }

                      const activeItem = bulkQueue[activeIndex];
                      return (
                        <div className="bg-[#0b0c10] p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <span className="inline-block text-[8px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/10 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                              Next in Queue
                            </span>
                            <h4 className="text-sm font-semibold text-white mt-1.5 truncate">{activeItem.student.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              Class: {activeItem.student.grade} • Fee: ₹{activeItem.student.monthlyFee} • Overdue: {activeItem.daysLate} days
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                // Skip active item
                                setBulkQueue(prev => prev.map((q, idx) => idx === activeIndex ? { ...q, status: 'skipped' } : q));
                                setCurrentQueueIndex(activeIndex + 1);
                              }}
                              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => {
                                // Launch WhatsApp
                                triggerOverdueWhatsApp(activeItem.student, activeItem.daysLate, activeItem.outstandingAmount);
                                setBulkQueue(prev => prev.map((q, idx) => idx === activeIndex ? { ...q, status: 'sent' } : q));
                                setCurrentQueueIndex(activeIndex + 1);
                              }}
                              className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Send WhatsApp
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Queue Table */}
                  <div className="max-h-60 overflow-y-auto border border-white/5 rounded-2xl bg-white/[0.01]">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-white/5 text-slate-400 font-mono text-[9px] uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-center w-12 bg-[#121318]">
                            <input
                              type="checkbox"
                              checked={bulkQueue.every(q => q.checked)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setBulkQueue(prev => prev.map(q => ({ ...q, checked })));
                              }}
                              className="rounded bg-black border-white/10 text-rose-500 focus:ring-rose-500"
                            />
                          </th>
                          <th className="px-4 py-3 bg-[#121318]">Student</th>
                          <th className="px-4 py-3 bg-[#121318]">Class</th>
                          <th className="px-4 py-3 bg-[#121318]">Amount Due</th>
                          <th className="px-4 py-3 bg-[#121318]">Parent Phone</th>
                          <th className="px-4 py-3 text-right bg-[#121318]">Queue Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {bulkQueue.map((item, idx) => (
                          <tr key={item.student.id} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setBulkQueue(prev => prev.map((q, i) => i === idx ? { ...q, checked } : q));
                                }}
                                className="rounded bg-black border-white/10 text-rose-500 focus:ring-rose-500"
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold text-white">{item.student.name}</td>
                            <td className="px-4 py-3 text-slate-400">{item.student.grade}</td>
                            <td className="px-4 py-3 font-mono text-gold">₹{item.student.monthlyFee}</td>
                            <td className="px-4 py-3 text-slate-450 font-mono">{item.student.parentPhone}</td>
                            <td className="px-4 py-3 text-right">
                              {item.status === 'queued' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-white/5 text-slate-400 border border-white/5 uppercase">
                                  Queued
                                </span>
                              )}
                              {item.status === 'sent' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                  ✓ Sent
                                </span>
                              )}
                              {item.status === 'skipped' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                                  Skipped
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end gap-2">
              <button
                onClick={() => setIsBulkPanelOpen(false)}
                className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-slate-400 text-xs font-semibold hover:text-white transition-all cursor-pointer"
              >
                Close Dispatcher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
