import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import MemberRegistrationForm from '../../features/membership/MemberRegistrationForm.jsx';

export default function MemberRegistrationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/members" className="hover:text-amber-400 transition-colors">Member Directory</Link>
              <span>/</span>
              <span className="text-amber-400 font-medium">New Registration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Member Registration
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Front Desk
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Register a new club member, establish profile identity, and activate their Gold, Silver, or Junior subscription tier.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/members"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
            >
              <Users className="w-4 h-4 shrink-0" />
              View Member Roster
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <MemberRegistrationForm
          onSuccess={(newMember) => {
            navigate(`/members/${newMember.id}`);
          }}
        />
      </div>
    </div>
  );
}
