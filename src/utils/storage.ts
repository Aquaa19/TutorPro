import { Student, Batch, Attendance, Payment, Performance, TutorProfile } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'tutor_manager_students',
  BATCHES: 'tutor_manager_batches',
  ATTENDANCE: 'tutor_manager_attendance',
  PAYMENTS: 'tutor_manager_payments',
  PERFORMANCE: 'tutor_manager_performance',
  TUTOR_PROFILE: 'tutor_manager_tutor_profile',
};

// Seed Data
const DEFAULT_TUTOR: TutorProfile = {
  name: "Arkadyuti Mandal",
  email: "arkadyuti.mandal@tutorpro.os",
  phone: "+91 98765 43210",
  subjects: ["Mathematics", "Physics", "Algebra"],
  defaultFee: 2500,
  upiId: "arkadyuti@upi",
  instituteName: "Apex Private Tutoring"
};

const DEFAULT_BATCHES: Batch[] = [
  {
    id: "b1",
    name: "Class 10 Math Core",
    timing: "04:00 PM - 05:30 PM",
    days: ["Monday", "Wednesday", "Friday"],
    subject: "Mathematics"
  },
  {
    id: "b2",
    name: "Class 12 Advanced Physics",
    timing: "06:00 PM - 07:30 PM",
    days: ["Tuesday", "Thursday", "Saturday"],
    subject: "Physics"
  },
  {
    id: "b3",
    name: "Class 9 Early Algebra",
    timing: "02:30 PM - 03:45 PM",
    days: ["Monday", "Thursday"],
    subject: "Algebra"
  }
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: "s1",
    name: "Amit Sharma",
    parentPhone: "+919876543210",
    grade: "Grade 10",
    subject: "Mathematics",
    monthlyFee: 2500,
    enrollmentDate: "2026-03-01",
    batchId: "b1",
    status: "active"
  },
  {
    id: "s2",
    name: "Priya Patel",
    parentPhone: "+919988776655",
    grade: "Grade 10",
    subject: "Mathematics",
    monthlyFee: 2500,
    enrollmentDate: "2026-03-05",
    batchId: "b1",
    status: "active"
  },
  {
    id: "s3",
    name: "Rohan Verma",
    parentPhone: "+919123456789",
    grade: "Grade 10",
    subject: "Mathematics",
    monthlyFee: 2200,
    enrollmentDate: "2026-03-10",
    batchId: "b1",
    status: "active"
  },
  {
    id: "s4",
    name: "Sneha Reddy",
    parentPhone: "+918877665544",
    grade: "Grade 12",
    subject: "Physics",
    monthlyFee: 3200,
    enrollmentDate: "2026-02-15",
    batchId: "b2",
    status: "active"
  },
  {
    id: "s5",
    name: "Arjun Nair",
    parentPhone: "+917766554433",
    grade: "Grade 12",
    subject: "Physics",
    monthlyFee: 3200,
    enrollmentDate: "2026-02-20",
    batchId: "b2",
    status: "active"
  },
  {
    id: "s6",
    name: "Dia Sen",
    parentPhone: "+919555443322",
    grade: "Grade 9",
    subject: "Algebra",
    monthlyFee: 2000,
    enrollmentDate: "2026-04-01",
    batchId: "b3",
    status: "active"
  },
  {
    id: "s7",
    name: "Kabir Kapoor",
    parentPhone: "+919444332211",
    grade: "Grade 9",
    subject: "Algebra",
    monthlyFee: 2000,
    enrollmentDate: "2026-04-05",
    batchId: "b3",
    status: "active"
  },
  {
    id: "s8",
    name: "Vikram Malhotra",
    parentPhone: "+919333221100",
    grade: "Grade 10",
    subject: "Mathematics",
    monthlyFee: 2500,
    enrollmentDate: "2026-05-01",
    batchId: "b1",
    status: "inactive"
  }
];

