import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Briefcase, 
  BadgeCheck, 
  Clock, 
  DollarSign, 
  UserX,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../../features/management/managementValidation.js';

/**
 * EmployeeTable Component
 * Renders the official club employee roster with filtering, search,
 * department categorization, and real-time status pills.
 */
export default function EmployeeTable({ employees = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullName = (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`).toLowerCase();
      const empNumber = (emp.employeeNumber || emp.id || '').toLowerCase();
      const designation = (emp.designation || '').toLowerCase();
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        empNumber.includes(searchTerm.toLowerCase()) ||
        designation.includes(searchTerm.toLowerCase());

      const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const departmentLabels = {
    management: 'Management',
    bar: 'Bar & Lounge',
    reception: 'Front Desk & Reception',
    sports_academy: 'Sports Academy',
    housekeeping: 'Housekeeping'
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            On Leave
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700/30 text-slate-400 border border-slate-600/30">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#dfc99a]/15 text-[#dfc99a] flex items-center justify-center border border-[#dfc99a]/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Staff & Employee Roster</h3>
            <p className="text-xs text-[#ede0c4]/60">
              Total {employees.length} team members registered across club departments
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#ede0c4]/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, ID..."
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-white placeholder-[#ede0c4]/40 focus:outline-none focus:border-[#dfc99a]/60 w-52"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-slate-200 focus:outline-none focus:border-[#dfc99a]/60"
          >
            <option value="all">All Departments</option>
            <option value="management">Management</option>
            <option value="bar">Bar & Lounge</option>
            <option value="reception">Reception</option>
            <option value="sports_academy">Sports Academy</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-slate-200 focus:outline-none focus:border-[#dfc99a]/60"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#dfc99a]/15">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#dfc99a]/15 bg-[#02140e]/90 text-[#ede0c4]/70 uppercase text-[10px] tracking-wider font-semibold">
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Department & Designation</th>
              <th className="py-3.5 px-4">Contact Info</th>
              <th className="py-3.5 px-4">Employment</th>
              <th className="py-3.5 px-4">Compensation</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfc99a]/10">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => {
                const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`;
                return (
                  <tr 
                    key={emp.id} 
                    className="hover:bg-[#dfc99a]/5 transition-colors text-slate-200"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#dfc99a]/20 text-[#dfc99a] flex items-center justify-center font-bold text-xs border border-[#dfc99a]/30">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">{name}</span>
                          <span className="text-[10px] font-mono text-[#ede0c4]/50">
                            {emp.employeeNumber || emp.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-medium text-slate-200 block">{emp.designation}</span>
                        <span className="text-[10px] text-[#dfc99a]">
                          {departmentLabels[emp.department] || emp.department}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px] text-[#ede0c4]/70">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#ede0c4]/40" />
                          <span>{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#ede0c4]/40" />
                          <span>{emp.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-[#02140e] border border-[#dfc99a]/20 text-[#ede0c4]/80 text-[11px]">
                        {(emp.employmentType || 'full_time').replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-white block">
                          {formatCurrency(emp.salary)}/mo
                        </span>
                        <span className="text-[10px] text-[#ede0c4]/50">
                          ₹{emp.hourlyRate}/hr base
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(emp.status)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#ede0c4]/50">
                  <UserX className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  No employees found matching the active search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
