export type Department = 'Engineering' | 'Marketing' | 'Finance' | 'Operations' | 'Design' | 'Sales' | 'HR';

export type EmployeeStatus = 'active' | 'inactive' | 'on-leave';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: Department;
  baseSalary: number; // in USD
  joinDate: string; // ISO
  status: EmployeeStatus;
  walletAddress?: string;
  phone?: string;
  taxId?: string;
  bankAccount?: string;
}

export interface PayrollEntry {
  employeeId: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netPay: number;
  status: PaymentStatus;
  txHash?: string;
}

export interface PayrollRun {
  id: string;
  period: string; // e.g. "September 2026"
  periodStart: string; // ISO
  periodEnd: string; // ISO
  entries: PayrollEntry[];
  totalGross: number;
  totalNet: number;
  createdAt: string; // ISO
  processedAt?: string; // ISO
  status: 'draft' | 'processing' | 'completed' | 'failed';
}

export type View = 'dashboard' | 'employees' | 'attendance' | 'run-payroll' | 'history' | 'settings';
