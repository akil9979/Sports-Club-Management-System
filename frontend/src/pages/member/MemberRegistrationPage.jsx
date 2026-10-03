import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import MemberRegistrationForm from '../../features/membership/MemberRegistrationForm.jsx';

export default function MemberRegistrationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#02140e] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400/60 mb-2">
              <Link to="/" className="hover:text-[#dfc99a] transition-colors">Home</Link>
              <span>/</span>
              <Link to="/members" className="hover:text-[#dfc99a] transition-colors">Member Directory</Link>
              <span>/</span>
              <span className="text-[#dfc99a] font-medium">New Registration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#fcfaf5] tracking-tight flex items-center gap-3">
              Member Registration
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                Front Desk
              </span>
            </h1>
            <p className="text-sm text-emerald-300/70 mt-1 max-w-2xl">
              Register a new club member, establish profile identity, and activate their Gold, Silver, or Junior subscription tier.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/members"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 hover:text-white border border-emerald-800/60 text-xs font-semibold transition-colors"
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
