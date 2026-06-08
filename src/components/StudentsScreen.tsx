import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, Users, Calendar, IndianRupee, Phone, ArrowUpRight, GraduationCap, Clock, Edit3, Trash2 } from 'lucide-react';
import { Student, Batch, TutorProfile } from '../types';

interface StudentsScreenProps {
  students: Student[];
  batches: Batch[];
  tutorProfile: TutorProfile;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onAddBatch: (batch: Omit<Batch, 'id'>) => void;
  onDeleteStudent?: (id: string) => void;
  onSelectStudent: (studentId: string) => void;
  onUpdateBatch?: (batch: Batch) => void;
  onDeleteBatch?: (id: string) => void;
  onUpdateStudent?: (student: Student) => void;
  extraState?: {
    openAddStudent?: boolean;
    batchId?: string;
  };
}

export default function StudentsScreen({
  students,
  batches,
  tutorProfile,
  onAddStudent,
  onAddBatch,
  onDeleteStudent,
  onSelectStudent,
  onUpdateBatch,
  onDeleteBatch,
  onUpdateStudent,
  extraState,
}: StudentsScreenProps) {
  const [viewMode, setViewMode] = useState<'batch' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('active'); // active status filter by default

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  // Form states for Student
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('+91');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentSubject, setNewStudentSubject] = useState('');
  const [newStudentFee, setNewStudentFee] = useState('');
  const [newStudentBatch, setNewStudentBatch] = useState('');
  const [newStudentBillingDay, setNewStudentBillingDay] = useState('1');

  // Form states for Editing Student
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');
  const [editStudentGrade, setEditStudentGrade] = useState('');
  const [editStudentSubject, setEditStudentSubject] = useState('');
  const [editStudentFee, setEditStudentFee] = useState('');
  const [editStudentBillingDay, setEditStudentBillingDay] = useState('1');
  const [editStudentBatch, setEditStudentBatch] = useState('');
  const [editStudentStatus, setEditStudentStatus] = useState<'active' | 'inactive'>('active');

  // Form states for Batch
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchDayTimes, setNewBatchDayTimes] = useState<{ [day: string]: { start: string; end: string } }>({});
  const [newBatchSubject, setNewBatchSubject] = useState('');
  const [newBatchDays, setNewBatchDays] = useState<string[]>([]);

  // Form states for Editing Batch
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editBatchName, setEditBatchName] = useState('');
  const [editBatchSubject, setEditBatchSubject] = useState('');
  const [editBatchDays, setEditBatchDays] = useState<string[]>([]);
  const [editBatchDayTimes, setEditBatchDayTimes] = useState<{ [day: string]: { start: string; end: string } }>({});

  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const parse12hTo24h = (time12h: string) => {
    if (!time12h) return '';
    const parts = time12h.trim().split(' ');
    if (parts.length !== 2) return '';
    const [time, modifier] = parts;
    let [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, '0')}:${minutesStr}`;
  };

  const parseTimingRange = (rangeStr: string) => {
    if (!rangeStr || !rangeStr.includes(' - ')) return { start: '', end: '' };
    const [start12, end12] = rangeStr.split(' - ');
    return {
      start: parse12hTo24h(start12),
      end: parse12hTo24h(end12)
    };
  };

  const handleStartEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setEditBatchName(batch.name);
    setEditBatchSubject(batch.subject);
    setEditBatchDays(batch.days || []);
    
    const timesMap: { [day: string]: { start: string; end: string } } = {};
    if (batch.dayTimings && batch.dayTimings.length > 0) {
      batch.dayTimings.forEach(dt => {
        timesMap[dt.day] = parseTimingRange(dt.timing);
      });
    } else if (batch.timing && batch.days) {
      if (batch.timing.includes(' | ')) {
        const parts = batch.timing.split(' | ');
        parts.forEach(p => {
          const splitPart = p.split(': ');
          if (splitPart.length === 2) {
            const dayAbbr = splitPart[0].trim();
            const timeRange = splitPart[1].trim();
            const fullDay = WEEKDAYS.find(d => d.startsWith(dayAbbr));
            if (fullDay) {
              timesMap[fullDay] = parseTimingRange(timeRange);
            }
          }
        });
      } else {
        const parsed = parseTimingRange(batch.timing);
        batch.days.forEach(day => {
          timesMap[day] = parsed;
        });
      }
    }
    setEditBatchDayTimes(timesMap);
  };

  const handleSaveBatchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch || !onUpdateBatch) return;

    const hasAllTimes = editBatchDays.every(day => editBatchDayTimes[day]?.start && editBatchDayTimes[day]?.end);
    if (!editBatchName || editBatchDays.length === 0 || !hasAllTimes) {
      alert("Please fill in Batch Name, select scheduled days, and provide start/end times for each day.");
      return;
    }

    const timingString = editBatchDays
      .map(day => {
        const { start, end } = editBatchDayTimes[day];
        return `${day.substring(0, 3)}: ${formatTimeTo12h(start)} - ${formatTimeTo12h(end)}`;
      })
      .join(' | ');

    const dayTimings = editBatchDays.map(day => {
      const { start, end } = editBatchDayTimes[day];
      return {
        day,
        timing: `${formatTimeTo12h(start)} - ${formatTimeTo12h(end)}`
      };
    });

    onUpdateBatch({
      id: editingBatch.id,
      name: editBatchName,
      timing: timingString,
      days: editBatchDays,
      subject: editBatchSubject || "Mathematics",
      dayTimings
    });

    setEditingBatch(null);
    setEditBatchName('');
    setEditBatchSubject('');
    setEditBatchDays([]);
    setEditBatchDayTimes({});
  };

  const toggleEditDaySelection = (day: string) => {
    if (editBatchDays.includes(day)) {
      setEditBatchDays(editBatchDays.filter(d => d !== day));
      const updatedTimes = { ...editBatchDayTimes };
      delete updatedTimes[day];
      setEditBatchDayTimes(updatedTimes);
    } else {
      setEditBatchDays([...editBatchDays, day]);
    }
  };

  // ICSE Science subjects only
  const availableSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer", "Mathematics & Computer"];

  // Handle outside actions triggered from dashboard
  useEffect(() => {
    if (extraState?.openAddStudent) {
      setIsAddingStudent(true);
      setViewMode('all');
    }
    if (extraState?.batchId) {
      setSelectedBatchFilter(extraState.batchId);
      setViewMode('batch');
    }
  }, [extraState]);

  const grades = useMemo(() => {
    const list = students.map(s => s.grade);
    return Array.from(new Set(list)).filter(Boolean);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.parentPhone.includes(searchQuery);
      const matchesBatch = selectedBatchFilter ? s.batchId === selectedBatchFilter : true;
      const matchesGrade = selectedGradeFilter ? s.grade === selectedGradeFilter : true;
      const matchesStatus = selectedStatusFilter === 'all' ? true : s.status === selectedStatusFilter;

      return matchesSearch && matchesBatch && matchesGrade && matchesStatus;
    });
  }, [students, searchQuery, selectedBatchFilter, selectedGradeFilter, selectedStatusFilter]);

  const formatTimeTo12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const padHours = formattedHours.toString().padStart(2, '0');
    const padMinutes = minutes.toString().padStart(2, '0');
    return `${padHours}:${padMinutes} ${ampm}`;
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentPhone || !newStudentGrade || !newStudentFee) {
      alert("Please fill in Student Name, Parent Phone, Class Grade and Fee.");
      return;
    }
    
    const bDay = Number(newStudentBillingDay);
    if (isNaN(bDay) || bDay < 1 || bDay > 28) {
      alert("Billing Start Day must be a number between 1 and 28.");
      return;
    }

    // Attempt auto-matching Subject from batch if selected
    let finalSubject = newStudentSubject;
    if (newStudentBatch && !finalSubject) {
      const matchBatch = batches.find(b => b.id === newStudentBatch);
      if (matchBatch) finalSubject = matchBatch.subject;
    }

    onAddStudent({
      name: newStudentName,
      parentPhone: newStudentPhone.trim(),
      grade: newStudentGrade,
      subject: finalSubject || "Mathematics",
      monthlyFee: Number(newStudentFee),
      billingDay: bDay,
      enrollmentDate: new Date().toISOString().split('T')[0],
      batchId: newStudentBatch || "b1", // default to first batch if none
      status: 'active'
    });

    // Reset Form
    setNewStudentName('');
    setNewStudentPhone('+91');
    setNewStudentGrade('');
    setNewStudentSubject('');
    setNewStudentFee('');
    setNewStudentBatch('');
    setNewStudentBillingDay('1');
    setIsAddingStudent(false);
  };

  const handleStartEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditStudentName(student.name);
    setEditStudentPhone(student.parentPhone);
    setEditStudentGrade(student.grade);
    setEditStudentSubject(student.subject);
    setEditStudentFee(student.monthlyFee.toString());
    setEditStudentBillingDay((student.billingDay || 1).toString());
    setEditStudentBatch(student.batchId);
    setEditStudentStatus(student.status);
    
    // Close other panels
    setIsAddingStudent(false);
    setIsAddingBatch(false);
    setEditingBatch(null);
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !onUpdateStudent) return;

    if (!editStudentName || !editStudentPhone || !editStudentGrade || !editStudentFee) {
      alert("Please fill in Student Name, Parent Phone, Class Grade and Fee.");
      return;
    }

    const bDay = Number(editStudentBillingDay);
    if (isNaN(bDay) || bDay < 1 || bDay > 28) {
      alert("Billing Start Day must be a number between 1 and 28.");
      return;
    }

    onUpdateStudent({
      id: editingStudent.id,
      name: editStudentName,
      parentPhone: editStudentPhone.trim(),
      grade: editStudentGrade,
      subject: editStudentSubject,
      monthlyFee: Number(editStudentFee),
      billingDay: bDay,
      enrollmentDate: editingStudent.enrollmentDate,
      batchId: editStudentBatch,
      status: editStudentStatus
    });

    setEditingStudent(null);
    setEditStudentName('');
    setEditStudentPhone('');
    setEditStudentGrade('');
    setEditStudentSubject('');
    setEditStudentFee('');
    setEditStudentBillingDay('1');
    setEditStudentBatch('');
    setEditStudentStatus('active');
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const hasAllTimes = newBatchDays.every(day => newBatchDayTimes[day]?.start && newBatchDayTimes[day]?.end);
    if (!newBatchName || newBatchDays.length === 0 || !hasAllTimes) {
      alert("Please fill in Batch Name, select scheduled days, and provide start/end times for each day.");
      return;
    }

    // Combined timing string: e.g. "Mon: 04:00 PM - 05:30 PM | Wed: 05:00 PM - 06:30 PM"
    const timingString = newBatchDays
      .map(day => {
        const { start, end } = newBatchDayTimes[day];
        return `${day.substring(0, 3)}: ${formatTimeTo12h(start)} - ${formatTimeTo12h(end)}`;
      })
      .join(' | ');

    const dayTimings = newBatchDays.map(day => {
      const { start, end } = newBatchDayTimes[day];
      return {
        day,
        timing: `${formatTimeTo12h(start)} - ${formatTimeTo12h(end)}`
      };
    });

    onAddBatch({
      name: newBatchName,
      timing: timingString,
      days: newBatchDays,
      subject: newBatchSubject || "Mathematics",
      dayTimings
    } as any);

    setNewBatchName('');
    setNewBatchDayTimes({});
    setNewBatchSubject('');
    setNewBatchDays([]);
    setIsAddingBatch(false);
  };

  const toggleDaySelection = (day: string) => {
    if (newBatchDays.includes(day)) {
      setNewBatchDays(newBatchDays.filter(d => d !== day));
      // Clean up timing for unselected day
      const updatedTimes = { ...newBatchDayTimes };
      delete updatedTimes[day];
      setNewBatchDayTimes(updatedTimes);
    } else {
      setNewBatchDays([...newBatchDays, day]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with quick Add buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight">Student & Batch Directory</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Manage cohorts and active pupils</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingBatch(!isAddingBatch)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <Clock className="w-3.5 h-3.5 opacity-75" />
            New Batch
          </button>
          <button
            onClick={() => setIsAddingStudent(!isAddingStudent)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-dark-bg hover:bg-gold-light cursor-pointer font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Student
          </button>
        </div>
      </div>

      {/* Add Batch Form Panel */}
      {isAddingBatch && (
        <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Create New Batch Group</h3>
            <button onClick={() => setIsAddingBatch(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>
          <form onSubmit={handleCreateBatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Batch Name (e.g. Class 11 Physics Advanced)</label>
              <input
                type="text"
                placeholder="Class 11 Physics Adv"
                value={newBatchName}
                onChange={e => setNewBatchName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Core Subject</label>
              <select
                value={newBatchSubject}
                onChange={e => setNewBatchSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                required
              >
                <option value="" className="bg-[#121318]">-- Choose Subject --</option>
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub} className="bg-[#121318]">{sub}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 font-mono mb-2">Schedule Weekly Days</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => {
                  const isSelected = newBatchDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDaySelection(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-gold/15 border-gold text-gold font-bold' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Specific Timings with Timepickers */}
            {newBatchDays.length > 0 && (
              <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3 animate-slide-down">
                <h4 className="text-xs font-semibold text-gold uppercase tracking-wider">Configure daily class timings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {newBatchDays.map(day => (
                    <div key={day} className="space-y-1.5 border-b border-white/5 pb-3.5 last:border-0 last:pb-0">
                      <span className="block text-xs font-bold text-slate-200">{day} Timing *</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[9px] text-slate-500 font-mono uppercase">Start</label>
                          <input
                            type="time"
                            value={newBatchDayTimes[day]?.start || ''}
                            onChange={e => {
                              const current = newBatchDayTimes[day] || { start: '', end: '' };
                              setNewBatchDayTimes({
                                ...newBatchDayTimes,
                                [day]: { ...current, start: e.target.value }
                              });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-lg text-white font-mono outline-none cursor-pointer"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] text-slate-500 font-mono uppercase">End</label>
                          <input
                            type="time"
                            value={newBatchDayTimes[day]?.end || ''}
                            onChange={e => {
                              const current = newBatchDayTimes[day] || { start: '', end: '' };
                              setNewBatchDayTimes({
                                ...newBatchDayTimes,
                                [day]: { ...current, end: e.target.value }
                              });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-lg text-white font-mono outline-none cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-white/5">
              <button
                type="submit"
                className="px-5 py-2 bg-gold text-dark-bg hover:bg-gold-light pointer:cursor font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all"
              >
                Create Batch Group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Student Form Panel */}
      {isAddingStudent && (
        <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Enroll New Student</h3>
            <button onClick={() => setIsAddingStudent(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>
          <form onSubmit={handleCreateStudent} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Student Full Name</label>
              <input
                type="text"
                placeholder="Amit Sharma"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Parent WhatsApp Number (+91...)</label>
              <input
                type="tel"
                placeholder="+919876543210"
                value={newStudentPhone}
                onChange={e => setNewStudentPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-mono outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Grade/Class Level *</label>
              <select
                value={newStudentGrade}
                onChange={e => setNewStudentGrade(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                required
              >
                <option value="" className="bg-[#121318]">-- Choose Grade/Class --</option>
                {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map(grade => (
                  <option key={grade} value={grade} className="bg-[#121318]">{grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Standard Subject (or leave empty to match Batch)</label>
              <select
                value={newStudentSubject}
                onChange={e => setNewStudentSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
              >
                <option value="" className="bg-[#121318]">-- Choose Subject --</option>
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub} className="bg-[#121318]">{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Monthly Fees amount (INR)</label>
              <input
                type="number"
                placeholder="2500"
                value={newStudentFee}
                onChange={e => setNewStudentFee(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Billing Start Day (1-28)</label>
              <input
                type="number"
                min="1"
                max="28"
                placeholder="1"
                value={newStudentBillingDay}
                onChange={e => setNewStudentBillingDay(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Assign Core Batch Group</label>
              <select
                value={newStudentBatch}
                onChange={e => setNewStudentBatch(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none transition-colors cursor-pointer"
                required
              >
                <option value="" className="bg-[#121318]">-- Choose Batch Group --</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id} className="bg-[#121318]">
                    {b.name} ({b.timing})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-4 border-t border-white/5">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-505 text-white active:scale-95 pointer:cursor font-bold uppercase tracking-widest text-[10px] rounded-lg transition-all"
              >
                Enroll student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Student Form Panel */}
      {editingStudent && (
        <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Edit Student: {editingStudent.name}</h3>
            <button onClick={() => setEditingStudent(null)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>
          <form onSubmit={handleSaveStudentEdit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Student Full Name *</label>
              <input
                type="text"
                value={editStudentName}
                onChange={e => setEditStudentName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Parent WhatsApp Number *</label>
              <input
                type="tel"
                value={editStudentPhone}
                onChange={e => setEditStudentPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-mono outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Grade/Class Level *</label>
              <select
                value={editStudentGrade}
                onChange={e => setEditStudentGrade(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                required
              >
                <option value="" className="bg-[#121318]">-- Choose Grade/Class --</option>
                {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map(grade => (
                  <option key={grade} value={grade} className="bg-[#121318]">{grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Standard Subject *</label>
              <select
                value={editStudentSubject}
                onChange={e => setEditStudentSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                required
              >
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub} className="bg-[#121318]">{sub}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Monthly Fees amount (INR) *</label>
              <input
                type="number"
                value={editStudentFee}
                onChange={e => setEditStudentFee(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Billing Start Day (1-28) *</label>
              <input
                type="number"
                min="1"
                max="28"
                value={editStudentBillingDay}
                onChange={e => setEditStudentBillingDay(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Assign Core Batch Group *</label>
              <select
                value={editStudentBatch}
                onChange={e => setEditStudentBatch(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none transition-colors cursor-pointer"
                required
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id} className="bg-[#121318]">
                    {b.name} ({b.timing})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Status *</label>
              <select
                value={editStudentStatus}
                onChange={e => setEditStudentStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none transition-colors cursor-pointer"
                required
              >
                <option value="active" className="bg-[#121318]">Active</option>
                <option value="inactive" className="bg-[#121318]">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-4 border-t border-white/5">
              <button
                type="submit"
                className="px-5 py-2 bg-gold text-dark-bg hover:bg-gold-light pointer:cursor font-bold uppercase tracking-widest text-[10px] rounded-lg transition-all"
              >
                Save Student Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Batch Form Panel */}
      {editingBatch && (
        <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Edit Batch Group</h3>
            <button onClick={() => setEditingBatch(null)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>
          <form onSubmit={handleSaveBatchEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Batch Name *</label>
              <input
                type="text"
                placeholder="Class 11 Physics Adv"
                value={editBatchName}
                onChange={e => setEditBatchName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1.5">Core Subject *</label>
              <select
                value={editBatchSubject}
                onChange={e => setEditBatchSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                required
              >
                <option value="" className="bg-[#121318]">-- Choose Subject --</option>
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub} className="bg-[#121318]">{sub}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 font-mono mb-2">Schedule Weekly Days *</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => {
                  const isSelected = editBatchDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleEditDaySelection(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-gold/15 border-gold text-gold font-bold' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Specific Timings with Timepickers */}
            {editBatchDays.length > 0 && (
              <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3 animate-slide-down">
                <h4 className="text-xs font-semibold text-gold uppercase tracking-wider">Configure daily class timings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {editBatchDays.map(day => (
                    <div key={day} className="space-y-1.5 border-b border-white/5 pb-3.5 last:border-0 last:pb-0">
                      <span className="block text-xs font-bold text-slate-200">{day} Timing *</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[9px] text-slate-500 font-mono uppercase">Start</label>
                          <input
                            type="time"
                            value={editBatchDayTimes[day]?.start || ''}
                            onChange={e => {
                              const current = editBatchDayTimes[day] || { start: '', end: '' };
                              setEditBatchDayTimes({
                                ...editBatchDayTimes,
                                [day]: { ...current, start: e.target.value }
                              });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-lg text-white font-mono outline-none cursor-pointer"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] text-slate-500 font-mono uppercase">End</label>
                          <input
                            type="time"
                            value={editBatchDayTimes[day]?.end || ''}
                            onChange={e => {
                              const current = editBatchDayTimes[day] || { start: '', end: '' };
                              setEditBatchDayTimes({
                                ...editBatchDayTimes,
                                [day]: { ...current, end: e.target.value }
                              });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-lg text-white font-mono outline-none cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-white/5">
              <button
                type="submit"
                className="px-5 py-2 bg-gold text-dark-bg hover:bg-gold-light pointer:cursor font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all"
              >
                Save Batch Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roster Controllers */}
      <div className="bg-dark-card border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex rounded-lg bg-white/5 p-1 self-start border border-white/5">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                viewMode === 'all' 
                  ? 'bg-white/10 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Students ({filteredStudents.length})
            </button>
            <button
              onClick={() => setViewMode('batch')}
              className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                viewMode === 'batch' 
                  ? 'bg-white/10 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Group By Batch
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search student name or parent mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center pt-3 border-t border-white/5">
          <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <Filter className="w-3 h-3 text-gold" />
            <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest pl-1 mr-1">Batch</span>
            <select
              value={selectedBatchFilter}
              onChange={e => setSelectedBatchFilter(e.target.value)}
              className="bg-transparent text-xs text-white outline-none border-none pr-2 cursor-pointer font-sans"
            >
              <option value="" className="bg-[#121318]">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id} className="bg-[#121318]">{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <GraduationCap className="w-3 h-3 text-gold" />
            <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest pl-1 mr-1">Grade</span>
            <select
              value={selectedGradeFilter}
              onChange={e => setSelectedGradeFilter(e.target.value)}
              className="bg-transparent text-xs text-white outline-none border-none pr-2 cursor-pointer font-sans"
            >
              <option value="" className="bg-[#121318]">All Grades</option>
              {grades.map(g => (
                <option key={g} value={g} className="bg-[#121318]">{g}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <Users className="w-3 h-3 text-gold" />
            <span className="text-[9px] font-mono text-slate-450 uppercase tracking-widest pl-1 mr-1">Status</span>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-white outline-none border-none pr-2 cursor-pointer font-sans"
            >
              <option value="all" className="bg-[#121318]">Every Status</option>
              <option value="active" className="bg-[#121318]">Active Only</option>
              <option value="inactive" className="bg-[#121318]">Inactive Only</option>
            </select>
          </div>

          {(selectedBatchFilter || selectedGradeFilter || searchQuery || selectedStatusFilter !== 'active') && (
            <button
              onClick={() => {
                setSelectedBatchFilter('');
                setSelectedGradeFilter('');
                setSelectedStatusFilter('active');
                setSearchQuery('');
              }}
              className="text-[10px] text-gold hover:text-gold-light font-bold uppercase tracking-wider pl-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results View */}
      {viewMode === 'all' ? (
        filteredStudents.length === 0 ? (
          <div className="bg-dark-card border border-white/5 rounded-3xl p-12 text-center text-slate-550">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-serif italic text-white text-base">No Matching Pupils Found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the dropdown filters or enroll a new student.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map(student => {
              const bMatch = batches.find(b => b.id === student.batchId);
              return (
                <div
                  key={student.id}
                  className={`group relative bg-dark-card hover:bg-[#1c1e24] border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-0.5 cursor-pointer ${
                    student.status === 'active' 
                      ? 'border-white/5 hover:border-white/10' 
                      : 'border-white/5 opacity-55 hover:opacity-100 hover:border-white/10'
                  }`}
                  onClick={() => onSelectStudent(student.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-serif italic text-white group-hover:text-gold transition-colors">
                            {student.name}
                          </h4>
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            student.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-white/5 text-slate-400 border border-white/5'
                          }`}>
                            {student.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-450">{student.grade} • {student.subject}</p>
                      </div>
                      <span className="p-2 bg-white/5 text-slate-400 rounded-lg group-hover:bg-gold group-hover:text-dark-bg transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono text-[11px] text-slate-350">{student.parentPhone}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate text-slate-350">Batch: {bMatch ? bMatch.name : "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-white font-bold">₹{student.monthlyFee} <span className="text-[10px] text-slate-500 font-normal">/ month</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-3">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      Invoiced: {student.enrollmentDate}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditStudent(student);
                        }}
                        className="p-1 px-2 text-slate-400 hover:text-gold rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                        title="Edit student"
                      >
                        Edit
                      </button>
                      {onDeleteStudent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to remove student ${student.name}? Complete records (attendance, tests) will be deleted.`)) {
                              onDeleteStudent(student.id);
                            }
                          }}
                          className="p-1 px-2 text-slate-500 hover:text-white rounded bg-white/5 hover:bg-rose-600 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                          title="Remove student"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Grouped By Batch */
        <div className="space-y-6">
          {batches.map(batch => {
            const batchStudents = students.filter(s => s.batchId === batch.id && (selectedStatusFilter === 'all' || s.status === selectedStatusFilter));
            return (
              <div key={batch.id} className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div className="bg-white/[0.02] px-6 py-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-serif italic text-white flex items-center gap-2.5">
                      {batch.name}
                      <span className="text-[10px] font-mono px-2 py-0.5 text-gold bg-gold/10 rounded-full border border-gold/20 font-bold uppercase tracking-widest">
                        {batch.subject}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-450 mt-2 font-sans">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {batch.days.join(', ')}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {batch.timing}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                      <span className="text-gold font-bold mr-1">{batchStudents.length}</span> active pupils
                    </div>
                    {onUpdateBatch && (
                      <button
                        onClick={() => handleStartEditBatch(batch)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-gold border border-white/5 rounded-lg cursor-pointer transition-colors"
                        title="Edit Batch"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteBatch && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete batch "${batch.name}"? Assigned students will become "Unassigned".`)) {
                            onDeleteBatch(batch.id);
                          }
                        }}
                        className="p-1.5 bg-white/5 hover:bg-rose-600/10 text-slate-400 hover:text-rose-400 border border-white/5 rounded-lg cursor-pointer transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {batchStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No students enrolled in this batch.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {batchStudents.map(student => (
                        <div
                          key={student.id}
                          className="p-4 bg-white/[0.01] hover:bg-white/[0.04] rounded-2xl border border-white/5 hover:border-white/10 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                          onClick={() => onSelectStudent(student.id)}
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{student.name}</p>
                            <p className="text-[10px] text-gold mt-1 uppercase tracking-wide">{student.grade} • ₹{student.monthlyFee}/m</p>
                          </div>
                          <Phone className="w-3.5 h-3.5 text-slate-500 group-hover:text-gold" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
