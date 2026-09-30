import { useState, useCallback } from 'react';
import type { Employee, PayrollRun, Department, PayrollEntry } from './types';

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    name: 'Andi Pratama',
    email: 'andi.pratama@company.com',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    baseSalary: 12000000,
    joinDate: '2021-03-15',
    status: 'active',
    phone: '+62 812-3456-7890',
    taxId: 'NPWP-001',
    bankAccount: '1234567890',
  },
  {
    id: 'emp-002',
    name: 'Sari Dewi',
    email: 'sari.dewi@company.com',
    position: 'Product Designer',
    department: 'Design',
    baseSalary: 9500000,
    joinDate: '2022-06-01',
    status: 'active',
    phone: '+62 813-2345-6789',
    taxId: 'NPWP-002',
    bankAccount: '2345678901',
  },
  {
    id: 'emp-003',
    name: 'Budi Santoso',
    email: 'budi.santoso@company.com',
    position: 'Finance Manager',
    department: 'Finance',
    baseSalary: 14000000,
    joinDate: '2020-01-10',
    status: 'active',
    phone: '+62 814-3456-7890',
    taxId: 'NPWP-003',
    bankAccount: '3456789012',
  },
  {
    id: 'emp-004',
    name: 'Rina Marlina',
    email: 'rina.marlina@company.com',
    position: 'Marketing Specialist',
    department: 'Marketing',
    baseSalary: 8000000,
    joinDate: '2023-02-20',
    status: 'active',
    phone: '+62 815-4567-8901',
    taxId: 'NPWP-004',
    bankAccount: '4567890123',
  },
  {
    id: 'emp-005',
    name: 'Doni Firmansyah',
    email: 'doni.firmansyah@company.com',
    position: 'Operations Lead',
    department: 'Operations',
    baseSalary: 11000000,
    joinDate: '2021-09-05',
    status: 'on-leave',
    phone: '+62 816-5678-9012',
    taxId: 'NPWP-005',
    bankAccount: '5678901234',
  },
  {
    id: 'emp-006',
    name: 'Lestari Putri',
    email: 'lestari.putri@company.com',
    position: 'HR Coordinator',
    department: 'HR',
    baseSalary: 7500000,
    joinDate: '2022-11-14',
    status: 'active',
    phone: '+62 817-6789-0123',
    taxId: 'NPWP-006',
    bankAccount: '6789012345',
  },
  {
    id: 'emp-007',
    name: 'Hendra Wijaya',
    email: 'hendra.wijaya@company.com',
    position: 'Sales Executive',
    department: 'Sales',
    baseSalary: 8500000,
    joinDate: '2023-05-08',
    status: 'inactive',
    phone: '+62 818-7890-1234',
    taxId: 'NPWP-007',
    bankAccount: '7890123456',
  },
];

function buildPayrollRun(id: string, period: string, periodStart: string, periodEnd: string, createdAt: string, status: PayrollRun['status']): PayrollRun {
  const active = SEED_EMPLOYEES.filter((e) => e.status === 'active' || e.status === 'on-leave');
  const entries: PayrollEntry[] = active.map((e) => {
    const allowances = Math.round(e.baseSalary * 0.1);
    const deductions = Math.round(e.baseSalary * 0.05);
    const tax = Math.round((e.baseSalary + allowances - deductions) * 0.15);
    const netPay = e.baseSalary + allowances - deductions - tax;
    return {
      employeeId: e.id,
      baseSalary: e.baseSalary,
      allowances,
      deductions,
      tax,
      netPay,
      status: (status === 'completed' ? 'paid' : 'pending'),
      txHash: status === 'completed' ? `0x${Math.random().toString(16).slice(2, 10)}...` : undefined,
    };
  });
  const totalGross = entries.reduce((sum, e) => sum + e.baseSalary + e.allowances, 0);
  const totalNet = entries.reduce((sum, e) => sum + e.netPay, 0);
  return { id, period, periodStart, periodEnd, entries, totalGross, totalNet, createdAt, status, processedAt: status === 'completed' ? createdAt : undefined };
}

const SEED_RUNS: PayrollRun[] = [
  buildPayrollRun('run-001', 'Agustus 2026', '2026-08-01', '2026-08-31', '2026-09-01T10:00:00Z', 'completed'),
  buildPayrollRun('run-002', 'Juli 2026', '2026-07-01', '2026-07-31', '2026-08-01T10:00:00Z', 'completed'),
  buildPayrollRun('run-003', 'Juni 2026', '2026-06-01', '2026-06-30', '2026-07-01T10:00:00Z', 'completed'),
];

// ── Helpers ────────────────────────────────────────────────────────────────
export function calcEntry(baseSalary: number) {
  const allowances = Math.round(baseSalary * 0.1);
  const deductions = Math.round(baseSalary * 0.05);
  const tax = Math.round((baseSalary + allowances - deductions) * 0.15);
  const netPay = baseSalary + allowances - deductions - tax;
  return { allowances, deductions, tax, netPay };
}

export function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function formatShortIDR(amount: number) {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}Jt`;
  return `Rp ${(amount / 1_000).toFixed(0)}Rb`;
}

export const DEPARTMENTS: Department[] = ['Engineering', 'Design', 'Finance', 'Marketing', 'Operations', 'HR', 'Sales'];

export const DEPT_COLORS: Record<Department, string> = {
  Engineering: '#3b82f6',
  Design: '#8b5cf6',
  Finance: '#10b981',
  Marketing: '#f59e0b',
  Operations: '#6366f1',
  HR: '#ec4899',
  Sales: '#f97316',
};

// ── Store hook ─────────────────────────────────────────────────────────────
export function usePayrollStore() {
  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(SEED_RUNS);

  const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    setEmployees((prev) => [...prev, { ...emp, id }]);
    return id;
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const createPayrollRun = useCallback((period: string, periodStart: string, periodEnd: string): PayrollRun => {
    const active = employees.filter((e) => e.status === 'active');
    const entries = active.map((e) => {
      const { allowances, deductions, tax, netPay } = calcEntry(e.baseSalary);
      return { employeeId: e.id, baseSalary: e.baseSalary, allowances, deductions, tax, netPay, status: 'pending' as const };
    });
    const totalGross = entries.reduce((sum, e) => sum + e.baseSalary + e.allowances, 0);
    const totalNet = entries.reduce((sum, e) => sum + e.netPay, 0);
    const run: PayrollRun = {
      id: `run-${Date.now()}`,
      period,
      periodStart,
      periodEnd,
      entries,
      totalGross,
      totalNet,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
    setPayrollRuns((prev) => [run, ...prev]);
    return run;
  }, [employees]);

  const processPayrollRun = useCallback((runId: string) => {
    setPayrollRuns((prev) =>
      prev.map((r) => {
        if (r.id !== runId) return r;
        return {
          ...r,
          status: 'completed',
          processedAt: new Date().toISOString(),
          entries: r.entries.map((e) => ({
            ...e,
            status: 'paid',
            txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          })),
        };
      })
    );
  }, []);

  return { employees, payrollRuns, addEmployee, updateEmployee, deleteEmployee, createPayrollRun, processPayrollRun };
}
