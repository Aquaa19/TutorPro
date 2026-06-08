import React, { useMemo } from 'react';
import { Calendar, Users, IndianRupee, AlertTriangle, ArrowRight, CheckCircle2, UserCheck, Plus, Sparkles } from 'lucide-react';
import { Student, Batch, Attendance, Payment } from '../types';

interface DashboardProps {
  students: Student[];
  batches: Batch[];
  attendance: Attendance[];
  payments: Payment[];
  onNavigate: (screen: string, extraData?: any) => void;
  onQuickLogPaymentOpen: () => void;
}

export default function Dashboard({
  students,
  batches,
  attendance,
  payments,
  onNavigate,
  onQuickLogPaymentOpen,
}: DashboardProps) {
  
  // Get current weekday
  const todayDay = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date('2026-06-08T11:03:15Z'); // Keep in sync with system time
    return days[d.getDay()]; // Day from system time is Mon, so "Monday"
  }, []);

  // Filter batches scheduled for today
  const todayBatches = useMemo(() => {
    return batches.filter(b => b.days.includes(todayDay));
  }, [batches, todayDay]);

  // Calculate statistics
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    
    // Fee calculations for current month (June 2026)
    const expectedJuneRevenue = activeStudents.reduce((sum, s) => sum + s.monthlyFee, 0);
    const collectedJuneRevenue = payments
      .filter(p => p.monthFor === 'June 2026' && p.status === 'paid')
      .reduce((sum, p) => sum + p.amountPaid, 0);
    const outstandingJuneRevenue = expectedJuneRevenue - collectedJuneRevenue;

    // Consecutively low attendance: calculate for all currently active students
    // Threshold < 75%
    const lowAttendanceList = activeStudents.map(s => {
      const studentAtt = attendance.filter(a => a.studentId === s.id);
      if (studentAtt.length === 0) return { student: s, rate: 100, count: 0 };
      
      const presents = studentAtt.filter(a => a.status === 'present' || a.status === 'late').length;
      const rate = Math.round((presents / studentAtt.length) * 100);
      return { student: s, rate, count: studentAtt.length };
    }).filter(item => item.count > 0 && item.rate < 75);

    // Overdue fees count: Active students who haven't paid June fees yet or previous month fees
    const pendingStudents = activeStudents.filter(s => {
      const hasJunePayment = payments.some(p => p.studentId === s.id && p.monthFor === 'June 2026' && p.status === 'paid');
      return !hasJunePayment;
    });

    return {
      totalActiveStudents: activeStudents.length,
      expectedJuneRevenue,
      collectedJuneRevenue,
      outstandingJuneRevenue,
      lowAttendanceList,
      pendingStudents,
    };
  }, [students, payments, attendance]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-dark-card border border-white/5 p-8 md:p-10 shadow-xl">
        <div className="absolute top-0 right-0 p-8 text-gold/5 pointer-events-none">
          <Sparkles className="w-48 h-48 scroll-smooth" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3.5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold/15 text-gold border border-gold/25">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
            Tutor Pro OS · Activated
          </span>
          <h1 className="text-3xl md:text-5xl font-serif italic text-white tracking-tight">
            Welcome Back, Prof. Rajesh
          </h1>
          <p className="text-slate-400 text-sm font-sans">
            Today is <strong className="text-gold font-medium">Monday, June 8, 2026</strong>. You have {todayBatches.length} batches scheduled for today. Ready for your lectures?
          </p>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-dark-card border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Active Enrolled</p>
            <h3 className="text-2xl font-serif italic font-medium text-white">{stats.totalActiveStudents} Students</h3>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Across {batches.length} active cohorts</p>
          </div>
          <div className="p-3 bg-white/5 text-gold rounded-xl border border-white/10">
            <Users className="w-5 h-5 opacity-80" />
          </div>
        </div>

        <div className="bg-dark-card border border-white/5 p-6 rounded-3xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] opacity-40 uppercase tracking-widest mb-1">June Collections</p>
            <h3 className="text-2xl font-serif italic font-medium text-emerald-400">₹{stats.collectedJuneRevenue}</h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
              Outstanding: <strong className="text-white">₹{stats.outstandingJuneRevenue}</strong>
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-dark-card border border-white/5 p-6 rounded-3xl col-span-1 sm:col-span-2 lg:col-span-1 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Attention Alerts</p>
            <h3 className="text-2xl font-serif italic font-medium text-amber-500">
              {stats.pendingStudents.length + stats.lowAttendanceList.length} Items
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
              Fees pending: <strong className="text-white">{stats.pendingStudents.length}</strong>
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl">
        <h2 className="text-[10px] opacity-40 uppercase tracking-widest mb-4 font-semibold">Quick Action Dock</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('attendance')}
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:-translate-y-0.5 group transition-all cursor-pointer text-center"
          >
            <div className="p-3 bg-white/5 text-gold rounded-xl group-hover:bg-gold group-hover:text-dark-bg transition-all mb-3.5">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Mark attendance</span>
            <span className="text-[9px] opacity-40 uppercase tracking-wide mt-1">Roll roster log</span>
          </button>

          <button
            onClick={onQuickLogPaymentOpen}
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:-translate-y-0.5 group transition-all cursor-pointer text-center"
          >
            <div className="p-3 bg-white/5 text-gold rounded-xl group-hover:bg-gold group-hover:text-dark-bg transition-all mb-3.5">
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Log payment</span>
            <span className="text-[9px] opacity-40 uppercase tracking-wide mt-1">Direct invoice fee</span>
          </button>

          <button
            onClick={() => onNavigate('students', { openAddStudent: true })}
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:-translate-y-0.5 group transition-all cursor-pointer text-center"
          >
            <div className="p-3 bg-white/5 text-gold rounded-xl group-hover:bg-gold group-hover:text-dark-bg transition-all mb-3.5">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Add batch pupil</span>
            <span className="text-[9px] opacity-40 uppercase tracking-wide mt-1">New registration</span>
          </button>

          <button
            onClick={() => onNavigate('fees')}
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:-translate-y-0.5 group transition-all cursor-pointer text-center"
          >
            <div className="p-3 bg-white/5 text-gold rounded-xl group-hover:bg-gold group-hover:text-dark-bg transition-all mb-3.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">View due lists</span>
            <span className="text-[9px] opacity-40 uppercase tracking-wide mt-1">Collections review</span>
          </button>
        </div>
      </div>

      {/* Middle Grid - Today's Schedule & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule (Cron List) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#d4af37]">Today's Schedule ({todayDay})</h3>
            <span className="text-[10px] px-3 py-1 bg-white/5 rounded-full uppercase tracking-wider text-slate-400">{todayBatches.length} Sessions Remaining</span>
          </div>

          <div className="space-y-4">
            {todayBatches.length === 0 ? (
              <div className="bg-dark-card border border-white/5 rounded-3xl p-8 text-center text-slate-450">
                <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="font-serif italic text-white text-base">No Sessions for Today</p>
                <p className="text-xs text-slate-500 mt-1">Enjoy your free day or adjust settings in the master control panel.</p>
              </div>
            ) : (
              todayBatches.map(b => {
                const batchStudents = students.filter(s => s.batchId === b.id && s.status === 'active');
                return (
                  <div
                    key={b.id}
                    className="group bg-dark-card hover:bg-white/[0.03] border border-white/5 hover:border-white/10 p-5 rounded-2xl shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/10">
                          {b.subject}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{b.timing}</span>
                      </div>
                      <h4 className="text-lg font-serif italic text-white leading-tight">
                        {b.name} · <span className="text-xs font-sans not-italic text-gold opacity-80">Apex cohort</span>
                      </h4>
                      <p className="text-xs text-slate-500 font-sans">
                        {batchStudents.length} Students enrolled in this batch roster
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onNavigate('attendance', { preselectedBatchId: b.id })}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gold text-dark-bg cursor-pointer hover:bg-gold-light text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Mark Attendance
                      </button>
                      <button
                        onClick={() => onNavigate('students', { batchId: b.id })}
                        className="p-2.5 rounded-lg border border-white/5 bg-white/5 text-slate-305 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
                        title="View Group"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Alerts & Warnings Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#d4af37]">Alerts Log</h3>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          
          <div className="space-y-4">
            {/* Low Attendance Alert */}
            <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono font-bold tracking-widest">
                    ATTN
                  </span>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Low Attendance (&lt;75%)</h4>
                </div>
                <Users className="w-4 h-4 text-rose-450 opacity-60" />
              </div>

              {stats.lowAttendanceList.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">All active students are performing above threshold attendance levels. Good job!</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {stats.lowAttendanceList.map(item => (
                    <div
                      key={item.student.id}
                      onClick={() => onNavigate('student-profile', { studentId: item.student.id })}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 cursor-pointer transition-all"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-[120px]">{item.student.name}</p>
                        <p className="text-[9px] text-[#d4af37] tracking-lighter mt-0.5 uppercase">{item.student.grade}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-xs font-bold text-rose-400 font-mono">
                          {item.rate}%
                        </span>
                        <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Attn rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fees Pending Alert */}
            <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold tracking-widest">
                    DUE
                  </span>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Pending June Fees</h4>
                </div>
                <IndianRupee className="w-4 h-4 text-emerald-400 opacity-60" />
              </div>

              {stats.pendingStudents.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">All monthly fee collections are fully up to date for June 2026!</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {stats.pendingStudents.slice(0, 4).map(s => (
                    <div
                      key={s.id}
                      onClick={() => onNavigate('student-profile', { studentId: s.id, tabIndex: 2 })} // Ledger tab
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 cursor-pointer transition-all"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-[120px]">{s.name}</p>
                        <p className="text-[9px] text-slate-500 tracking-lighter mt-0.5 uppercase">{s.grade}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-xs font-bold text-gold font-mono">
                          ₹{s.monthlyFee}
                        </span>
                        <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Due limit</p>
                      </div>
                    </div>
                  ))}
                  {stats.pendingStudents.length > 4 && (
                    <button
                      onClick={() => onNavigate('fees')}
                      className="w-full text-center text-gold hover:text-gold-light text-[10px] font-bold uppercase tracking-widest pt-2 border-t border-white/5 transition-all"
                    >
                      + {stats.pendingStudents.length - 4} more pending. Action due.
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
