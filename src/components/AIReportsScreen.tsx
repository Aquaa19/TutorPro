import React, { useState, useMemo } from 'react';
import { Sparkles, User, Calendar, GraduationCap, Award, BookOpen, Copy, Check, FileText, AlertCircle, Key, RefreshCcw } from 'lucide-react';
import { Student, Batch, Attendance, Payment, Performance, TutorProfile } from '../types';
import { printAIDossier } from '../utils/printAIDossier';

interface AIReportsScreenProps {
  students: Student[];
  batches: Batch[];
  attendance: Attendance[];
  payments: Payment[];
  performance: Performance[];
  tutorProfile: TutorProfile;
}

const renderMarkdown = (markdown: string): string => {
  let html = markdown;

  // Escape HTML tags to prevent XSS
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-white'>$1</strong>");

  // Italics (*text*)
  html = html.replace(/(?<!^\s*\*)\*(?!\s)(.*?)\*/gm, "<em class='text-slate-300'>$1</em>");

  // Horizontal rules (---)
  html = html.replace(/^---$/gm, "<hr class='border-white/5 my-6' />");

  // Headers (###, ##, #)
  html = html.replace(/^### (.*?)$/gm, "<h4 class='text-xs font-mono uppercase tracking-widest text-[#d4af37] mt-6 mb-2'>$1</h4>");
  html = html.replace(/^## (.*?)$/gm, "<h3 class='text-base font-serif italic text-white mt-8 mb-3 border-b border-white/5 pb-1'>$1</h3>");
  html = html.replace(/^# (.*?)$/gm, "<h2 class='text-lg font-serif italic text-white mt-10 mb-4 pb-2 border-b border-white/10'>$1</h2>");

  // Unordered Lists (* item)
  html = html.replace(/^[\*\-+] (.*?)$/gm, "<li class='list-disc ml-5 pl-1.5 text-slate-350 my-1.5'>$1</li>");

  // Paragraph blocks (split by double newlines)
  const sections = html.split(/\n\n+/);
  const formatted = sections.map(sec => {
    const trimmed = sec.trim();
    if (trimmed.startsWith('<h') || trimmed.startsWith('<hr') || trimmed.startsWith('<li')) {
      return trimmed;
    }
    return `<p class="leading-relaxed text-slate-350 my-4 text-xs md:text-sm">${trimmed.replace(/\n/g, '<br />')}</p>`;
  });

  return formatted.join('\n');
};

export default function AIReportsScreen({
  students,
  batches,
  attendance,
  payments,
  performance,
  tutorProfile,
}: AIReportsScreenProps) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // Active students only
  const activeStudents = useMemo(() => {
    return students.filter(s => s.status === 'active');
  }, [students]);

  // Find selected student details
  const studentInfo = useMemo(() => {
    if (!selectedStudentId) return null;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return null;

    const batch = batches.find(b => b.id === student.batchId);
    const studentAttendance = attendance.filter(a => a.studentId === student.id);
    const studentPerf = performance.filter(p => p.studentId === student.id);

    // Attendance stats
    const totalAtt = studentAttendance.length;
    const presents = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = totalAtt > 0 ? Math.round((presents / totalAtt) * 100) : 100;

    // Academic stats
    const totalTests = studentPerf.length;
    const avgScore = totalTests > 0 
      ? Math.round(studentPerf.reduce((sum, p) => sum + (p.marksObtained / p.totalMarks), 0) / totalTests * 100)
      : null;

    return {
      student,
      batch,
      attendanceRate,
      presents,
      absents: totalAtt - presents,
      avgScore,
      totalTests,
      tests: studentPerf.sort((a,b) => b.date.localeCompare(a.date))
    };
  }, [selectedStudentId, students, batches, attendance, performance]);

  const handleGenerateReport = async () => {
    if (!studentInfo) return;
    if (!apiKey) {
      setError("Please configure a Gemini API key first.");
      return;
    }

    setLoading(true);
    setError(null);
    setReportText(null);

    const testScoresFormatted = studentInfo.tests.length > 0 
      ? studentInfo.tests.map(t => `- ${t.testName} (${t.date}): Obtained ${t.marksObtained}/${t.totalMarks} marks. Remarks: ${t.remarks || 'None'}`).join('\n')
      : "No test records registered yet.";

    const promptText = `You are a professional private tutor writing a student progress dossier for a parent. Write a highly structured, analytical, yet encouraging and professional progress report for the following student:
Name: ${studentInfo.student.name}
Grade/Class: ${studentInfo.student.grade}
Subject: ${studentInfo.student.subject}
Attendance Rate: ${studentInfo.attendanceRate}% (${studentInfo.presents} sessions attended/late, ${studentInfo.absents} sessions missed)
Average Test Percentage: ${studentInfo.avgScore !== null ? studentInfo.avgScore + '%' : 'No tests graded yet'}
Total Tests Taken: ${studentInfo.totalTests}

Recent Exam / Test Logs:
${testScoresFormatted}

Please write the dossier in beautiful, clear markdown, and structured under these exact sections:
1. Overall Performance Overview
2. Key Academic Strengths
3. Primary Areas of Focus / Improvement
4. Tailored Study Recommendations (practical steps for parent and student)
5. Future Academic Projection (trend analysis)

Tone: Insightful, highly professional, warm, and constructive. Use clear formatting, bullet points, and headers.`;

    const models = [
      'gemini-2.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite-preview',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest'
    ];

    let lastError: any = null;
    let generatedText = null;

    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname.startsWith('192.168.'));

    const geminiBaseUrl = isLocal 
      ? 'https://generativelanguage.googleapis.com' 
      : `${window.location.protocol}//${window.location.host}/__/gemini`;

    for (const model of models) {
      try {
        const response = await fetch(
          `${geminiBaseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText }
                  ]
                }
              ]
            })
          }
        );

        const resJson = await response.json();

        if (!response.ok) {
          throw new Error(resJson.error?.message || `Model ${model} returned error status ${response.status}`);
        }

        generatedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) {
          throw new Error(`Model ${model} returned an empty response.`);
        }
        
        // Successfully generated
        break;
      } catch (err: any) {
        console.warn(`Model ${model} failed:`, err);
        lastError = err;
      }
    }

    if (generatedText) {
      setReportText(generatedText);
    } else {
      setError(lastError?.message || 'Failed to generate progress dossier with any of the available models.');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-gold animate-pulse" />
            AI Student Dossier Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Generate personalized progress reports using AI</p>
        </div>
      </div>

      {/* Selector and Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selector Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="text-gold w-4 h-4" />
              Target Pupil Select
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400 font-mono">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={e => {
                    setSelectedStudentId(e.target.value);
                    setReportText(null);
                    setError(null);
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-white/5 border border-white/10 focus:border-gold/50 rounded-xl text-white outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#121318]">-- Select Student --</option>
                  {activeStudents.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#121318]">
                      {s.name} ({s.grade})
                    </option>
                  ))}
                </select>
              </div>

              {studentInfo && (
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gold/15 text-gold rounded-xl">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{studentInfo.student.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{studentInfo.student.grade} • {studentInfo.student.subject}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-450 space-y-1">
                      <p>Cohort: <span className="text-slate-200 font-medium">{studentInfo.batch?.name || 'Unassigned'}</span></p>
                      <p>Enrolled: <span className="text-slate-200 font-medium">{studentInfo.student.enrollmentDate}</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
                      <Calendar className="w-4 h-4 text-gold mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-white font-mono">{studentInfo.attendanceRate}%</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Attendance</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
                      <Award className="w-4 h-4 text-gold mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-white font-mono">
                        {studentInfo.avgScore !== null ? `${studentInfo.avgScore}%` : 'N/A'}
                      </p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Avg Score</p>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateReport}
                    disabled={loading || !apiKey}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-dark-bg font-bold uppercase tracking-wider text-xs py-3 px-4 rounded-xl shadow-lg shadow-gold/15 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-dark-bg border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Synthesizing...' : 'Generate AI Dossier'}</span>
                  </button>

                  {!apiKey && (
                    <p className="text-[9px] text-amber-500 text-center font-medium leading-relaxed font-mono">
                      ⚠️ VITE_GEMINI_API_KEY is missing in .env.local file.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Display Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-card border border-white/5 rounded-3xl p-6 shadow-xl min-h-[350px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="text-gold w-4 h-4" />
                  AI Generated Report Dossier
                </h3>
                {reportText && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                </div>
              )}

              {loading && (
                <div className="space-y-4 py-4">
                  <div className="h-6 bg-white/5 rounded-lg animate-pulse w-3/4"></div>
                  <div className="h-4 bg-white/5 rounded-lg animate-pulse w-1/2"></div>
                  <div className="space-y-2 pt-4">
                    <div className="h-3 bg-white/5 rounded-lg animate-pulse"></div>
                    <div className="h-3 bg-white/5 rounded-lg animate-pulse w-5/6"></div>
                    <div className="h-3 bg-white/5 rounded-lg animate-pulse w-11/12"></div>
                    <div className="h-3 bg-white/5 rounded-lg animate-pulse w-4/5"></div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <div className="h-3 bg-white/5 rounded-lg animate-pulse"></div>
                    <div className="h-3 bg-white/5 rounded-lg animate-pulse w-2/3"></div>
                  </div>
                </div>
              )}

              {!reportText && !loading && !error && (
                <div className="text-center py-20 text-slate-500 space-y-2">
                  <BookOpen className="w-12 h-12 mx-auto opacity-30" />
                  <p className="font-serif italic text-slate-400 text-base">Studio Ready</p>
                  <p className="text-xs max-w-sm mx-auto">
                    Select a student from the sidebar and click "Generate AI Dossier" to create a premium customized report.
                  </p>
                </div>
              )}

              {reportText && (
                <div 
                  className="prose prose-invert max-w-none text-slate-300 select-text font-sans selection:bg-gold/20 selection:text-white"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(reportText) }}
                />
              )}
            </div>
            {reportText && studentInfo && (
              <div className="border-t border-white/5 pt-4 mt-6 flex justify-end">
                <button
                  onClick={() => printAIDossier(
                    studentInfo.student,
                    studentInfo.batch,
                    studentInfo.attendanceRate,
                    studentInfo.avgScore,
                    tutorProfile,
                    reportText
                  )}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer transition-all active:scale-95"
                >
                  Print Report Dossier
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