// Setup attendance records
const DEFAULT_ATTENDANCE: Attendance[] = [
  // Class 10 Math Core - batch b1 (Monday, Wednesday, Friday)
  // Let's seed for June 1 (Mon), June 3 (Wed), June 5 (Fri)
  { id: "att_1_1", studentId: "s1", date: "2026-06-01", status: "present" },
  { id: "att_1_2", studentId: "s2", date: "2026-06-01", status: "present" },
  { id: "att_1_3", studentId: "s3", date: "2026-06-01", status: "late" },
  
  { id: "att_2_1", studentId: "s1", date: "2026-06-03", status: "present" },
  { id: "att_2_2", studentId: "s2", date: "2026-06-03", status: "absent" },
  { id: "att_2_3", studentId: "s3", date: "2026-06-03", status: "present" },
  
  { id: "att_3_1", studentId: "s1", date: "2026-06-05", status: "present" },
  { id: "att_3_2", studentId: "s2", date: "2026-06-05", status: "present" },
  { id: "att_3_3", studentId: "s3", date: "2026-06-05", status: "present" },

  // May records to generate nice statistics
  // Let's seed a few entries for each active student
  { id: "att_may_s1_1", studentId: "s1", date: "2026-05-18", status: "present" },
  { id: "att_may_s1_2", studentId: "s1", date: "2026-05-20", status: "present" },
  { id: "att_may_s1_3", studentId: "s1", date: "2026-05-22", status: "present" },
  { id: "att_may_s1_4", studentId: "s1", date: "2026-05-25", status: "absent" },
  { id: "att_may_s1_5", studentId: "s1", date: "2026-05-27", status: "present" },
  { id: "att_may_s1_6", studentId: "s1", date: "2026-05-29", status: "present" },

  { id: "att_may_s2_1", studentId: "s2", date: "2026-05-18", status: "present" },
  { id: "att_may_s2_2", studentId: "s2", date: "2026-05-20", status: "late" },
  { id: "att_may_s2_3", studentId: "s2", date: "2026-05-22", status: "present" },
  { id: "att_may_s2_4", studentId: "s2", date: "2026-05-25", status: "present" },
  { id: "att_may_s2_5", studentId: "s2", date: "2026-05-27", status: "present" },
  { id: "att_may_s2_6", studentId: "s2", date: "2026-05-29", status: "absent" },

  { id: "att_may_s3_1", studentId: "s3", date: "2026-05-18", status: "absent" },
  { id: "att_may_s3_2", studentId: "s3", date: "2026-05-20", status: "present" },
  { id: "att_may_s3_3", studentId: "s3", date: "2026-05-22", status: "absent" },
  { id: "att_may_s3_4", studentId: "s3", date: "2026-05-25", status: "present" },
  { id: "att_may_s3_5", studentId: "s3", date: "2026-05-27", status: "present" },
  { id: "att_may_s3_6", studentId: "s3", date: "2026-05-29", status: "present" },

  // Class 12 Advanced Physics - batch b2 (Tuesday, Thursday, Saturday)
  { id: "att_4_1", studentId: "s4", date: "2026-06-02", status: "present" },
  { id: "att_4_2", studentId: "s5", date: "2026-06-02", status: "present" },
  { id: "att_5_1", studentId: "s4", date: "2026-06-04", status: "present" },
  { id: "att_5_2", studentId: "s5", date: "2026-06-04", status: "absent" },
  { id: "att_6_1", studentId: "s4", date: "2026-06-06", status: "present" },
  { id: "att_6_2", studentId: "s5", date: "2026-06-06", status: "present" }
];

const DEFAULT_PAYMENTS: Payment[] = [
  // May Payments
  { id: "pay_1", studentId: "s1", amountPaid: 2500, date: "2026-05-04", monthFor: "May 2026", mode: "UPI", status: "paid" },
  { id: "pay_2", studentId: "s2", amountPaid: 2500, date: "2026-05-06", monthFor: "May 2026", mode: "Cash", status: "paid" },
  { id: "pay_3", studentId: "s3", amountPaid: 2200, date: "2026-05-05", monthFor: "May 2026", mode: "UPI", status: "paid" },
  { id: "pay_4", studentId: "s4", amountPaid: 3200, date: "2026-05-02", monthFor: "May 2026", mode: "Bank Transfer", status: "paid" },
  { id: "pay_5", studentId: "s5", amountPaid: 3200, date: "2026-05-10", monthFor: "May 2026", mode: "UPI", status: "paid" },
  { id: "pay_6", studentId: "s6", amountPaid: 2000, date: "2026-05-04", monthFor: "May 2026", mode: "Cash", status: "paid" },
  { id: "pay_7", studentId: "s7", amountPaid: 2000, date: "2026-05-05", monthFor: "May 2026", mode: "UPI", status: "paid" },

  // June Payments (Current month - some paid, some pending)
  { id: "pay_j1", studentId: "s1", amountPaid: 2500, date: "2026-06-02", monthFor: "June 2026", mode: "UPI", status: "paid" },
  { id: "pay_j4", studentId: "s4", amountPaid: 3200, date: "2026-06-03", monthFor: "June 2026", mode: "Bank Transfer", status: "paid" },
  { id: "pay_j6", studentId: "s6", amountPaid: 2000, date: "2026-06-04", monthFor: "June 2026", mode: "Cash", status: "paid" }
  // Priya (s2), Rohan (s3), Arjun (s5), Kabir (s7) are pending or late!
];

