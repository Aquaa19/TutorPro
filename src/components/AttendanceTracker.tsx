import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, CheckSquare, Users, Sparkles, MessageCircle, AlertTriangle, CheckCircle, Lock, Unlock, Search, User } from 'lucide-react';
import { Student, Batch, Attendance } from '../types';
import { motion } from 'framer-motion';

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
  const [filterMode, setFilterMode] = useState<'day-wise' | 'manual'>('day-wise');
  const [manualSubMode, setManualSubMode] = useState<'batch' | 'student'>('batch');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedRecords, setMarkedRecords] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [unlockedOverrides, setUnlockedOverrides] = useState<Record<string, boolean>>({});

  // Single student manual log states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [singleStudentStatus, setSingleStudentStatus] = useState<'present' | 'absent' | 'late'>('present');

  // Sorted list of active students for individual student manual log
  const activeStudentsList = useMemo(() => {
    return students
      .filter(s => s.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  // Get the selected day of the week (e.g. "Monday", "Tuesday")
  const dayOfWeekName = useMemo(() => {
    if (!selectedDate) return '';
    return new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
  }, [selectedDate]);

  // Filter batches scheduled for the current day of the week if day-wise filtering is enabled
  const filteredBatches = useMemo(() => {
    if (filterMode === 'manual') return batches;
    return batches.filter(b => b.days && b.days.includes(dayOfWeekName));
  }, [batches, filterMode, dayOfWeekName]);

  // Find students belonging to current batch and are active
  const activeStudents = useMemo(() => {
    if (!selectedBatchId) return [];
    return students.filter(s => s.batchId === selectedBatchId && s.status === 'active');
  }, [students, selectedBatchId]);

  // Find all active students belonging to any batch scheduled for the selected day of the week
  const dayWiseStudents = useMemo(() => {
    const scheduledBatchIds = new Set(batches.filter(b => b.days && b.days.includes(dayOfWeekName)).map(b => b.id));
    return students.filter(s => scheduledBatchIds.has(s.batchId) && s.status === 'active');
  }, [students, batches, dayOfWeekName]);

  // Unified visible students list for current view mode
  const visibleStudents = useMemo(() => {
    if (filterMode === 'day-wise') {
      return dayWiseStudents;
    } else {
      return activeStudents;
    }
  }, [filterMode, dayWiseStudents, activeStudents]);

  const alreadyMarkedStudentIds = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    const matched = new Set<string>();
    visibleStudents.forEach(s => {
      const match = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
      if (match) {
        matched.add(s.id);
      }
    });
    return matched;
  }, [selectedDate, visibleStudents, attendance]);

  // Group visible students by batchId for day-wise view grouping
  const groupedStudents = useMemo(() => {
    const groups: Record<string, Student[]> = {};
    visibleStudents.forEach(s => {
      if (!groups[s.batchId]) {
        groups[s.batchId] = [];
      }
      groups[s.batchId].push(s);
    });
    return groups;
  }, [visibleStudents]);

  // List of batches actually containing visible students
  const scheduledBatches = useMemo(() => {
    const batchIdsInUse = Object.keys(groupedStudents);
    return batches
      .filter(b => batchIdsInUse.includes(b.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [batches, groupedStudents]);

  // Reset unlocked states when date or batch changes
  useEffect(() => {
    setUnlockedOverrides({});
  }, [selectedDate, selectedBatchId]);

  // Set default batch selection if passed down from Dashboard, or auto select based on filtered batches
  useEffect(() => {
    if (preselectedBatchId) {
      setSelectedBatchId(preselectedBatchId);
      const preselectedBatch = batches.find(b => b.id === preselectedBatchId);
      if (preselectedBatch) {
        const batchRunsOnSelectedDay = preselectedBatch.days && preselectedBatch.days.includes(dayOfWeekName);
        if (!batchRunsOnSelectedDay) {
          setFilterMode('manual');
        }
      }
    } else if (filterMode === 'day-wise') {
      const isStillAvailable = filteredBatches.some(b => b.id === selectedBatchId);
      if (!isStillAvailable) {
        if (filteredBatches.length > 0) {
          setSelectedBatchId(filteredBatches[0].id);
        } else {
          setSelectedBatchId('');
        }
      }
    } else {
      if (batches.length > 0 && !selectedBatchId) {
        setSelectedBatchId(batches[0].id);
      }
    }
  }, [preselectedBatchId, batches, dayOfWeekName, filterMode, filteredBatches]);

  // Check if single student already has attendance recorded for the day
  const singleStudentAlreadyMarked = useMemo(() => {
    if (!selectedStudentId || !selectedDate) return false;
    return attendance.some(a => a.studentId === selectedStudentId && a.date === selectedDate);
  }, [selectedStudentId, selectedDate, attendance]);

  // Load existing status for single student mode
  useEffect(() => {
    if (filterMode === 'manual' && manualSubMode === 'student' && selectedStudentId && selectedDate) {
      const match = attendance.find(a => a.studentId === selectedStudentId && a.date === selectedDate);
      if (match) {
        setSingleStudentStatus(match.status);
      } else {
        setSingleStudentStatus('present');
      }
    }
  }, [selectedStudentId, selectedDate, attendance, filterMode, manualSubMode]);

  // Read existing attendance records for visibleStudents/selectedDate combination
  useEffect(() => {
    if (!selectedDate) return;
    
    const map: Record<string, 'present' | 'absent' | 'late'> = {};
    visibleStudents.forEach(s => {
      const match = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
      if (match) {
        map[s.id] = match.status;
      } else {
        map[s.id] = 'present'; // Default to "Present"
      }
    });
    setMarkedRecords(map);
  }, [selectedDate, visibleStudents, attendance]);

  const handleToggleStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setMarkedRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const nextMap = { ...markedRecords };
    visibleStudents.forEach(s => {
      nextMap[s.id] = 'present';
    });
    setMarkedRecords(nextMap);
  };

  const handleSave = () => {
    if (visibleStudents.length === 0) return;

    const list: Omit<Attendance, 'id'>[] = visibleStudents.map(s => ({
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

  const handleSaveSingleStudent = () => {
    if (!selectedStudentId) return;

    const list: Omit<Attendance, 'id'>[] = [{
      studentId: selectedStudentId,
      date: selectedDate,
      status: singleStudentStatus
    }];

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
      {/* Upper header title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight">Attendance Log</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Mark presents, lates or absents in seconds</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex rounded-lg bg-white/5 p-1 self-start md:self-end border border-white/5 relative">
            <button
              onClick={() => setFilterMode('day-wise')}
              className={`relative px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors duration-250 select-none ${
                filterMode === 'day-wise' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {filterMode === 'day-wise' && (
                <motion.div
                  layoutId="attendanceFilterModePill"
                  className="absolute inset-0 bg-white/10 rounded-md shadow-xs z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Day-wise Filter</span>
            </button>
            <button
              onClick={() => setFilterMode('manual')}
              className={`relative px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors duration-250 select-none ${
                filterMode === 'manual' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {filterMode === 'manual' && (
                <motion.div
                  layoutId="attendanceFilterModePill"
                  className="absolute inset-0 bg-white/10 rounded-md shadow-xs z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Manual & Previous Logs</span>
            </button>
          </div>

          {filterMode === 'manual' && (
            <div className="flex rounded-lg bg-white/5 p-0.5 self-start md:self-end border border-white/5 relative">
              <button
                onClick={() => setManualSubMode('batch')}
                className={`relative px-3 py-1 rounded-md text-[9px] uppercase font-bold tracking-wider cursor-pointer transition-colors duration-250 select-none ${
                  manualSubMode === 'batch' ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {manualSubMode === 'batch' && (
                  <motion.div
                    layoutId="attendanceManualSubModePill"
                    className="absolute inset-0 bg-white/10 rounded-md shadow-xs z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Batch-wise Log</span>
              </button>
              <button
                onClick={() => setManualSubMode('student')}
                className={`relative px-3 py-1 rounded-md text-[9px] uppercase font-bold tracking-wider cursor-pointer transition-colors duration-250 select-none ${
                  manualSubMode === 'student' ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {manualSubMode === 'student' && (
                  <motion.div
                    layoutId="attendanceManualSubModePill"
                    className="absolute inset-0 bg-white/10 rounded-md shadow-xs z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Single Student Log</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Roster Area rendering */}
      {filterMode === 'day-wise' && filteredBatches.length === 0 ? (
        <div className="bg-dark-card border border-white/5 rounded-3xl p-12 text-center text-slate-500 shadow-xl space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-serif italic text-white text-base">No classes scheduled for {dayOfWeekName}s.</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            There are no batches configured to meet on {dayOfWeekName}s. Change your date or toggle to <strong className="text-gold">Manual & Previous Logs</strong> to register attendance manually.
          </p>
        </div>
      ) : filterMode === 'manual' && manualSubMode === 'student' ? (
        /* Single Student Log Panel */
        <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="text-gold w-4 h-4" />
              Manual Single Student Log
            </h3>
            <span className="text-[10px] font-mono text-slate-450 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
              Individual Override
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white font-sans outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121318]">-- Select Student --</option>
                {activeStudentsList.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#121318]">
                    {s.name} ({s.grade})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white font-mono outline-none"
              />
            </div>
          </div>

          {selectedStudentId && (
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-450 uppercase tracking-widest font-mono">Record State</p>
                  <div className="text-xs text-slate-400">
                    {singleStudentAlreadyMarked ? (
                      <span className="text-amber-500 font-semibold flex items-center gap-1.5 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Already logged for this date. Saving will overwrite the record.
                      </span>
                    ) : (
                      "Set this student's attendance status for the selected date."
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 relative">
                    <button
                      onClick={() => setSingleStudentStatus('present')}
                      className={`relative px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer transition-colors duration-250 select-none ${
                        singleStudentStatus === 'present' ? 'text-emerald-400 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                      }`}
                    >
                      {singleStudentStatus === 'present' && (
                        <motion.div
                          layoutId="singleStudentStatusPill"
                          className="absolute inset-0 bg-emerald-550/15 border border-emerald-500/20 rounded-lg shadow-sm z-0"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">Present</span>
                    </button>
                    <button
                      onClick={() => setSingleStudentStatus('late')}
                      className={`relative px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer transition-colors duration-250 select-none ${
                        singleStudentStatus === 'late' ? 'text-amber-500 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                      }`}
                    >
                      {singleStudentStatus === 'late' && (
                        <motion.div
                          layoutId="singleStudentStatusPill"
                          className="absolute inset-0 bg-amber-500/15 border border-amber-500/20 rounded-lg shadow-sm z-0"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">Late</span>
                    </button>
                    <button
                      onClick={() => setSingleStudentStatus('absent')}
                      className={`relative px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer transition-colors duration-250 select-none ${
                        singleStudentStatus === 'absent' ? 'text-rose-450 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                      }`}
                    >
                      {singleStudentStatus === 'absent' && (
                        <motion.div
                          layoutId="singleStudentStatusPill"
                          className="absolute inset-0 bg-rose-500/15 border border-rose-500/20 rounded-lg shadow-sm z-0"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">Absent</span>
                    </button>
                  </div>

                  {(singleStudentStatus === 'absent' || singleStudentStatus === 'late') && (
                    <button
                      onClick={() => {
                        const student = students.find(s => s.id === selectedStudentId);
                        if (student) {
                          if (singleStudentStatus === 'absent') notifyAbsent(student);
                          if (singleStudentStatus === 'late') notifyLate(student);
                        }
                      }}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                        singleStudentStatus === 'absent'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white'
                      }`}
                      title="WhatsApp parent alert shortcut"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/5 pt-5">
            <div>
              {showSavedFeedback ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-pulse">
                  <CheckCircle className="w-4 h-4" />
                  Roster successfully updated in cloud database.
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Overrides are saved directly to Firestore.</p>
              )}
            </div>
            
            <button
              onClick={handleSaveSingleStudent}
              disabled={!selectedStudentId}
              className="px-6 py-2.5 bg-gold text-dark-bg hover:bg-gold-light disabled:opacity-50 disabled:pointer-events-none cursor-pointer font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all active:scale-95"
            >
              Save Attendance Record
            </button>
          </div>
        </div>
      ) : filterMode === 'day-wise' ? (
        /* Day-wise unified list rendering */
        <div className="space-y-6 animate-fade-in">
          {/* Day-wise configuration row */}
          <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Calendar Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white font-mono outline-none"
              />
            </div>

            <div className="flex sm:col-span-2 md:col-span-2 justify-end gap-3">
              {visibleStudents.length > 0 && (
                <button
                  onClick={handleMarkAllPresent}
                  className="px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-all cursor-pointer select-none"
                >
                  Mark All Present
                </button>
              )}
            </div>
          </div>

          {/* Marked status preview bar */}
          {visibleStudents.length > 0 && (
            <div className="bg-dark-card border border-white/5 px-6 py-4 rounded-3xl flex flex-wrap justify-between items-center gap-4 text-xs font-mono shadow-xl animate-fade-in">
              <div className="flex gap-4">
                <span className="text-slate-400">Marked roster:</span>
                <span className="text-emerald-400 font-bold">{markedCounts.present} Present</span>
                <span className="text-amber-500 font-bold">{markedCounts.late} Late</span>
                <span className="text-rose-400 font-bold">{markedCounts.absent} Absent</span>
              </div>
              <span className="text-slate-500">{visibleStudents.length} Students Total</span>
            </div>
          )}

          {/* Grouped Student Rows */}
          <div className="space-y-6">
            {scheduledBatches.map(batch => {
              const batchStudents = groupedStudents[batch.id] || [];
              if (batchStudents.length === 0) return null;

              return (
                <div key={batch.id} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-1.5 h-3 bg-gold rounded-full" />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-slate-350 font-bold">
                      {batch.name} <span className="text-slate-500 font-normal">({batch.timing})</span>
                    </h3>
                  </div>

                  <div className="bg-dark-card border border-white/5 rounded-3xl divide-y divide-[#22242a] overflow-hidden shadow-xl">
                    {batchStudents.map(student => {
                      const currentStatus = markedRecords[student.id] || 'present';
                      return (
                        <div
                          key={student.id}
                          className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors"
                        >
                          <div className="space-y-1">
                            <h4 className="text-base font-serif italic text-white tracking-tight">{student.name}</h4>
                            <p className="text-xs text-slate-500 font-mono">Parent Link: {student.parentPhone} • {student.grade}</p>
                          </div>

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

                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 relative">
                              <button
                                onClick={() => handleToggleStatus(student.id, 'present')}
                                disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                                className={`relative px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-250 select-none ${
                                  currentStatus === 'present' ? 'text-emerald-400 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                                }`}
                              >
                                {currentStatus === 'present' && (
                                  <motion.div
                                    layoutId={`activeAttendancePill-${student.id}`}
                                    className="absolute inset-0 bg-emerald-555/15 border border-emerald-500/20 rounded-lg shadow-sm z-0"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                  />
                                )}
                                <span className="relative z-10">Present</span>
                              </button>
                              <button
                                onClick={() => handleToggleStatus(student.id, 'late')}
                                disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                                className={`relative px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-250 select-none ${
                                  currentStatus === 'late' ? 'text-amber-500 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                                }`}
                              >
                                {currentStatus === 'late' && (
                                  <motion.div
                                    layoutId={`activeAttendancePill-${student.id}`}
                                    className="absolute inset-0 bg-amber-500/15 border border-amber-500/20 rounded-lg shadow-sm z-0"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                  />
                                )}
                                <span className="relative z-10">Late</span>
                              </button>
                              <button
                                onClick={() => handleToggleStatus(student.id, 'absent')}
                                disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                                className={`relative px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-250 select-none ${
                                  currentStatus === 'absent' ? 'text-rose-450 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                                }`}
                              >
                                {currentStatus === 'absent' && (
                                  <motion.div
                                    layoutId={`activeAttendancePill-${student.id}`}
                                    className="absolute inset-0 bg-rose-500/15 border border-rose-500/20 rounded-lg shadow-sm z-0"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                  />
                                )}
                                <span className="relative z-10">Absent</span>
                              </button>
                            </div>

                            {currentStatus === 'absent' && (
                              <button
                                onClick={() => notifyAbsent(student)}
                                className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                                title="WhatsApp absent parent alert"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

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
                </div>
              );
            })}
          </div>

          {/* Save & Feedback Panel */}
          <div className="flex items-center justify-between border-t border-white/5 pt-5">
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
      ) : (
        /* Manual Batch-wise log view */
        <div className="space-y-6 animate-fade-in">
          {/* Batch Select and Date configuration Row */}
          <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Target Batch</label>
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03]  rounded-xl text-white font-sans outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121318]">-- Select Batch --</option>
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
                  className="px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-all cursor-pointer select-none"
                >
                  Mark All Present
                </button>
              )}
            </div>
          </div>

          {/* Grid of Students with instant Tap toggle indicators */}
          {selectedBatchId && activeStudents.length === 0 ? (
            <div className="bg-dark-card border border-white/5 rounded-3xl p-12 text-center text-slate-500 shadow-xl font-sans">
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
                    <span className="text-rose-450 font-bold">{markedCounts.absent} Absent</span>
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

                          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 relative">
                            <button
                              onClick={() => handleToggleStatus(student.id, 'present')}
                              disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                              className={`relative px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-250 select-none ${
                                currentStatus === 'present' ? 'text-emerald-400 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                              }`}
                            >
                              {currentStatus === 'present' && (
                                <motion.div
                                  layoutId={`activeAttendancePill-${student.id}`}
                                  className="absolute inset-0 bg-emerald-555/15 border border-emerald-500/20 rounded-lg shadow-sm z-0"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10">Present</span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(student.id, 'late')}
                              disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                              className={`relative px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-250 select-none ${
                                currentStatus === 'late' ? 'text-amber-500 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                              }`}
                            >
                              {currentStatus === 'late' && (
                                <motion.div
                                  layoutId={`activeAttendancePill-${student.id}`}
                                  className="absolute inset-0 bg-amber-500/15 border border-amber-500/20 rounded-lg shadow-sm z-0"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10">Late</span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(student.id, 'absent')}
                              disabled={alreadyMarkedStudentIds.has(student.id) && !unlockedOverrides[student.id]}
                              className={`relative px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-250 select-none ${
                                currentStatus === 'absent' ? 'text-rose-450 font-bold z-10' : 'text-slate-400 hover:text-white z-10'
                              }`}
                            >
                              {currentStatus === 'absent' && (
                                <motion.div
                                  layoutId={`activeAttendancePill-${student.id}`}
                                  className="absolute inset-0 bg-rose-500/15 border border-rose-500/20 rounded-lg shadow-sm z-0"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10">Absent</span>
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
      )}
    </div>
  );
}
