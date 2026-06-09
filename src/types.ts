export interface Student {
  id: string;
  name: string;
  parentPhone: string;
  grade: string;
  subject: string;
  monthlyFee: number;
  enrollmentDate: string;
  batchId: string;
  status: 'active' | 'inactive';
  billingDay?: number;
}

export interface DayTiming {
  day: string;
  timing: string;
}

export interface Batch {
  id: string;
  name: string;
  timing: string;
  days: string[]; // e.g. ["Monday", "Wednesday", "Friday"]
  subject: string;
  dayTimings?: DayTiming[];
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
}

export interface Payment {
  id: string;
  studentId: string;
  amountPaid: number;
  date: string; // YYYY-MM-DD
  monthFor: string; // e.g. "June 2026"
  mode: 'Cash' | 'UPI' | 'Bank Transfer';
  status: 'paid' | 'pending';
}

export interface Performance {
  id: string;
  studentId: string;
  testName: string;
  totalMarks: number;
  marksObtained: number;
  date: string; // YYYY-MM-DD
  remarks: string;
}

export interface TutorProfile {
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  defaultFee: number;
  upiId: string;
  instituteName: string;
  onboarded?: boolean;
  signatureText?: string;
}