const DEFAULT_PERFORMANCE: Performance[] = [
  // Amit Sharma (s1) - Class 10 Math
  { id: "perf_1_1", studentId: "s1", testName: "Diagnostic Quiz", totalMarks: 50, marksObtained: 38, date: "2026-03-20", remarks: "Solid algebra base. Needs work on word problems." },
  { id: "perf_1_2", studentId: "s1", testName: "Linear Equations Test", totalMarks: 100, marksObtained: 78, date: "2026-04-15", remarks: "Improved calculation speed. Silly calculation errors." },
  { id: "perf_1_3", studentId: "s1", testName: "Quadratic Formula Monthly", totalMarks: 100, marksObtained: 85, date: "2026-05-20", remarks: "Excellent grasp of formula derivations. Confident." },
  { id: "perf_1_4", studentId: "s1", testName: "Triangles & Geometry midterm", totalMarks: 100, marksObtained: 92, date: "2026-06-04", remarks: "Stellar performance! Grasp of theorems is perfect." },

  // Priya Patel (s2) - Class 10 Math
  { id: "perf_2_1", studentId: "s2", testName: "Diagnostic Quiz", totalMarks: 50, marksObtained: 40, date: "2026-03-20", remarks: "Attentive solver. Minor step errors." },
  { id: "perf_2_2", studentId: "s2", testName: "Linear Equations Test", totalMarks: 100, marksObtained: 82, date: "2026-04-15", remarks: "Great representation on graph sheets." },
  { id: "perf_2_3", studentId: "s2", testName: "Quadratic Formula Monthly", totalMarks: 100, marksObtained: 80, date: "2026-05-20", remarks: "Struggled slightly with factoring. Overall good." },

  // Rohan Verma (s3) - Class 10 Math
  { id: "perf_3_1", studentId: "s3", testName: "Diagnostic Quiz", totalMarks: 50, marksObtained: 28, date: "2026-03-20", remarks: "Struggling with fundamentals. Homework practice needed." },
  { id: "perf_3_2", studentId: "s3", testName: "Linear Equations Test", totalMarks: 100, marksObtained: 55, date: "2026-04-15", remarks: "Conceptual gaps present. Scheduled extra 1-on-1 time." },
  { id: "perf_3_3", studentId: "s3", testName: "Quadratic Formula Monthly", totalMarks: 100, marksObtained: 68, date: "2026-05-20", remarks: "Noticeable improvement! Solving methods are clearer." },

  // Sneha Reddy (s4) - Class 12 Advanced Physics
  { id: "perf_4_1", studentId: "s4", testName: "Electrostatics Quiz", totalMarks: 50, marksObtained: 45, date: "2026-03-15", remarks: "Strong analytical thinking and conceptual clarity." },
  { id: "perf_4_2", studentId: "s4", testName: "Gauss Law & Capacitance", totalMarks: 100, marksObtained: 91, date: "2026-04-20", remarks: "Excellent derivations. Top score in batch." },
  { id: "perf_4_3", studentId: "s4", testName: "Current Electricity Monthly", totalMarks: 100, marksObtained: 95, date: "2026-05-25", remarks: "Brilliant circuit solver. Solves complex networks easily." },

  // Arjun Nair (s5) - Class 12 Advanced Physics
  { id: "perf_5_1", studentId: "s5", testName: "Electrostatics Quiz", totalMarks: 50, marksObtained: 34, date: "2026-03-15", remarks: "Average start. Needs to remember formulas better." },
  { id: "perf_5_2", studentId: "s5", testName: "Gauss Law & Capacitance", totalMarks: 100, marksObtained: 72, date: "2026-04-20", remarks: "Good effort. Steps are correct, but final calculations are wrong." },
  { id: "perf_5_3", studentId: "s5", testName: "Current Electricity Monthly", totalMarks: 100, marksObtained: 76, date: "2026-05-25", remarks: "Consistent improvement. Practical circuit rules are clear." }
];

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

  // Clear or Overwrite whole structure (Backup & Sync)
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
