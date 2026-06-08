import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, CheckSquare, Users, Sparkles, MessageCircle, AlertTriangle, CheckCircle, Lock, Unlock } from 'lucide-react';
import { Student, Batch, Attendance } from '../types';

interface AttendanceTrackerProps {
  students: Student[];
  batches: Batch[];
  attendance: Attendance[];
  onSaveAttendance: (attendances: Omit<Attendance, 'id'>[]) => void;
  preselectedBatchId?: string;
}

export default function AttendanceTracker({
  students,
  batches,
  attendance,
  onSaveAttendance,
  preselectedBatchId,
}: AttendanceTrackerProps) {
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedRecords, setMarkedRecords] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [unlockedOverrides, setUnlockedOverrides] = useState<Record<string, boolean>>({});

  // Find students belonging to current batch and are active
  const activeStudents = useMemo(() => {
    if (!selectedBatchId) return [];
    return students.filter(s => s.batchId === selectedBatchId && s.status === 'active');
  }, [students, selectedBatchId]);

  const alreadyMarkedStudentIds = useMemo(() => {
    if (!selectedBatchId || !selectedDate) return new Set<string>();
    const matched = new Set<string>();
    activeStudents.forEach(s => {
      const match = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
      if (match) {
        matched.add(s.id);
      }
    });
    return matched;
  }, [selectedBatchId, selectedDate, activeStudents, attendance]);

  // Reset unlocked states when date or batch changes
  useEffect(() => {
    setUnlockedOverrides({});
  }, [selectedDate, selectedBatchId]);

  // Set default batch selection if passed down from Dashboard
  useEffect(() => {
    if (preselectedBatchId) {
      setSelectedBatchId(preselectedBatchId);
    } else if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [preselectedBatchId, batches]);

  // Read existing attendance records for the batch/date combination to edit or check
  useEffect(() => {
    if (!selectedBatchId || !selectedDate) return;
    
    // Find already marked attendances on selectedDate for activeStudents in this batch
    const map: Record<string, 'present' | 'absent' | 'late'> = {};
    activeStudents.forEach(s => {
      const match = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
      if (match) {
        map[s.id] = match.status;
      } else {
        map[s.id] = 'present'; // Default to "Present" for fast workflow!
      }
    });
    setMarkedRecords(map);
  }, [selectedBatchId, selectedDate, activeStudents, attendance]);

  const handleToggleStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setMarkedRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const nextMap = { ...markedRecords };
    activeStudents.forEach(s => {
      nextMap[s.id] = 'present';
    });
    setMarkedRecords(nextMap);
  };

  const handleSave = () => {
    if (activeStudents.length === 0) return;

    const list: Omit<Attendance, 'id'>[] = activeStudents.map(s => ({
      studentId: s.id,
      date: selectedDate,
      status: markedRecords[s.id] || 'present'
    }));

    onSaveAttendance(list);
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
    }, 3000);
  };

  // WhatsApp helper absentees dispatch
  const notifyAbsent = (student: Student) => {
    const formattedPhone = student.parentPhone.replace(/[^0-9+]/g, '');
    const text = `Dear Parent,\n\nPlease note that *${student.name}* was marked *ABSENT* for our scheduled class on *${selectedDate}*.\n\nKindly check or let me know if there was a scheduling conflict.\n\nBest Regards,\nProf. Rajesh Kumar`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const notifyLate = (student: Student) => {
    const formattedPhone = student.parentPhone.replace(/[^0-9+]/g, '');
    const text = `Dear Parent,\n\nPlease note that *${student.name}* arrived *LATE* for our scheduled class on *${selectedDate}*.\n\nWe encourage timely attendance to avoid missing core lecture chapters.\n\nBest Regards,\nProf. Rajesh Kumar`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const markedCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    Object.values(markedRecords).forEach(v => {
      if (v === 'present') present++;
      if (v === 'absent') absent++;
      if (v === 'late') late++;
    });
    return { present, absent, late };
  }, [markedRecords]);

  return (
    <div className="space-y-6">
      {/* Upper header title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight">Attendance Log</h1>
        <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Mark presents, lates or absents in seconds</p>
      </div>

      {/* Batch Select and Date configuration Row */}
      <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Target Batch</label>
          <select
            value={selectedBatchId}
            onChange={e => setSelectedBatchId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03]  rounded-xl text-white font-sans outline-none cursor-pointer"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id} className="bg-[#121318]">
                {b.name} ({b.timing})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Calendar Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03]  rounded-xl text-white font-mono outline-none"
          />
        </div>

        <div className="flex sm:col-span-2 md:col-span-1 justify-end sm:justify-start md:justify-end">
          {activeStudents.length > 0 && (
            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            >
              Mark All Present
            </button>
          )}
        </div>
      </div>

      {/* Grid of Students with instant Tap toggle indicators */}
      {selectedBatchId && activeStudents.length === 0 ? (
        <div className="bg-dark-card border border-white/5 rounded-3xl p-12 text-center text-slate-500 shadow-xl">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-serif italic text-white text-base">No active students enrolled in this batch group.</p>
          <p className="text-xs text-slate-500 mt-1">First enroll students and assign them to this batch in Student Directory.</p>
        </div>
      ) : (
        selectedBatchId && (
          <div className="space-y-6">
            {/* Marked status preview bar */}
            <div className="bg-dark-card border border-white/5 px-6 py-4 rounded-3xl flex flex-wrap justify-between items-center gap-4 text-xs font-mono shadow-xl">
              <div className="flex gap-4">
                <span className="text-slate-400">Marked roster:</span>
                <span className="text-emerald-400 font-bold">{markedCounts.present} Present</span>
                <span className="text-amber-500 font-bold">{markedCounts.late} Late</span>
                <span className="text-rose-400 font-bold">{markedCounts.absent} Absent</span>
              </div>
              <span className="text-slate-500">{activeStudents.length} Students Total</span>
            </div>

            {/* Students roster rows */}
            <div className="bg-dark-card border border-white/5 rounded-3xl divide-y divide-[#22242a] overflow-hidden shadow-xl">
              {activeStudents.map(student => {
                const currentStatus = markedRecords[student.id] || 'present';
                return (
                  <div
                    key={student.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors"
                  >
                    {/* Student Basic details */}
                    <div className="space-y-1">
                      <h4 className="text-base font-serif italic text-white tracking-tight">{student.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">Parent Link: {student.parentPhone} • {student.grade}</p>
                    </div>

                    {/* Checkbox state selectors */}
                    <div className="flex flex-wrap items-center gap-2">
                      {alreadyMarkedStudentIds.has(student.id) && (
                        <button
                          type="button"
                          onClick={() => {
                            setUnlockedOverrides(prev => ({
                              ...prev,
                              [student.id]: !prev[student.id]
                            }));
                          }}
                          className={`p-1.5 px-2.5 rounded-lg border text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer select-none ${
                            (alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id])
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={(alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]) ? "Unlock to make changes" : "Lock row"}
                        >
                          {(alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]) ? (
                            <>
                              <Lock className="w-3 h-3" />
                              Locked
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              Unlocked
                            </>
                          )}
                        </button>
                      )}

                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => handleToggleStatus(student.id, 'present')}
                          disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                            currentStatus === 'present'
                              ? 'bg-emerald-550/15 text-emerald-400 shadow-sm border border-emerald-500/20'
                              : 'text-slate-400 hover:text-white border border-transparent'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student.id, 'late')}
                          disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                            currentStatus === 'late'
                              ? 'bg-amber-500/15 text-amber-500 shadow-sm border border-amber-500/20'
                              : 'text-slate-400 hover:text-white border border-transparent'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student.id, 'absent')}
                          disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                            currentStatus === 'absent'
                              ? 'bg-rose-500/15 text-rose-450 shadow-sm border border-rose-500/20'
                              : 'text-slate-400 hover:text-white border border-transparent'
                          }`}
                        >
                          Absent
                        </button>
                      </div>

                      {/* Absent Parent Notify button shortcut */}
                      {currentStatus === 'absent' && (
                        <button
                          onClick={() => notifyAbsent(student)}
                          className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          title="WhatsApp absent parent alert"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Late Parent Notify button shortcut */}
                      {currentStatus === 'late' && (
                        <button
                          onClick={() => notifyLate(student)}
                          className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                          title="WhatsApp tardy parent alert"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save & Feedback Panel */}
            <div className="flex items-center justify-between">
              <div>
                {showSavedFeedback ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-pulse">
                    <CheckSquare className="w-4 h-4" />
                    Roster successfully updated in cloud database.
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Markings are saved securely to your Firestore database.</p>
                )}
              </div>
              
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-gold text-dark-bg hover:bg-gold-light cursor-pointer font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all active:scale-95"
              >
                Save Attendance Sheet
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
