import React from 'react';
import { 
  CalendarClock, 
  Clock, 
  UserCheck, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

/**
 * ShiftOverview Component
 * Displays today's operational roster and employee duty shifts,
 * showing clock-in records, department assignments, and shift notes.
 */
export default function ShiftOverview({ shifts = [], activeDate = new Date().toISOString().split('T')[0] }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            On Duty (In Progress)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            Completed
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            Scheduled
          </span>
        );
    }
  };

  const departmentLabels = {
    management: 'Management',
    bar: 'Bar & Lounge',
    reception: 'Front Desk',
    sports_academy: 'Sports Academy',
    housekeeping: 'Housekeeping'
  };

  return (
    <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Shift & Roster Overview</h3>
            <p className="text-xs text-[#ede0c4]/60">
              Assigned personnel shifts and attendance for {activeDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#ede0c4]/70 bg-[#02140e] px-3 py-1.5 rounded-xl border border-[#dfc99a]/15">
            Total Shifts: <strong className="text-white">{shifts.length}</strong>
          </span>
        </div>
      </div>

      {/* Shifts Grid */}
      {shifts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 hover:border-sky-500/30 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{shift.employeeName}</h4>
                  <span className="text-[11px] text-[#dfc99a] block">
                    {departmentLabels[shift.department] || shift.department}
                  </span>
                </div>
                {getStatusBadge(shift.status)}
              </div>

              {/* Time Slots & Clock In */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-[#031811] border border-[#dfc99a]/10">
                  <span className="text-[10px] uppercase font-semibold text-[#ede0c4]/50 block">Scheduled Time</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {shift.startTime} – {shift.endTime}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#031811] border border-[#dfc99a]/10">
                  <span className="text-[10px] uppercase font-semibold text-[#ede0c4]/50 block">Actual Clock In</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {shift.actualClockIn ? (
                      <span className="text-emerald-400">{shift.actualClockIn}</span>
                    ) : (
                      <span className="text-[#ede0c4]/40 italic">Pending clock-in</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Shift Notes */}
              {shift.notes && (
                <div className="text-[11px] text-[#ede0c4]/70 bg-[#031811]/60 px-3 py-2 rounded-xl border border-[#dfc99a]/10 flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#dfc99a] shrink-0 mt-0.5" />
                  <span>{shift.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 text-[#ede0c4]/50">
          <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-40 text-sky-400" />
          <p className="text-xs">No active staff shifts scheduled for this date.</p>
        </div>
      )}
    </div>
  );
}
