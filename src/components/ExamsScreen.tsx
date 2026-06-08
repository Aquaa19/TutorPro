import React, { useState, useMemo } from 'react';
import { Award, Plus, Calendar, AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';
import { Student, Batch, Performance } from '../types';

interface ExamsScreenProps {
  students: Student[];
  batches: Batch[];
  onAddPerformanceBatch: (marksList: Omit<Performance, 'id'>[]) => Promise<void>;
}

export default function ExamsScreen({
  students,
  batches,
  onAddPerformanceBatch,
}: ExamsScreenProps) {
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [testName, setTestName] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Marks map: studentId -> marksObtained (string)
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  // Remarks map: studentId -> remarks (string)
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default batch selection if available
  React.useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  // Active students in selected batch
  const activeStudents = useMemo(() => {
    if (!selectedBatchId) return [];
    return students.filter(s => s.batchId === selectedBatchId && s.status === 'active');
  }, [students, selectedBatchId]);

  const handleMarkChange = (studentId: string, val: string) => {
    setMarksMap(prev => ({
      ...prev,
      [studentId]: val
    }));
  };

  const handleRemarkChange = (studentId: string, val: string) => {
    setRemarksMap(prev => ({
      ...prev,
      [studentId]: val
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedBatchId) {
      setError("Please select a batch group first.");
      return;
    }
    if (!testName) {
      setError("Please specify the exam/test name.");
      return;
    }
    if (!totalMarks || Number(totalMarks) <= 0) {
      setError("Please specify a valid total marks amount.");
      return;
    }
    if (activeStudents.length === 0) {
      setError("There are no active students in this batch to grade.");
      return;
    }

    // Validate all marks are filled and valid
    const maxMarks = Number(totalMarks);
    const marksList: Omit<Performance, 'id'>[] = [];
    
    for (const student of activeStudents) {
      const valStr = marksMap[student.id] || '';
      if (valStr.trim() === '') {
        setError(`Please enter exam marks for student: ${student.name}.`);
        return;
      }
      const score = Number(valStr);
      if (isNaN(score) || score < 0 || score > maxMarks) {
        setError(`Invalid score entered for ${student.name}. Marks must be between 0 and ${maxMarks}.`);
        return;
      }
      
      marksList.push({
        studentId: student.id,
        testName,
        marksObtained: score,
        totalMarks: maxMarks,
        date: testDate,
        remarks: remarksMap[student.id] || ''
      });
    }

    try {
      setLoading(true);
      await onAddPerformanceBatch(marksList);
      setSuccess(true);
      setTestName('');
      setMarksMap({});
      setRemarksMap({});
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log exam marks database entries.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight flex items-center gap-2">
          <Award className="w-7 h-7 text-gold" />
          Exams & Grades Logger
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Create test records and log pupil scores in bulk</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Exam metadata configure panel */}
        <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono text-slate-450 uppercase tracking-wider mb-1.5 font-semibold">Select Batch</label>
            <select
              value={selectedBatchId}
              onChange={e => {
                setSelectedBatchId(e.target.value);
                setMarksMap({});
                setRemarksMap({});
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 hover:bg-white/[0.03] rounded-xl text-white outline-none cursor-pointer font-sans"
              required
            >
              <option value="" className="bg-[#121318]">-- Choose Batch --</option>
              {batches.map(b => (
                <option key={b.id} value={b.id} className="bg-[#121318]">
                  {b.name} ({b.subject})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-455 uppercase tracking-wider mb-1.5 font-semibold font-mono">Test Name / Chapter</label>
            <input
              type="text"
              placeholder="e.g. Algebra Unit Test 1"
              value={testName}
              onChange={e => setTestName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-sans outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-455 uppercase tracking-wider mb-1.5 font-semibold font-mono">Total Marks</label>
            <input
              type="number"
              value={totalMarks}
              onChange={e => setTotalMarks(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-mono outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-455 uppercase tracking-wider mb-1.5 font-semibold font-mono">Exam Date</label>
            <input
              type="date"
              value={testDate}
              onChange={e => setTestDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-xl text-white font-mono outline-none"
              required
            />
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 animate-slide-down">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 animate-slide-down">
            <CheckCircle className="w-5 h-5 text-emerald-450 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-400 font-bold">✓ Exam sheets successfully recorded and logged in students growth history!</p>
          </div>
        )}

        {/* Bulk scores rows list */}
        {selectedBatchId && activeStudents.length === 0 ? (
          <div className="bg-dark-card border border-white/5 rounded-3xl p-12 text-center text-slate-500 shadow-xl">
            <GraduationCap className="w-12 h-12 mx-auto text-slate-650 mb-3" />
            <p className="font-serif italic text-white text-base">No active students enrolled in this batch.</p>
            <p className="text-xs text-slate-550 mt-1">Add students and assign them to this batch to enter marks.</p>
          </div>
        ) : (
          selectedBatchId && (
            <div className="space-y-6">
              <div className="bg-dark-card border border-white/5 rounded-3xl divide-y divide-[#22242a] overflow-hidden shadow-xl">
                {activeStudents.map(student => {
                  const marksVal = marksMap[student.id] || '';
                  const remarkVal = remarksMap[student.id] || '';
                  return (
                    <div
                      key={student.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Student Details */}
                      <div className="space-y-1 sm:max-w-xs w-full">
                        <h4 className="text-sm font-bold text-white tracking-tight">{student.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">Grade: {student.grade} • {student.subject}</p>
                      </div>

                      {/* Score Input & Remarks */}
                      <div className="flex-1 flex flex-col sm:flex-row gap-4 items-center w-full">
                        {/* Score */}
                        <div className="flex items-center gap-2 w-full sm:max-w-[150px]">
                          <input
                            type="number"
                            placeholder="Marks"
                            value={marksVal}
                            onChange={e => handleMarkChange(student.id, e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-lg text-white font-mono text-center outline-none"
                            required
                          />
                          <span className="text-xs text-slate-500 font-mono">/ {totalMarks || '0'}</span>
                        </div>

                        {/* Remark */}
                        <div className="w-full">
                          <input
                            type="text"
                            placeholder="Add teacher remarks (e.g. Excellent progress in Algebra, needs practice in calculus...)"
                            value={remarkVal}
                            onChange={e => handleRemarkChange(student.id, e.target.value)}
                            className="w-full px-3.5 py-2 text-xs bg-white/[0.01] border border-white/10 focus:border-gold/50 rounded-lg text-white font-sans outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit panel */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gold text-dark-bg hover:bg-gold-light cursor-pointer font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Logging Scores...' : 'Log Batch Exam Scores'}
                </button>
              </div>
            </div>
          )
        )}
      </form>
    </div>
  );
}
