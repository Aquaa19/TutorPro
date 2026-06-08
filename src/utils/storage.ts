import { Student, Batch, Attendance, Payment, Performance, TutorProfile } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'tutor_manager_students',
  BATCHES: 'tutor_manager_batches',
  ATTENDANCE: 'tutor_manager_attendance',
  PAYMENTS: 'tutor_manager_payments',
  PERFORMANCE: 'tutor_manager_performance',
  TUTOR_PROFILE: 'tutor_manager_tutor_profile',
};

// Seed Data (Empty defaults for a clean slate)
const DEFAULT_TUTOR: TutorProfile = {
  name: "Arkadyuti Mandal",
  email: "arkamandal1919@gmail.com",
  phone: "",
  subjects: [],
  defaultFee: 0,
  upiId: "",
  instituteName: ""
};

const DEFAULT_BATCHES: Batch[] = [];
const DEFAULT_STUDENTS: Student[] = [];
const DEFAULT_ATTENDANCE: Attendance[] = [];
const DEFAULT_PAYMENTS: Payment[] = [];
const DEFAULT_PERFORMANCE: Performance[] = [];

export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.TUTOR_PROFILE)) {
    localStorage.setItem(STORAGE_KEYS.TUTOR_PROFILE, JSON.stringify(DEFAULT_TUTOR));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(DEFAULT_BATCHES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_ATTENDANCE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(DEFAULT_PAYMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PERFORMANCE)) {
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE, JSON.stringify(DEFAULT_PERFORMANCE));
  }
}

export function getData<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const StorageService = {
  initialize: initializeStorage,
  
  getTutorProfile: () => getData<TutorProfile>(STORAGE_KEYS.TUTOR_PROFILE, DEFAULT_TUTOR),
  saveTutorProfile: (profile: TutorProfile) => saveData(STORAGE_KEYS.TUTOR_PROFILE, profile),

  getBatches: () => getData<Batch[]>(STORAGE_KEYS.BATCHES, DEFAULT_BATCHES),
  saveBatches: (batches: Batch[]) => saveData(STORAGE_KEYS.BATCHES, batches),

  getStudents: () => getData<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS),
  saveStudents: (students: Student[]) => saveData(STORAGE_KEYS.STUDENTS, students),

  getAttendance: () => getData<Attendance[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE),
  saveAttendance: (attendance: Attendance[]) => saveData(STORAGE_KEYS.ATTENDANCE, attendance),

  getPayments: () => getData<Payment[]>(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS),
  savePayments: (payments: Payment[]) => saveData(STORAGE_KEYS.PAYMENTS, payments),

  getPerformance: () => getData<Performance[]>(STORAGE_KEYS.PERFORMANCE, DEFAULT_PERFORMANCE),
  savePerformance: (performance: Performance[]) => saveData(STORAGE_KEYS.PERFORMANCE, performance),

  importAll: (data: {
    tutor: TutorProfile;
    batches: Batch[];
    students: Student[];
    attendance: Attendance[];
    payments: Payment[];
    performance: Performance[];
  }) => {
    saveData(STORAGE_KEYS.TUTOR_PROFILE, data.tutor);
    saveData(STORAGE_KEYS.BATCHES, data.batches);
    saveData(STORAGE_KEYS.STUDENTS, data.students);
    saveData(STORAGE_KEYS.ATTENDANCE, data.attendance);
    saveData(STORAGE_KEYS.PAYMENTS, data.payments);
    saveData(STORAGE_KEYS.PERFORMANCE, data.performance);
  },

  exportAll: () => {
    return {
      tutor: getData<TutorProfile>(STORAGE_KEYS.TUTOR_PROFILE, DEFAULT_TUTOR),
      batches: getData<Batch[]>(STORAGE_KEYS.BATCHES, DEFAULT_BATCHES),
      students: getData<Student[]>(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS),
      attendance: getData<Attendance[]>(STORAGE_KEYS.ATTENDANCE, DEFAULT_ATTENDANCE),
      payments: getData<Payment[]>(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS),
      performance: getData<Performance[]>(STORAGE_KEYS.PERFORMANCE, DEFAULT_PERFORMANCE),
    };
  }
};
