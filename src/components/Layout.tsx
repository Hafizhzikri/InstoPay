import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Banknote,
  History,
  Settings,
  Menu,
  X,
  BriefcaseBusiness,
  CalendarDays,
} from 'lucide-react';
import { useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useSwitchChain } from 'wagmi';
import type { View } from '../types';
import { useChain } from '../hooks/useChain';
import { ARC_TESTNET_CHAIN_ID, ARC_MAINNET_CHAIN_ID } from '../contract';

interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',    icon: <LayoutDashboard className="size-4" /> },
  { id: 'employees',   label: 'Employees',    icon: <Users className="size-4" /> },
  { id: 'attendance',  label: 'Attendance',   icon: <CalendarDays className="size-4" /> },
  { id: 'run-payroll', label: 'Run Payroll',  icon: <Banknote className="size-4" /> },
  { id: 'history',     label: 'History',      icon: <History className="size-4" /> },
  { id: 'settings',    label: 'Settings',     icon: <Settings className="size-4" /> },
];

interface LayoutProps {
  view: View;
  onNav: (v: View) => void;
  children: React.ReactNode;
}

export function Layout({ view, onNav, children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { chainName, isMainnet, dotColor } = useChain();
  const { isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  return (
    <div className="flex min-h-dvh">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 min-h-dvh px-4 py-6 gap-6"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 pb-2">
          <div
            className="size-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <BriefcaseBusiness className="size-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none display">InstoPay</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Payroll Management
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.16)' : 'transparent',
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.65)',
                  boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom chain indicator + switcher */}
        <div className="space-y-1.5">
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{ background: isMainnet ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.08)' }}
          >
            <div className="size-2 rounded-full shrink-0" style={{ background: dotColor }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">{chainName}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Live · Onchain</p>
            </div>
          </div>
          {isConnected && (
            <button
              onClick={() => switchChain({ chainId: isMainnet ? ARC_TESTNET_CHAIN_ID : ARC_MAINNET_CHAIN_ID })}
              className="w-full text-xs rounded-lg px-3 py-1.5 font-medium transition-all text-left"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
            >
              Switch to {isMainnet ? 'Testnet' : 'Mainnet'}
            </button>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="size-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <BriefcaseBusiness className="size-4 text-white" />
            </div>
            <span className="font-bold text-sm display" style={{ color: 'var(--ink)' }}>InstoPay</span>
          </div>
          <div className="flex items-center gap-2">
            <ConnectKitButton />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="size-9 flex items-center justify-center rounded-xl"
              style={{ background: 'var(--surface-muted)' }}
            >
              <Menu className="size-5" style={{ color: 'var(--ink)' }} />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <div
          className="hidden md:flex items-center justify-end px-6 py-3 sticky top-0 z-40"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
        >
          <ConnectKitButton />
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden fixed inset-0 z-50 flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="absolute inset-0 bg-black/40" />
              <motion.div
                className="relative w-72 min-h-dvh flex flex-col px-4 py-6 gap-4"
                style={{ background: 'var(--sidebar-bg)' }}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
                      <BriefcaseBusiness className="size-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm display">InstoPay</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Payroll Onchain</p>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="size-8 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.10)' }}>
                    <X className="size-4 text-white" />
                  </button>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                  {NAV_ITEMS.map((item) => {
                    const active = view === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onNav(item.id); setMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-left transition-all"
                        style={{
                          background: active ? 'rgba(255,255,255,0.16)' : 'transparent',
                          color: active ? 'white' : 'rgba(255,255,255,0.65)',
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="space-y-1.5">
                  <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: isMainnet ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.08)' }}>
                    <div className="size-2 rounded-full shrink-0" style={{ background: dotColor }} />
                    <div>
                      <p className="text-xs font-semibold text-white">{chainName}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Live · Onchain</p>
                    </div>
                  </div>
                  {isConnected && (
                    <button
                      onClick={() => { switchChain({ chainId: isMainnet ? ARC_TESTNET_CHAIN_ID : ARC_MAINNET_CHAIN_ID }); setMobileMenuOpen(false); }}
                      className="w-full text-xs rounded-lg px-3 py-1.5 font-medium text-left"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                    >
                      Switch to {isMainnet ? 'Testnet' : 'Mainnet'}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
        style={{ background: 'var(--header-bg)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
      >
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[56px]"
              style={{ color: active ? 'var(--accent)' : 'var(--subtle)' }}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => onNav('settings')}
          className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-[56px]"
          style={{ color: view === 'settings' ? 'var(--accent)' : 'var(--subtle)' }}
        >
          <Settings className="size-4" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </div>
  );
}
