import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderLock, LayoutDashboard, Users, CalendarCheck2, CreditCard, Settings, Menu, X, Sparkles, GraduationCap, LogOut, Award, Sun, Moon
} from 'lucide-react';

// Subcomponents
import Dashboard from './components/Dashboard';
import StudentsScreen from './components/StudentsScreen';
import StudentProfile from './components/StudentProfile';
import AttendanceTracker from './components/AttendanceTracker';
import FeeManagement from './components/FeeManagement';
import SettingsScreen from './components/SettingsScreen';
import LoginScreen from './components/LoginScreen';
import AIReportsScreen from './components/AIReportsScreen';
import ExamsScreen from './components/ExamsScreen';

// Types and storage services
import { Student, Batch, Attendance, Payment, Performance, TutorProfile } from './types';
import { StorageService } from './utils/storage';

// Firebase
import { auth, db } from './utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch 
} from 'firebase/firestore';

interface NavState {
  screen: 'dashboard' | 'students' | 'student-profile' | 'attendance' | 'fees' | 'settings' | 'ai-reports' | 'exams';
  studentId?: string;
  extraState?: any;
}

export default function App() {
  const [nav, setNav] = useState<NavState>({ screen: 'dashboard' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('tutor_manager_theme') as any) || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('tutor_manager_theme', nextTheme);
  };

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);

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

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Real-time Syncer
  useEffect(() => {
    if (!currentUser) {
      setStudents([]);
      setBatches([]);
      setAttendance([]);
      setPayments([]);
      setPerformance([]);
      setTutorProfile({
        name: '', email: '', phone: '', subjects: [], defaultFee: 0, upiId: '', instituteName: ''
      });
      setFirestoreLoaded(false);
      return;
    }

    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= 6) {
        setFirestoreLoaded(true);
      }
    };

    const unsubStudents = onSnapshot(collection(db, 'users', currentUser.uid, 'students'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Student);
      setStudents(data);
      if (loadedCount < 6) checkAllLoaded();
    });

    const unsubBatches = onSnapshot(collection(db, 'users', currentUser.uid, 'batches'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Batch);
      setBatches(data);
      if (loadedCount < 6) checkAllLoaded();
    });

    const unsubAttendance = onSnapshot(collection(db, 'users', currentUser.uid, 'attendance'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Attendance);
      setAttendance(data);
      if (loadedCount < 6) checkAllLoaded();
    });

    const unsubPayments = onSnapshot(collection(db, 'users', currentUser.uid, 'payments'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Payment);
      // Sort payments newest first
      setPayments(data.sort((a, b) => b.id.localeCompare(a.id)));
      if (loadedCount < 6) checkAllLoaded();
    });

    const unsubPerformance = onSnapshot(collection(db, 'users', currentUser.uid, 'performance'), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Performance);
      setPerformance(data);
      if (loadedCount < 6) checkAllLoaded();
    });

    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid, 'profile', 'info'), (docSnap) => {
      if (docSnap.exists()) {
        setTutorProfile(docSnap.data() as TutorProfile);
      } else {
        setTutorProfile({
          name: currentUser.displayName || 'Arkadyuti Mandal',
          email: currentUser.email || '',
          phone: '',
          subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer"],
          defaultFee: 0,
          upiId: '',
          instituteName: ''
        });
      }
      if (loadedCount < 6) checkAllLoaded();
    });

    return () => {
      unsubStudents();
      unsubBatches();
      unsubAttendance();
      unsubPayments();
      unsubPerformance();
      unsubProfile();
    };
  }, [currentUser]);

  // Migration from LocalStorage (Seeds Firestore if empty on first login)
  useEffect(() => {
    if (!currentUser || !firestoreLoaded) return;

    const migrateData = async () => {
      if (students.length === 0) {
        // Ensure local storage is initialized to verify if data exists
        StorageService.initialize();
        const localStudents = StorageService.getStudents();
        if (localStudents.length > 0) {
          console.log("Migrating local storage data to Firestore...");
          const batch = writeBatch(db);

          // Tutor Profile
          const localTutor = StorageService.getTutorProfile();
          if (!localTutor.name || localTutor.name === "Prof. Rajesh Kumar") {
            localTutor.name = currentUser.displayName || "Arkadyuti Mandal";
            localTutor.email = currentUser.email || "";
          }
          batch.set(doc(db, 'users', currentUser.uid, 'profile', 'info'), localTutor);

          // Batches
          const localBatches = StorageService.getBatches();
          localBatches.forEach(b => {
            batch.set(doc(db, 'users', currentUser.uid, 'batches', b.id), b);
          });

          // Students
          localStudents.forEach(s => {
            batch.set(doc(db, 'users', currentUser.uid, 'students', s.id), s);
          });

          // Attendance
          const localAtt = StorageService.getAttendance();
          localAtt.forEach(a => {
            batch.set(doc(db, 'users', currentUser.uid, 'attendance', a.id), a);
          });

          // Payments
          const localPayments = StorageService.getPayments();
          localPayments.forEach(p => {
            batch.set(doc(db, 'users', currentUser.uid, 'payments', p.id), p);
          });

          // Performance
          const localPerf = StorageService.getPerformance();
          localPerf.forEach(pf => {
            batch.set(doc(db, 'users', currentUser.uid, 'performance', pf.id), pf);
          });

          await batch.commit();
          console.log("Migration complete!");
        }
      }
    };

    migrateData();
  }, [currentUser, firestoreLoaded]);

  // State mutations (Firestore based)
  const handleAddStudent = async (newStudent: Omit<Student, 'id'>) => {
    if (!currentUser) return;
    const id = `s_${Date.now()}`;
    await setDoc(doc(db, 'users', currentUser.uid, 'students', id), {
      ...newStudent,
      id
    });
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!currentUser) return;

    // Delete student document
    await deleteDoc(doc(db, 'users', currentUser.uid, 'students', studentId));

    // Purge records matching this student across all database tables in a batch
    const batch = writeBatch(db);
    attendance.filter(a => a.studentId === studentId).forEach(a => {
      batch.delete(doc(db, 'users', currentUser.uid, 'attendance', a.id));
    });
    payments.filter(p => p.studentId === studentId).forEach(p => {
      batch.delete(doc(db, 'users', currentUser.uid, 'payments', p.id));
    });
    performance.filter(p => p.studentId === studentId).forEach(p => {
      batch.delete(doc(db, 'users', currentUser.uid, 'performance', p.id));
    });
    await batch.commit();

    if (nav.screen === 'student-profile' && nav.studentId === studentId) {
      setNav({ screen: 'students' });
    }
  };

  const handleUpdateStudentStatus = async (studentId: string, status: 'active' | 'inactive') => {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid, 'students', studentId), {
      status
    }, { merge: true });
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid, 'students', updatedStudent.id), updatedStudent);
  };

  const handleAddBatch = async (newBatch: Omit<Batch, 'id'>) => {
    if (!currentUser) return;
    const id = `b_${Date.now()}`;
    await setDoc(doc(db, 'users', currentUser.uid, 'batches', id), {
      ...newBatch,
      id
    });
  };

  const handleUpdateBatch = async (updatedBatch: Batch) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid, 'batches', updatedBatch.id), updatedBatch);
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!currentUser) return;
    await deleteDoc(doc(db, 'users', currentUser.uid, 'batches', batchId));
    
    // Clean up batch reference from students
    const assigned = students.filter(s => s.batchId === batchId);
    if (assigned.length > 0) {
      const batch = writeBatch(db);
      assigned.forEach(s => {
        batch.set(doc(db, 'users', currentUser.uid, 'students', s.id), {
          ...s,
          batchId: ""
        });
      });
      await batch.commit();
    }
  };

  const handleSaveAttendance = async (newAttendances: Omit<Attendance, 'id'>[]) => {
    if (!currentUser) return;
    const batch = writeBatch(db);

    newAttendances.forEach(newAtt => {
      const existing = attendance.find(
        a => a.studentId === newAtt.studentId && a.date === newAtt.date
      );
      const id = existing ? existing.id : `att_${Date.now()}_${Math.random().toString(36).substring(2,6)}`;
      batch.set(doc(db, 'users', currentUser.uid, 'attendance', id), {
        ...newAtt,
        id
      });
    });

    await batch.commit();
  };

  const handleRecordPayment = async (newPayment: Omit<Payment, 'id'>) => {
    if (!currentUser) return;
    const id = `pay_${Date.now()}`;
    await setDoc(doc(db, 'users', currentUser.uid, 'payments', id), {
      ...newPayment,
      id
    });
  };

  const handleAddPerformance = async (newPerf: Omit<Performance, 'id'>) => {
    if (!currentUser) return;
    const id = `perf_${Date.now()}`;
    await setDoc(doc(db, 'users', currentUser.uid, 'performance', id), {
      ...newPerf,
      id
    });
  };

  const handleAddPerformanceBatch = async (newPerfs: Omit<Performance, 'id'>[]) => {
    if (!currentUser || newPerfs.length === 0) return;
    const batch = writeBatch(db);
    newPerfs.forEach((newPerf, index) => {
      const id = `perf_${Date.now()}_${index}_${Math.random().toString(36).substring(2,6)}`;
      batch.set(doc(db, 'users', currentUser.uid, 'performance', id), {
        ...newPerf,
        id
      });
    });
    await batch.commit();
  };

  const handleUpdateTutorProfile = async (newProfile: TutorProfile) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'info'), newProfile);
  };

  const handleImportBackup = async (backupData: any): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const batch = writeBatch(db);

      // Overwrite tutor profile
      if (backupData.tutor) {
        batch.set(doc(db, 'users', currentUser.uid, 'profile', 'info'), backupData.tutor);
      }

      // Seed all data collections
      const collections = ['students', 'batches', 'attendance', 'payments', 'performance'];
      collections.forEach(col => {
        if (Array.isArray(backupData[col])) {
          backupData[col].forEach((item: any) => {
            batch.set(doc(db, 'users', currentUser.uid, col, item.id), item);
          });
        }
      });

      await batch.commit();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleExportBackup = (): any => {
    return {
      tutor: tutorProfile,
      batches,
      students,
      attendance,
      payments,
      performance,
    };
  };

  const handleClearEverything = async () => {
    if (!currentUser) return;
    const confirmation = window.confirm("Are you absolutely sure you want to delete all your data from the cloud? This cannot be undone.");
    if (!confirmation) return;

    const batch = writeBatch(db);
    students.forEach(s => batch.delete(doc(db, 'users', currentUser.uid, 'students', s.id)));
    batches.forEach(b => batch.delete(doc(db, 'users', currentUser.uid, 'batches', b.id)));
    attendance.forEach(a => batch.delete(doc(db, 'users', currentUser.uid, 'attendance', a.id)));
    payments.forEach(p => batch.delete(doc(db, 'users', currentUser.uid, 'payments', p.id)));
    performance.forEach(pf => batch.delete(doc(db, 'users', currentUser.uid, 'performance', pf.id)));
    batch.delete(doc(db, 'users', currentUser.uid, 'profile', 'info'));

    await batch.commit();

    // Clear local storage and re-initialize empty datasets
    localStorage.clear();
    StorageService.initialize();
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
      case 'ai-reports': return 'AI Progress Dossiers';
      default: return 'Tutorly Hub';
    }
  }, [nav.screen]);

  // Render auth loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-gold flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-widest opacity-60">Initializing TutorPro.OS...</p>
      </div>
    );
  }

  // Overlay login screen if user is not authenticated
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 font-sans flex flex-col md:flex-row antialiased">
      {/* Visual background gradient mesh lines */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gold/5 blur-3xl pointer-events-none -z-10"></div>

      {/* Top Header navbar for smaller mobile devices */}
      <header className="md:hidden bg-dark-sidebar border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-serif italic text-gold tracking-wider">TutorPro<span className="text-white font-sans not-italic font-light opacity-50 text-xs">.OS</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white border border-white/5 cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Navigation drawer panels context */}
      <aside className={`
        fixed inset-y-0 left-0 z-45 w-64 bg-dark-sidebar border-r border-white/5 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out md:translate-x-0 md:static shrink-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          {/* Main Logo & Theme Toggle */}
          <div className="px-2 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-serif italic text-gold tracking-wider">TutorPro<span className="text-white font-sans not-italic font-light opacity-50">.OS</span></h1>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block mt-1">Apex tutoring ecosystem</span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-gold border border-white/5 rounded-xl cursor-pointer transition-all active:scale-95 select-none"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'students', label: 'Batches', icon: Users },
              { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
              { id: 'fees', label: 'Finances', icon: CreditCard },
              { id: 'exams', label: 'Exams & Grades', icon: Award },
              { id: 'ai-reports', label: 'AI Reports', icon: Sparkles },
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

        {/* Bottom User status details and Sign Out */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-gold/40 shrink-0 select-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold to-amber-500 flex items-center justify-center text-dark-bg font-bold italic text-xs shrink-0 select-none">
                {(tutorProfile.name?.[0] || 'A').toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white truncate">{tutorProfile.name || 'Arkadyuti Mandal'}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-tighter truncate">Owner Account</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
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
            tutorProfile={tutorProfile}
            onNavigate={handleNavigate}
            onQuickLogPaymentOpen={() => handleNavigate('fees', { openLogModal: true })}
          />
        )}

        {nav.screen === 'students' && (
          <StudentsScreen
            students={students}
            batches={batches}
            tutorProfile={tutorProfile}
            onAddStudent={handleAddStudent}
            onAddBatch={handleAddBatch}
            onDeleteStudent={handleDeleteStudent}
            onUpdateBatch={handleUpdateBatch}
            onDeleteBatch={handleDeleteBatch}
            onSelectStudent={(id) => handleNavigate('student-profile', { studentId: id })}
            onUpdateStudent={handleUpdateStudent}
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
            onUpdateStudent={handleUpdateStudent}
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

        {nav.screen === 'exams' && (
          <ExamsScreen
            students={students}
            batches={batches}
            onAddPerformanceBatch={handleAddPerformanceBatch}
          />
        )}

        {nav.screen === 'ai-reports' && (
          <AIReportsScreen
            students={students}
            batches={batches}
            attendance={attendance}
            payments={payments}
            performance={performance}
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
