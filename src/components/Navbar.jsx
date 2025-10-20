import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-sky-500 text-slate-900" : "text-slate-200 hover:text-white hover:bg-slate-700"}`;

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70">
      <div className="flex items-center justify-between px-3 py-2 sm:px-4">
        <button className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-200 hover:bg-slate-700 focus:outline-none" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <div className="hidden sm:flex gap-2 flex-wrap mx-auto">
          <NavLink to="/" className={linkClass} end>Dashboard</NavLink>
          <NavLink to="/create" className={linkClass}>Create Coin</NavLink>
          <NavLink to="/invest" className={linkClass}>Invest</NavLink>
          <NavLink to="/mining" className={linkClass}>Mining</NavLink>
          <NavLink to="/credentials" className={linkClass}>Credentials</NavLink>
          <NavLink to="/blockchain" className={linkClass}>Blockchain</NavLink>
          <NavLink to="/settings" className={linkClass}>Settings</NavLink>
          <NavLink to="/auth" className={linkClass}>Auth</NavLink>
          <NavLink to="/simulator" className={linkClass}>Simulator</NavLink>
          <NavLink to="/learn-crypto" className={linkClass}>Learn Crypto</NavLink>
          <NavLink to="/admin" className={linkClass}>Admin</NavLink>
          <NavLink to="/admin-miners" className={linkClass}>Admin Miners</NavLink>
          <NavLink to="/tokens" className={linkClass}>Tokens</NavLink>
          <NavLink to="/transactions" className={linkClass}>Transactions</NavLink>
          <NavLink to="/blocks" className={linkClass}>Blocks</NavLink>
          <NavLink to="/verifications" className={linkClass}>Verifications</NavLink>
        </div>
      </div>
      {open && (
        <div className="sm:hidden px-3 pb-3 grid gap-1 border-t border-slate-800">
          <NavLink to="/" className={linkClass} end onClick={() => setOpen(false)}>Dashboard</NavLink>
          <NavLink to="/create" className={linkClass} onClick={() => setOpen(false)}>Create Coin</NavLink>
          <NavLink to="/invest" className={linkClass} onClick={() => setOpen(false)}>Invest</NavLink>
          <NavLink to="/mining" className={linkClass} onClick={() => setOpen(false)}>Mining</NavLink>
          <NavLink to="/credentials" className={linkClass} onClick={() => setOpen(false)}>Credentials</NavLink>
          <NavLink to="/blockchain" className={linkClass} onClick={() => setOpen(false)}>Blockchain</NavLink>
          <NavLink to="/settings" className={linkClass} onClick={() => setOpen(false)}>Settings</NavLink>
          <NavLink to="/auth" className={linkClass} onClick={() => setOpen(false)}>Auth</NavLink>
          <NavLink to="/simulator" className={linkClass} onClick={() => setOpen(false)}>Simulator</NavLink>
          <NavLink to="/learn-crypto" className={linkClass} onClick={() => setOpen(false)}>Learn Crypto</NavLink>
          <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>Admin</NavLink>
          <NavLink to="/admin-miners" className={linkClass} onClick={() => setOpen(false)}>Admin Miners</NavLink>
          <NavLink to="/tokens" className={linkClass} onClick={() => setOpen(false)}>Tokens</NavLink>
          <NavLink to="/transactions" className={linkClass} onClick={() => setOpen(false)}>Transactions</NavLink>
          <NavLink to="/blocks" className={linkClass} onClick={() => setOpen(false)}>Blocks</NavLink>
          <NavLink to="/verifications" className={linkClass} onClick={() => setOpen(false)}>Verifications</NavLink>
        </div>
      )}
    </nav>
  );
}

