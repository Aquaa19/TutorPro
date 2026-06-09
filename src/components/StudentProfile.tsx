import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Phone, Calendar, IndianRupee, BarChart3, TrendingUp, Award, Clock, Plus, BookOpen, Share2, Printer, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Student, Batch, Attendance, Payment, Performance, TutorProfile } from '../types';
import { printInvoice } from '../utils/printInvoice';
import { printTranscript } from '../utils/printTranscript';

interface StudentProfileProps {
  studentId: string;
  students: Student[];
  batches: Batch[];
  attendance: Attendance[];
  payments: Payment[];
  performance: Performance[];
  tutorProfile: TutorProfile;
  initialTab?: number;
  onBack: () => void;
  onRecordPayment: (payment: Omit<Payment, 'id'>) => void;
  onAddPerformance: (performance: Omit<Performance, 'id'>) => void;
  onUpdateStudentStatus: (studentId: string, status: 'active' | 'inactive') => void;
  onUpdateStudent: (student: Student) => void;
}

export default function StudentProfile({
  studentId,
  students,
  batches,
  attendance,
  payments,
  performance,
  tutorProfile,
  initialTab = 0,
  onBack,
  onRecordPayment,
  onAddPerformance,
  onUpdateStudentStatus,
  onUpdateStudent,
}: StudentProfileProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Modals for Actions inside individual profiles
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  // New Performance state
  const [testName, setTestName] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [marksObtained, setMarksObtained] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testRemarks, setTestRemarks] = useState('');

  // New Payment state
  const [payAmount, setPayAmount] = useState('');
  const [payMonth, setPayMonth] = useState('June 2026');
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // Editing profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editBillingDay, setEditBillingDay] = useState('1');
  const [editBatchId, setEditBatchId] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  const handleStartEdit = () => {
    if (!student) return;
    setEditName(student.name);
    setEditPhone(student.parentPhone);
    setEditGrade(student.grade);
    setEditSubject(student.subject);
    setEditFee(student.monthlyFee.toString());
    setEditBillingDay((student.billingDay || 1).toString());
    setEditBatchId(student.batchId);
    setEditStatus(student.status);
    setIsEditingProfile(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !onUpdateStudent) return;

    if (!editName || !editPhone || !editGrade || !editFee) {
      alert("Please fill in Student Name, Parent Phone, Class Grade and Fee.");
      return;
    }

    const bDay = Number(editBillingDay);
    if (isNaN(bDay) || bDay < 1 || bDay > 28) {
      alert("Billing Start Day must be a number between 1 and 28.");
      return;
    }

    onUpdateStudent({
      id: student.id,
      name: editName,
      parentPhone: editPhone.trim(),
      grade: editGrade,
      subject: editSubject,
      monthlyFee: Number(editFee),
      billingDay: bDay,
      enrollmentDate: student.enrollmentDate,
      batchId: editBatchId,
      status: editStatus
    });

    setIsEditingProfile(false);
  };

  // Find target student details
  const student = useMemo(() => {
    return students.find(s => s.id === studentId);
  }, [students, studentId]);

  const batch = useMemo(() => {
    if (!student) return null;
    return batches.find(b => b.id === student.batchId);
  }, [batches, student]);

  const studentAtt = useMemo(() => {
    return attendance.filter(a => a.studentId === studentId).sort((a,b) => b.date.localeCompare(a.date));
  }, [attendance, studentId]);

  const studentPayments = useMemo(() => {
    return payments.filter(p => p.studentId === studentId).sort((a,b) => b.date.localeCompare(a.date));
  }, [payments, studentId]);

  const studentPerformance = useMemo(() => {
    return performance.filter(p => p.studentId === studentId).sort((a,b) => a.date.localeCompare(b.date)); // Choronological for trends
  }, [performance, studentId]);

  if (!student) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-450">
        <p className="font-bold text-white">Student database entry not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalSessions = studentAtt.length;
    const presents = studentAtt.filter(a => a.status === 'present').length;
    const lates = studentAtt.filter(a => a.status === 'late').length;
    const absents = studentAtt.filter(a => a.status === 'absent').length;

    // Weight late as 0.75 or 1 present, but let's count presents + lates for percentage
    const attendancePercentage = totalSessions > 0 
      ? Math.round(((presents + lates) / totalSessions) * 100) 
      : 100;

    // Fees due calculation
    const getMonthPaymentStatus = (month: string) => {
      const monthPayments = studentPayments.filter(p => p.monthFor === month && p.status === 'paid');
      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      if (totalPaid <= 0) return { status: 'unpaid', totalPaid, outstanding: student.monthlyFee };
      if (totalPaid >= student.monthlyFee) return { status: 'paid', totalPaid, outstanding: 0 };
      if (totalPaid === student.monthlyFee / 2) return { status: 'half_paid', totalPaid, outstanding: student.monthlyFee / 2 };
      return { status: 'partially_paid', totalPaid, outstanding: Math.max(0, student.monthlyFee - totalPaid) };
    };

    const junePaymentInfo = getMonthPaymentStatus('June 2026');
    const mayPaymentInfo = getMonthPaymentStatus('May 2026');

    // Performance averages
    const averageScoreRate = studentPerformance.length > 0
      ? Math.round(
          (studentPerformance.reduce((sum, p) => sum + (p.marksObtained / p.totalMarks), 0) / studentPerformance.length) * 100
        )
      : null;

    return {
      totalSessions,
      presents,
      lates,
      absents,
      attendancePercentage,
      junePaymentInfo,
      mayPaymentInfo,
      averageScoreRate,
      hasJunePaid: junePaymentInfo.status === 'paid',
    };
  }, [studentAtt, studentPayments, studentPerformance, student.monthlyFee]);

  const handleCreateTestScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName || !totalMarks || !marksObtained) {
      alert("Please fill in Test Name, Total Marks and Marks Obtained.");
      return;
    }
    onAddPerformance({
      studentId,
      testName,
      totalMarks: Number(totalMarks),
      marksObtained: Number(marksObtained),
      date: testDate,
      remarks: testRemarks
    });
    setTestName('');
    setMarksObtained('');
    setTestRemarks('');
    setIsAddingTest(false);
  };

  const handleLogPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) {
      alert("Please enter the amount.");
      return;
    }
    onRecordPayment({
      studentId,
      amountPaid: Number(payAmount),
      date: payDate,
      monthFor: payMonth,
      mode: payMode,
      status: 'paid'
    });
    setPayAmount('');
    setIsLoggingPayment(false);
  };

  // WhatsApp triggers
  const sendWhatsAppUpdate = (text: string) => {
    const formattedPhone = student.parentPhone.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const whatsAppOverview = `Hello! This is ${tutorProfile.name}. Here is a quick academic update for *${student.name}*:\n\n` +
    `• *Attendance*: ${metrics.attendancePercentage}% (${metrics.presents + metrics.lates}/${metrics.totalSessions} sessions)\n` +
    `• *Fee Status for June*: ${
      metrics.junePaymentInfo.status === 'paid'
        ? 'Fully Paid'
        : metrics.junePaymentInfo.status === 'half_paid'
        ? `Half Paid (₹${metrics.junePaymentInfo.outstanding} outstanding)`
        : metrics.junePaymentInfo.status === 'partially_paid'
        ? `Partially Paid (₹${metrics.junePaymentInfo.outstanding} outstanding)`
        : `Pending (₹${student.monthlyFee} unpaid)`
    }\n` +
    `• *Latest Test Performance*: ${studentPerformance.length > 0 ? `${studentPerformance[studentPerformance.length - 1].testName}: ${studentPerformance[studentPerformance.length - 1].marksObtained}/${studentPerformance[studentPerformance.length - 1].totalMarks}` : 'N/A'}\n\n` +
    `Thank you for your continued support! Let me know if you have any questions.`;

  // Draw custom SVG Line chart for test scores
  const renderSVGChart = () => {
    if (studentPerformance.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
          Assemble scores to unlock trend graphs
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = 100; // representing score percentages scale
    const pointsCount = studentPerformance.length;

    // Convert scores to percentages and map to SVG coords
    const coordinates = studentPerformance.map((score, idx) => {
      const percentage = (score.marksObtained / score.totalMarks) * 100;
      
      // Calculate X
      const x = pointsCount > 1 
        ? paddingLeft + (idx / (pointsCount - 1)) * chartWidth 
        : paddingLeft + chartWidth / 2;
      
      // Calculate Y (inverted for SVG coordinates)
      const y = paddingTop + chartHeight - (percentage / maxVal) * chartHeight;
      return { x, y, percentage, label: score.testName, score: score.marksObtained, max: score.totalMarks };
    });

    // Make SVG Path description
    let pathD = '';
    if (coordinates.length > 0) {
      pathD = `M ${coordinates[0].x} ${coordinates[0].y}`;
      for (let i = 1; i < coordinates.length; i++) {
        pathD += ` L ${coordinates[i].x} ${coordinates[i].y}`;
      }
    }

    return (
      <div className="space-y-2">
        <div className="relative bg-slate-950 p-2.5 rounded-xl border border-slate-850 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[360px] overflow-visible">
            {/* Grid references lines */}
            {[0, 25, 50, 75, 100].map(gridVal => {
              const y = paddingTop + chartHeight - (gridVal / maxVal) * chartHeight;
              return (
                <g key={gridVal} className="opacity-40">
                  <line 
                    x1={paddingLeft} 
                    y1={y} 
                    x2={width - paddingRight} 
                    y2={y} 
                    stroke="#334155" 
                    strokeWidth="0.75" 
                    strokeDasharray="3 3"
                  />
                  <text 
                    x={paddingLeft - 8} 
                    y={y + 3} 
                    fill="#64748b" 
                    fontSize="8" 
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {gridVal}%
                  </text>
                </g>
              );
            })}

            {/* Score paths & shadow fill */}
            {coordinates.length > 1 && (
              <>
                {/* Area under line */}
                <path
                  d={`${pathD} L ${coordinates[coordinates.length - 1].x} ${paddingTop + chartHeight} L ${coordinates[0].x} ${paddingTop + chartHeight} Z`}
                  fill="url(#goldGrad)"
                  opacity="0.1"
                />
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </>
            )}

            {/* Core Line */}
            {coordinates.length > 0 && (
              <path
                d={pathD}
                fill="none"
                stroke="#d4af37"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {coordinates.map((item, idx) => (
              <g key={idx} className="group/dot cursor-pointer">
                <circle
                  cx={item.x}
                  cy={item.y}
                  r="4"
                  fill="#d4af37"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* Micro hovering circle */}
                <circle
                  cx={item.x}
                  cy={item.y}
                  r="8"
                  fill="#d4af37"
                  className="opacity-0 hover:opacity-20 transition-opacity"
                />
                {/* Micro tooltip label */}
                <text
                  x={item.x}
                  y={item.y - 8}
                  fill="#f3e5ab"
                  fontSize="7"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {Math.round(item.percentage)}%
                </text>
              </g>
            ))}

            {/* Timelines coordinates axis labels */}
            {coordinates.map((item, idx) => (
              <text
                key={idx}
                x={item.x}
                y={height - 2}
                fill="#475569"
                fontSize="7"
                textAnchor="middle"
                className="truncate select-none font-sans"
              >
                {item.label.length > 10 ? `${item.label.slice(0, 8)}..` : item.label}
              </text>
            ))}
          </svg>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>X: Exam Milestones (Chronological)</span>
          <span>Y: Score Performance Out of 100%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Upper Navigation Anchor and Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono uppercase tracking-wider cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Students directory
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartEdit}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border border-white/10 bg-white/5 text-slate-300 hover:text-gold hover:border-gold/30 cursor-pointer transition-colors"
          >
            Edit Profile
          </button>
          {/* Active status button toggle */}
          <button
            onClick={() => onUpdateStudentStatus(studentId, student.status === 'active' ? 'inactive' : 'active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border cursor-pointer transition-colors ${
              student.status === 'active'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            {student.status === 'active' ? '● ARCHIVE' : '○ ACTIVATE'}
          </button>

          <button
            onClick={() => setShowReportCardModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gold text-dark-bg hover:bg-gold-light cursor-pointer active:scale-95 transition-all uppercase tracking-widest text-[9px] shadow-[0_0_15px_rgba(212,175,55,0.15)]"
          >
            <Share2 className="w-3.5 h-3.5" />
            Report Card
          </button>
        </div>
      </div>

      {/* Head Box Card */}
      <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4.5">
          {/* Avatar initial letters */}
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xl font-bold text-gold shrink-0 tracking-widest shadow-inner font-serif italic">
            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif italic text-white tracking-tight">{student.name}</h2>
              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-bold ${
                student.status === 'active' 
                   ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                   : 'bg-white/5 text-slate-450 border border-white/5'
              }`}>
                {student.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {student.grade} • Assigned class: <strong className="text-slate-350">{batch ? batch.name : 'No batch'}</strong>
            </p>
          </div>
        </div>

        {/* Contact panel anchors */}
        <div className="flex flex-wrap gap-2.5">
          <a
            href={`tel:${student.parentPhone}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            Call Parent
          </a>
          <button
            onClick={() => sendWhatsAppUpdate(whatsAppOverview)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            WhatsApp update
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/5 overflow-x-auto scrollbar-none gap-2">
        {['Overview', 'Attendance History', 'Receipts & Ledger', 'Growth & Performance'].map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`py-3 px-4 font-sans text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === idx
                ? 'border-gold text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Context Contents */}
      {activeTab === 0 && (
        /* Tab 1: Overview Summary dashboard for individuals */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {/* Attendance rate card */}
            <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Session Attendance Rate</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-serif italic ${
                  metrics.attendancePercentage >= 85 ? 'text-emerald-400' : metrics.attendancePercentage >= 75 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {metrics.attendancePercentage}%
                </span>
                <span className="text-xs text-slate-500">of total classes</span>
              </div>
              <div className="w-full bg-[#1b1c22] rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full ${
                    metrics.attendancePercentage >= 85 ? 'bg-emerald-400' : metrics.attendancePercentage >= 75 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${Math.min(metrics.attendancePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-450 flex justify-between pt-1">
                <span>Presents: <strong>{metrics.presents}</strong></span>
                <span>Lates: <strong>{metrics.lates}</strong></span>
                <span>Absents: <strong>{metrics.absents}</strong></span>
              </div>
            </div>

             {/* Current Fee status */}
            <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">June 2026 Collection Status</span>
              <div>
                {metrics.junePaymentInfo.status === 'paid' ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PAID recepient
                    </span>
                    <p className="text-[10px] text-slate-450 mt-1">Receipt logged on {studentPayments.find(p=>p.monthFor==='June 2026')?.date}</p>
                  </div>
                ) : metrics.junePaymentInfo.status === 'half_paid' ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> HALF PAID
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Dues of <strong className="text-white">₹{metrics.junePaymentInfo.outstanding}</strong> are outstanding</p>
                    <p className="text-[10px] text-slate-450 mt-1">Paid so far: ₹{metrics.junePaymentInfo.totalPaid}</p>
                  </div>
                ) : metrics.junePaymentInfo.status === 'partially_paid' ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-bold mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> PARTIALLY PAID
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Dues of <strong className="text-white">₹{metrics.junePaymentInfo.outstanding}</strong> are outstanding</p>
                    <p className="text-[10px] text-slate-450 mt-1">Paid so far: ₹{metrics.junePaymentInfo.totalPaid}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold mt-1">
                      <AlertCircle className="w-3.5 h-3.5" /> PENDING OUTSTANDING
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Dues of <strong className="text-white">₹{student.monthlyFee}</strong> are currently unpaid</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-505 pt-2 border-t border-white/5">Standard Tuition rate: ₹{student.monthlyFee}/month (Billing Day: {student.billingDay || 1}{((d) => {
                if (d === 1 || d === 21 || d === 31) return 'st';
                if (d === 2 || d === 22) return 'nd';
                if (d === 3 || d === 23) return 'rd';
                return 'th';
              })(student.billingDay || 1)})</p>
            </div>

            {/* Average Test Performances */}
            <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl col-span-1 sm:col-span-2 md:col-span-1 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Average Exam Grades</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-serif italic ${
                  metrics.averageScoreRate === null ? 'text-slate-500' : metrics.averageScoreRate >= 85 ? 'text-cyan-400' : metrics.averageScoreRate >= 70 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {metrics.averageScoreRate !== null ? `${metrics.averageScoreRate}%` : 'N/A'}
                </span>
                <span className="text-xs text-slate-500">cumulative score</span>
              </div>
              <div className="pt-2 text-xs text-slate-400">
                Tests logged: <strong className="text-slate-200">{studentPerformance.length} milestones</strong>
              </div>
              <p className="text-[10px] text-slate-505 pt-1.5 border-t border-white/5">Target parent expectations: &gt;75% grade</p>
            </div>
          </div>

          {/* Quick Notes / Behavioral Insights */}
          <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-xs">Academic Summary & Focus Directives</h3>
            {studentPerformance.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
                    <p className="text-[10px] font-mono text-gold uppercase tracking-wider">Latest Test Remark</p>
                    <p className="text-xs text-slate-100 italic leading-relaxed">
                      "{studentPerformance[studentPerformance.length - 1].remarks || 'No remarks provided'}"
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
                    <p className="text-[10px] font-mono text-gold uppercase tracking-wider">Tutor Focus Area</p>
                    <p className="text-xs text-slate-100">
                      We are currently covering <strong className="text-white">{student.subject}</strong>. Student shows high potential, requiring minor step-by-step math derivations assistance. Recommended to continue home practices.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Add a performance score or test report on the <i>Growth & Performance</i> tab to generate automated behavioral feedback profiles.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        /* Tab 2: Attendance Registry history calendar */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Full Attendance Logs</h3>
              <p className="text-[11px] text-slate-500">A permanent log of class sessions</p>
            </div>
            
            <div className="flex gap-3 text-xs text-slate-405 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Late
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Absent
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {studentAtt.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No attendance registry logged for this student yet. Take attendance in the tracker!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {studentAtt.map(a => (
                  <div
                    key={a.id}
                    className="p-3 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-xs font-semibold text-white">{a.date}</p>
                        <p className="text-[10px] text-slate-550 font-mono">Class schedule session</p>
                      </div>
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                      a.status === 'present' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : a.status === 'late' 
                        ? 'bg-amber-500/10 text-amber-500' 
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        /* Tab 3: Fee Ledger list and payment logging */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Fee Receipts & Transaction Ledger</h3>
              <p className="text-[11px] text-slate-550">Track standard monthly fees collections</p>
            </div>
            
            <button
              onClick={() => setIsLoggingPayment(!isLoggingPayment)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Student Payment
            </button>
          </div>

          {/* Inline Log payment modal/form */}
          {isLoggingPayment && (
            <div className="bg-slate-850 border border-slate-750 rounded-xl p-5 shadow-xl animate-scale-up">
              <h4 className="text-xs font-mono font-bold text-emerald-400 mb-3.5 uppercase tracking-widest">Logging Payment Receipt for {student.name}</h4>
              <form onSubmit={handleLogPayment} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Receipt Amount Paid (INR)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder={student.monthlyFee.toString()}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-emerald-500 rounded-lg text-white font-sans outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">For Tuition Month</label>
                  <select
                    value={payMonth}
                    onChange={e => setPayMonth(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-emerald-500 rounded-lg text-white outline-none cursor-pointer"
                  >
                    <option value="June 2026">June 2026</option>
                    <option value="May 2026">May 2026</option>
                    <option value="April 2026">April 2026</option>
                    <option value="March 2026">March 2026</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={e => setPayMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-emerald-500 rounded-lg text-white outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI Payment</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-emerald-500 rounded-lg text-white font-mono outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 border-t border-slate-750 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsLoggingPayment(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Log Paid Transaction
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Fee list */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-850 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Receipt ID</th>
                    <th className="px-5 py-3">For Tuition Month</th>
                    <th className="px-5 py-3">Amount Credited</th>
                    <th className="px-5 py-3">Payment Date</th>
                    <th className="px-5 py-3">Transaction Mode</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Receipt Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {studentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-550 italic">
                        No previous financial ledger entries found for this student.
                      </td>
                    </tr>
                  ) : (
                    studentPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-850/40">
                        <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">#{p.id.slice(0, 8)}</td>
                        <td className="px-5 py-3.5 font-semibold text-white">{p.monthFor}</td>
                        <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">₹{p.amountPaid}</td>
                        <td className="px-5 py-3.5 text-slate-400">{p.date}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-450">{p.mode}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase ${
                            p.amountPaid >= student.monthlyFee
                              ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                              : p.amountPaid === student.monthlyFee / 2
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {p.amountPaid >= student.monthlyFee
                              ? 'Fully Paid'
                              : p.amountPaid === student.monthlyFee / 2
                              ? 'Half Paid'
                              : 'Partially Paid'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                const text = `*TUITION FEE RECEIPT*\n` +
                                  `---------------------------\n` +
                                  (tutorProfile.instituteName ? `*Institute*: ${tutorProfile.instituteName}\n` : '') +
                                  `*Tutor*: ${tutorProfile.name} (${tutorProfile.phone})\n` +
                                  `*Date*: ${p.date}\n` +
                                  `*Receipt ID*: #${p.id.slice(0, 8)}\n\n` +
                                  `Received with thanks from *${student.name}* a sum of *₹${p.amountPaid}* via *${p.mode}* of tuition fee for the month of *${p.monthFor}*.\n\n` +
                                  `Status: *PAID & CLOSED*\n\n` +
                                  `Thank you!`;
                                sendWhatsAppUpdate(text);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded transition-colors cursor-pointer"
                            >
                              <Share2 className="w-3 h-3" />
                              Share Receipt
                            </button>
                            <button
                              onClick={() => printInvoice(student, p, tutorProfile)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-white/5 text-slate-350 border border-white/10 hover:bg-gold hover:text-dark-bg rounded transition-all cursor-pointer"
                              title="Download PDF / Print Receipt"
                            >
                              <Printer className="w-3 h-3" />
                              PDF Receipt
                            </button>
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
      )}

      {activeTab === 3 && (
        /* Tab 4: Growth & Performance Line chart and recent tests */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Performance Trajectory & Progress Logs</h3>
              <p className="text-[11px] text-slate-550">Track chronological test scores and milestones</p>
            </div>
            
            <button
              onClick={() => setIsAddingTest(!isAddingTest)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Test Score
            </button>
          </div>

          {/* Inline Add Test score modal/form */}
          {isAddingTest && (
            <div className="bg-slate-850 border border-slate-750 rounded-xl p-5 shadow-xl animate-scale-up">
              <h4 className="text-xs font-mono font-bold text-indigo-400 mb-3.5 uppercase tracking-widest">Logging exam score for {student.name}</h4>
              <form onSubmit={handleCreateTestScore} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Test/Exam Chapter Name</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    placeholder="e.g. Quad Equations Semester Exam"
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-lg text-white font-sans outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={e => setTotalMarks(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-lg text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Marks Obtained</label>
                  <input
                    type="number"
                    value={marksObtained}
                    onChange={e => setMarksObtained(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-lg text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={e => setTestDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-lg text-white font-mono outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-5">
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Academic feedback & Remarks</label>
                  <input
                    type="text"
                    value={testRemarks}
                    onChange={e => setTestRemarks(e.target.value)}
                    placeholder="e.g. Improved solving steps, silly algebraic calculations."
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-lg text-white font-sans outline-none"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-2 border-t border-slate-750 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingTest(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Record Scoresheet
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Performance chart widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400 animate-pulse" />
              Score Trajectory Curve
            </h4>
            {renderSVGChart()}
          </div>

          {/* Test Performance historical grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-slate-450 uppercase tracking-widest">Chronological Scorecard</h4>
            
            {studentPerformance.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">No test records saved for this student yet. Log a test score above.</p>
            ) : (
              <div className="space-y-3.5">
                {studentPerformance.slice().reverse().map(perf => {
                  const rate = Math.round((perf.marksObtained / perf.totalMarks) * 100);
                  return (
                    <div
                      key={perf.id}
                      className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1 px-2 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold font-mono">
                            TEST
                          </span>
                          <span className="text-xs text-slate-450 font-mono">{perf.date}</span>
                        </div>
                        <h5 className="text-sm font-bold text-white leading-tight">{perf.testName}</h5>
                        {perf.remarks && (
                          <p className="text-xs text-slate-400 italic bg-slate-850/50 p-2 rounded-md leading-relaxed mt-1">
                            "{perf.remarks}"
                          </p>
                        )}
                      </div>

                      <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-850 pt-2.5 md:pt-0 shrink-0 select-none">
                        <div className="text-right">
                          <span className="text-lg font-bold text-white font-mono">{perf.marksObtained}</span>
                          <span className="text-slate-500 font-mono text-xs"> / {perf.totalMarks}</span>
                        </div>
                        <span className={`inline-block text-xs font-bold font-mono mt-0.5 ${
                          rate >= 85 ? 'text-cyan-400' : rate >= 70 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          ({rate}% Grade)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT CARD EXPORT MODAL DRAW */}
      {showReportCardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
            <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="text-sm font-semibold text-white">Digital Copy of Report Card</h3>
              <button 
                onClick={() => setShowReportCardModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer font-bold"
              >
                Close
              </button>
            </div>

            {/* Print Transcript container */}
            <div id="transcript-container" className="p-6 overflow-y-auto space-y-6 text-white font-sans">
              <div className="text-center space-y-1.5 border-b border-slate-800 pb-5">
                {tutorProfile.instituteName && (
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">{tutorProfile.instituteName}</span>
                )}
                <h4 className="text-lg font-bold tracking-tight text-white">Student Academic Transcript</h4>
                <p className="text-xs text-slate-450 font-mono">Date Compiled: June 8, 2026</p>
              </div>

              {/* Student and tutor details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-850/50 p-4 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <p className="text-slate-500 font-mono text-[9px] uppercase tracking-widest">Student Information</p>
                  <p className="font-bold text-white text-sm">{student.name}</p>
                  <p className="text-slate-350">{student.grade} ({student.subject})</p>
                  <p className="text-slate-400 font-mono">Phone: {student.parentPhone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-mono text-[9px] uppercase tracking-widest">Tutoring Guide Details</p>
                  <p className="font-bold text-white text-sm">{tutorProfile.name}</p>
                  <p className="text-slate-350">APEX Private Core Tutoring</p>
                  <p className="text-slate-400 font-mono">Email: {tutorProfile.email}</p>
                </div>
              </div>

              {/* Metrics block */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-850/30 rounded-lg">
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Attendance rate</p>
                  <p className="text-lg font-bold text-white font-mono mt-1">{metrics.attendancePercentage}%</p>
                  <p className="text-[9px] text-slate-405 mt-0.5">{metrics.presents}/{metrics.totalSessions} active classes</p>
                </div>
                <div className="p-3 bg-slate-850/30 rounded-lg">
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Average Academic score</p>
                  <p className="text-lg font-bold text-cyan-450 font-mono mt-1">{metrics.averageScoreRate !== null ? `${metrics.averageScoreRate}%` : 'N/A'}</p>
                  <p className="text-[9px] text-slate-405 mt-0.5">Across {studentPerformance.length} exams</p>
                </div>
                <div className="p-3 bg-slate-850/30 rounded-lg">
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Fee dues status</p>
                  <p className={`text-sm font-extrabold mt-2.5 font-mono ${metrics.hasJunePaid ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {metrics.hasJunePaid ? 'PAID & CLEAR' : 'DUES PENDING'}
                  </p>
                </div>
              </div>

              {/* Last 3 exam results summary */}
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Chronological Examination Ledger</p>
                {studentPerformance.length === 0 ? (
                  <p className="text-xs text-slate-450 italic">No exams recorded.</p>
                ) : (
                  <div className="divide-y divide-slate-850 bg-slate-850 rounded-xl overflow-hidden border border-slate-800">
                    {studentPerformance.slice(-3).map(p => (
                      <div key={p.id} className="p-3/2 px-4 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{p.testName}</p>
                          <p className="text-[10px] text-slate-500">{p.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-indigo-400">{p.marksObtained} / {p.totalMarks}</p>
                          <p className="text-[9px] text-slate-500">Score grade: {Math.round((p.marksObtained/p.totalMarks)*100)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Print and WhatsApp buttons */}
            <div className="p-5.5 border-t border-slate-800 flex flex-wrap gap-2 justify-end bg-slate-850/50">
              <button
                onClick={() => {
                  printTranscript(student, tutorProfile, metrics, studentPerformance);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Transcript
              </button>
              <button
                onClick={() => {
                  // Build a copyable summary text for WhatsApp
                  const copyText = `*ACADEMIC REPORT CARD*\n` +
                    `*Student*: ${student.name} (${student.grade})\n` +
                    (tutorProfile.instituteName ? `*Institute*: ${tutorProfile.instituteName}\n` : '') +
                    `*Tutor*: ${tutorProfile.name}\n` +
                    `---------------------------\n` +
                    `• Attendance percentage: *${metrics.attendancePercentage}%*\n` +
                    `• Fee Ledger accounts: *${metrics.hasJunePaid ? 'Paid & clear' : 'June dues pending'}*\n` +
                    `• Cumulative Academic score: *${metrics.averageScoreRate !== null ? `${metrics.averageScoreRate}%` : 'N/A'}*\n` +
                    `---------------------------\n` +
                    `_Generated on June 8, 2026. Apex Systems._`;
                    
                  sendWhatsAppUpdate(copyText);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share parents via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#16181d] border border-white/5 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-y-auto animate-scale-up">
            <div className="px-6 py-4 border-b border-[#22242a] flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Edit Student Profile</h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1.5">Student Full Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1.5">Parent WhatsApp Number *</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-mono outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1.5">Grade/Class Level *</label>
                  <select
                    value={editGrade}
                    onChange={e => setEditGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                    required
                  >
                    {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map(grade => (
                      <option key={grade} value={grade} className="bg-[#121318]">{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1.5">Standard Subject *</label>
                  <select
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                    required
                  >
                    {["Mathematics", "Physics", "Chemistry", "Biology", "Computer", "Mathematics & Computer"].map(sub => (
                      <option key={sub} value={sub} className="bg-[#121318]">{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1.5">Monthly Fees amount (INR) *</label>
                  <input
                    type="number"
                    value={editFee}
                    onChange={e => setEditFee(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1.5">Billing Start Day (1-28) *</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={editBillingDay}
                    onChange={e => setEditBillingDay(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1.5">Assign Core Batch Group *</label>
                  <select
                    value={editBatchId}
                    onChange={e => setEditBatchId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                    required
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id} className="bg-[#121318]">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1.5">Status *</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                    required
                  >
                    <option value="active" className="bg-[#121318]">Active</option>
                    <option value="inactive" className="bg-[#121318]">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#22242a]">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gold text-dark-bg hover:bg-gold-light rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
