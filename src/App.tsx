import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderLock, LayoutDashboard, Users, CalendarCheck2, CreditCard, Settings, Menu, X, Sparkles, GraduationCap
} from 'lucide-react';

// Subcomponents
import Dashboard from './components/Dashboard';
import StudentsScreen from './components/StudentsScreen';
import StudentProfile from './components/StudentProfile';
import AttendanceTracker from './components/AttendanceTracker';
import FeeManagement from './components/FeeManagement';
import SettingsScreen from './components/SettingsScreen';

// Types and storage services
import { Student, Batch, Attendance, Payment, Performance, TutorProfile } from './types';
import { StorageService } from './utils/storage';

interface NavState {
  screen: 'dashboard' | 'students' | 'student-profile' | 'attendance' | 'fees' | 'settings';
  studentId?: string;
  extraState?: any;
}

export default function App() {
  const [nav, setNav] = useState<NavState>({ screen: 'dashboard' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core database tables inside state
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile>({
    name: '', email: '', phone: '', subjects: [], defaultFee: 0, upiId: '', instituteName: ''
  });

  // Hot Logger Payment Trigger modal shortcuts on fee page
  const [openFeesPageLogModal, setOpenFeesPageLogModal] = useState(false);

  // Initialize storage upon mount
  useEffect(() => {
    StorageService.initialize();
    loadAllData();
  }, []);

  const loadAllData = () => {
    setStudents(StorageService.getStudents());
    setBatches(StorageService.getBatches());
    setAttendance(StorageService.getAttendance());
    setPayments(StorageService.getPayments());
    setPerformance(StorageService.getPerformance());
    setTutorProfile(StorageService.getTutorProfile());
  };

  // State mutations
  const handleAddStudent = (newStudent: Omit<Student, 'id'>) => {
    const studentWithId: Student = {
      ...newStudent,
      id: `s_${Date.now()}`
    };
    const updated = [...students, studentWithId];
    setStudents(updated);
    StorageService.saveStudents(updated);
  };

  const handleDeleteStudent = (studentId: string) => {
    // Purge records matching this student across all database tables
    const nextStudents = students.filter(s => s.id !== studentId);
    const nextAttendance = attendance.filter(a => a.studentId !== studentId);
    const nextPayments = payments.filter(p => p.studentId !== studentId);
    const nextPerf = performance.filter(p => p.studentId !== studentId);

    setStudents(nextStudents);
    setAttendance(nextAttendance);
    setPayments(nextPayments);
    setPerformance(nextPerf);

    StorageService.saveStudents(nextStudents);
    StorageService.saveAttendance(nextAttendance);
    StorageService.savePayments(nextPayments);
    StorageService.savePerformance(nextPerf);

    if (nav.screen === 'student-profile' && nav.studentId === studentId) {
      setNav({ screen: 'students' });
    }
  };

  const handleUpdateStudentStatus = (studentId: string, status: 'active' | 'inactive') => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        return { ...s, status };
      }
      return s;
    });
    setStudents(updated);
    StorageService.saveStudents(updated);
  };

  const handleAddBatch = (newBatch: Omit<Batch, 'id'>) => {
    const batchWithId: Batch = {
      ...newBatch,
      id: `b_${Date.now()}`
    };
    const updated = [...batches, batchWithId];
    setBatches(updated);
    StorageService.saveBatches(updated);
  };

  const handleSaveAttendance = (newAttendances: Omit<Attendance, 'id'>[]) => {
    // Collect non-overlapping historical attendances
    // Replace records matching date + studentId; append new ones
    let nextAttendance = [...attendance];
    
    newAttendances.forEach(newAtt => {
      // Check if entry exists on this date for this student
      const matchIdx = nextAttendance.findIndex(
        a => a.studentId === newAtt.studentId && a.date === newAtt.date
      );
      
      const hydratedAtt: Attendance = {
        ...newAtt,
        id: matchIdx !== -1 ? nextAttendance[matchIdx].id : `att_${Date.now()}_${Math.random().toString(36).substring(2,6)}`
      };

      if (matchIdx !== -1) {
        nextAttendance[matchIdx] = hydratedAtt;
      } else {
        nextAttendance.push(hydratedAtt);
      }
    });

    setAttendance(nextAttendance);
    StorageService.saveAttendance(nextAttendance);
  };

  const handleRecordPayment = (newPayment: Omit<Payment, 'id'>) => {
    const payWithId: Payment = {
      ...newPayment,
      id: `pay_${Date.now()}`
    };
    const updated = [payWithId, ...payments]; // Append newest first
    setPayments(updated);
    StorageService.savePayments(updated);
  };

  const handleAddPerformance = (newPerf: Omit<Performance, 'id'>) => {
    const perfWithId: Performance = {
      ...newPerf,
      id: `perf_${Date.now()}`
    };
    const updated = [...performance, perfWithId];
    setPerformance(updated);
    StorageService.savePerformance(updated);
  };

  const handleUpdateTutorProfile = (newProfile: TutorProfile) => {
    setTutorProfile(newProfile);
    StorageService.saveTutorProfile(newProfile);
  };

  const handleImportBackup = (backupData: any): boolean => {
    try {
      StorageService.importAll(backupData);
      loadAllData();
      return true;
    } catch {
      return false;
    }
  };

  const handleExportBackup = (): any => {
    return StorageService.exportAll();
  };

  const handleClearEverything = () => {
    localStorage.clear();
    StorageService.initialize();
    loadAllData();
  };

  // Safe navigation transition
  const handleNavigate = (screen: any, extraData: any = null) => {
    setIsMobileMenuOpen(false);
    
    if (screen === 'fees' && extraData?.openLogModal) {
      setOpenFeesPageLogModal(true);
      setNav({ screen });
    } else {
      setOpenFeesPageLogModal(false);
      setNav({
        screen,
        studentId: extraData?.studentId,
        extraState: extraData
      });
    }
  };

  const activePageLabel = useMemo(() => {
    switch (nav.screen) {
      case 'dashboard': return 'Command Center';
      case 'students': return 'Students directory';
      case 'student-profile': return 'Student dossier';
      case 'attendance': return 'Roll roster';
      case 'fees': return 'Fee accounts';
      case 'settings': return 'Tutors settings';
      default: return 'Tutorly Hub';
    }
  }, [nav.screen]);

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 font-sans flex flex-col md:flex-row antialiased">
      {/* Visual background gradient mesh lines */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gold/5 blur-3xl pointer-events-none -z-10"></div>

      {/* Top Header navbar for smaller mobile devices */}
      <header className="md:hidden bg-dark-sidebar border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-serif italic text-gold tracking-wider">TutorPro<span className="text-white font-sans not-italic font-light opacity-50 text-xs">.OS</span></h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Navigation drawer panels context */}
      <aside className={`
        fixed inset-y-0 left-0 z-45 w-64 bg-dark-sidebar border-r border-white/5 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out md:translate-x-0 md:static shrink-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          {/* Main Logo */}
          <div className="px-2">
            <h1 className="text-xl font-serif italic text-gold tracking-wider">TutorPro<span className="text-white font-sans not-italic font-light opacity-50">.OS</span></h1>
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block mt-1">Apex tutoring ecosystem</span>
          </div>

          {/* Navigation Links list */}
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'students', label: 'Batches', icon: Users },
              { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
              { id: 'fees', label: 'Finances', icon: CreditCard },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const isActive = nav.screen === item.id || (item.id === 'students' && nav.screen === 'student-profile');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold text-left select-none transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-white/5 text-white border-white/10 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-gold opacity-90' : 'text-slate-500 opacity-65'}`} />
                  <span className="uppercase tracking-widest text-[11px]">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User status details */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold to-amber-500 flex items-center justify-center text-dark-bg font-bold italic text-xs shrink-0 select-none">
              {(tutorProfile.name?.[0] || 'A').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white truncate">{tutorProfile.name || 'Arkadyuti Mandal'}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-tighter truncate">{tutorProfile.instituteName || 'Apex Workspace'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        ></div>
      )}

      {/* Main viewport Container context */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden min-h-[calc(100vh-50px)] md:min-h-screen">
        {/* Render App screens dynamically based on state */}
        {nav.screen === 'dashboard' && (
          <Dashboard
            students={students}
            batches={batches}
            attendance={attendance}
            payments={payments}
            onNavigate={handleNavigate}
            onQuickLogPaymentOpen={() => handleNavigate('fees', { openLogModal: true })}
          />
        )}

        {nav.screen === 'students' && (
          <StudentsScreen
            students={students}
            batches={batches}
            onAddStudent={handleAddStudent}
            onAddBatch={handleAddBatch}
            onDeleteStudent={handleDeleteStudent}
            onSelectStudent={(id) => handleNavigate('student-profile', { studentId: id })}
            extraState={nav.extraState}
          />
        )}

        {nav.screen === 'student-profile' && nav.studentId && (
          <StudentProfile
            studentId={nav.studentId}
            students={students}
            batches={batches}
            attendance={attendance}
            payments={payments}
            performance={performance}
            tutorProfile={tutorProfile}
            initialTab={nav.extraState?.tabIndex || 0}
            onBack={() => handleNavigate('students')}
            onRecordPayment={handleRecordPayment}
            onAddPerformance={handleAddPerformance}
            onUpdateStudentStatus={handleUpdateStudentStatus}
          />
        )}

        {nav.screen === 'attendance' && (
          <AttendanceTracker
            students={students}
            batches={batches}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
            preselectedBatchId={nav.extraState?.preselectedBatchId}
          />
        )}

        {nav.screen === 'fees' && (
          <FeeManagement
            students={students}
            batches={batches}
            payments={payments}
            tutorProfile={tutorProfile}
            onRecordPayment={handleRecordPayment}
            openLogPaymentDirectly={openFeesPageLogModal}
          />
        )}

        {nav.screen === 'settings' && (
          <SettingsScreen
            tutorProfile={tutorProfile}
            onUpdateProfile={handleUpdateTutorProfile}
            onImportBackup={handleImportBackup}
            onExportBackup={handleExportBackup}
            onClearEverything={handleClearEverything}
          />
        )}
      </main>
    </div>
  );
}
