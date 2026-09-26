import { useState, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Employees } from './components/Employees';
import { Attendance } from './components/Attendance';
import { RunPayroll } from './components/RunPayroll';
import { History } from './components/History';
import { Settings } from './components/Settings';
import type { View } from './types';

// ── Error Boundary ────────────────────────────────────────────────────────────
// Wraps only the PAGE content (not Layout/sidebar).
// Uses a `resetKey` prop so that when the user navigates to a new view the
// boundary automatically resets — no manual refresh needed.
interface EBProps { children: ReactNode; resetKey: string }
interface EBState { hasError: boolean; message: string; lastKey: string }

class PageErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, message: '', lastKey: props.resetKey };
  }

  // Reset the boundary whenever the parent passes a new resetKey (view changed)
  static getDerivedStateFromProps(props: EBProps, state: EBState): Partial<EBState> | null {
    if (props.resetKey !== state.lastKey) {
      return { hasError: false, message: '', lastKey: props.resetKey };
    }
    return null;
  }

  static getDerivedStateFromError(error: Error): Partial<EBState> {
    return { hasError: true, message: error.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[InstoPay] Page render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className="rounded-2xl p-6 max-w-sm w-full text-center space-y-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-2xl">⚠️</p>
            <p className="font-bold" style={{ color: 'var(--ink)' }}>
              Terjadi Kesalahan
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {this.state.message.slice(0, 160)}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--accent)' }}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>('dashboard');

  function renderView() {
    switch (view) {
      case 'dashboard':   return <Dashboard onNav={setView} />;
      case 'employees':   return <Employees />;
      case 'attendance':  return <Attendance />;
      case 'run-payroll': return <RunPayroll />;
      case 'history':     return <History />;
      case 'settings':    return <Settings />;
    }
  }

  return (
    // Layout (sidebar + header) is OUTSIDE the error boundary so it never crashes
    <Layout view={view} onNav={setView}>
      {/* resetKey = view ensures the boundary resets automatically on navigation */}
      <PageErrorBoundary resetKey={view}>
        {renderView()}
      </PageErrorBoundary>
    </Layout>
  );
}
