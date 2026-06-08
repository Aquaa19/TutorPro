import React, { useState, useMemo } from 'react';
import { IndianRupee, AlertTriangle, CheckCircle, Clock, Search, Filter, Share2, Plus, MessageCircle } from 'lucide-react';
import { Student, Batch, Payment, TutorProfile } from '../types';

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
      const matchPayment = payments.find(p => p.studentId === student.id && p.monthFor === selectedMonth && p.status === 'paid');
      const isPaid = !!matchPayment;
      
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
        payment: matchPayment,
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
  const triggerOverdueWhatsApp = (student: Student, days: number) => {
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
      `*Institute*: ${tutorProfile.instituteName}\n` +
      `---------------------------\n` +
      `Dear Parent,\n` +
      `This is a gentle reminder that the tuition fee of *₹${student.monthlyFee}* for *${student.name}* for the month of *${selectedMonth}* is overdue by *${days} days* (Due Date: ${suffix} of month).\n\n` +
      `Kindly complete the payment using UPI ID: *${tutorProfile.upiId}* or via cash as soon as possible.\n\n` +
      `If you have already paid, please ignore this or send a screenshot of the receipt.\n\n` +
      `Thank you!\nProf. Rajesh Kumar`;
      
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
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gold" />
          Collections & Due Ledger ({selectedMonth})
        </h3>

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
                    item.isPaid 
                      ? 'border-emerald-500/10 bg-gradient-to-br from-dark-card to-emerald-500/[0.02] hover:border-emerald-500/20' 
                      : 'border-white/5 bg-gradient-to-br from-dark-card to-rose-500/[0.01] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-serif italic text-white">{item.student.name}</h4>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border uppercase tracking-wider ${
                          item.isPaid 
                            ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {item.isPaid ? 'PAID' : 'PENDING'}
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
                      {item.isPaid ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Logged: {item.payment?.date}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                          Overdue: <strong className="text-white text-xs font-semibold">{item.daysLate} days</strong>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!item.isPaid ? (
                        <>
                          <button
                            onClick={() => triggerOverdueWhatsApp(item.student, item.daysLate)}
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
                          <button
                            onClick={() => {
                              const text = `*TUITION FEE RECEIPT*\n` +
                                `---------------------------\n` +
                                `*Institute*: ${tutorProfile.instituteName}\n` +
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
                            Receipt WhatsApp
                          </button>
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
    </div>
  );
}
