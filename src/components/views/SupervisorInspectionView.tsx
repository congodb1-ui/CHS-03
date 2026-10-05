import React, { useState } from 'react';
import { useSociety } from '../../context/SocietyContext';
import {
  ClipboardCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Wrench,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AttendanceCode } from '../../types';

export const SupervisorInspectionView: React.FC = () => {
  const {
    inspections,
    selectedInspectionDay,
    setSelectedInspectionDay,
    updateInspectionItem,
    submitInspection,
    verifyInspection,
    staffList,
    attendance,
    updateAttendance,
    bulkMarkAttendance,
    escalateChecklistToTicket,
    role,
    setRole,
  } = useSociety();

  const [activeTab, setActiveTab] = useState<'checklist' | 'attendance'>('checklist');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [adminCommentInput, setAdminCommentInput] = useState('');
  const [escalatedMap, setEscalatedMap] = useState<Record<number, string>>({});
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Get current day's report
  const currentReport = inspections.find((r) => r.day === selectedInspectionDay) || inspections[0];

  const filteredItems = currentReport.items.filter((item) => {
    if (categoryFilter === 'All') return true;
    return item.category === categoryFilter;
  });

  // Calculate statistics
  const totalItems = currentReport.items.length;
  const actionItems = currentReport.items.filter(
    (it) => it.status === 'Action Required' || it.status === 'Not Working' || it.status === 'Bulbs Blown / Replaced' || it.status === 'Blurry / Adjust Lens'
  );
  const okItems = currentReport.items.filter(
    (it) => it.status === 'Working OK' || it.status === 'Cleaned & Swept' || it.status.includes('Full') || it.status.includes('Adequate') || it.status === 'Collected On Time' || it.status === 'No Leakage (OK)'
  );

  const handleEscalate = (item: typeof currentReport.items[0]) => {
    const tktId = escalateChecklistToTicket(item.id, item.activity, item.remarks);
    setEscalatedMap((prev) => ({ ...prev, [item.id]: tktId }));
  };

  const handleVerify = () => {
    verifyInspection(selectedInspectionDay, 'Soleha Khan (Estate Admin)', adminCommentInput || 'Verified and verified on physical walkthrough.');
    setAdminCommentInput('');
  };

  const exportCsv = () => {
    let csv = `Kool Homes Solitaire CHS - Daily Inspection Day ${selectedInspectionDay} (${currentReport.date})\n`;
    csv += `Sr No,Inspection Activity,Category,Status,Remarks\n`;
    currentReport.items.forEach((it) => {
      csv += `${it.id},"${it.activity}","${it.category}","${it.status}","${it.remarks.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Solitaire_Inspection_Day_${selectedInspectionDay}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateSheetSync = () => {
    setSyncStatus('Connecting to Google Sheets Webhook...');
    setTimeout(() => {
      setSyncStatus(`Synced 33 Inspection Rows & 23 Staff Records to "Solitaire Master Inspection 2026.gsheet" at ${new Date().toLocaleTimeString()}!`);
      setTimeout(() => setSyncStatus(null), 5000);
    }, 1200);
  };

  // Attendance stats for selected day
  const dayAttendance = staffList.map((s) => ({
    ...s,
    code: attendance[s.srNo]?.[selectedInspectionDay] || '',
  }));
  const presentCount = dayAttendance.filter((a) => a.code === 'P').length;
  const absentCount = dayAttendance.filter((a) => a.code === 'A').length;
  const woCount = dayAttendance.filter((a) => a.code === 'WO').length;
  const hdCount = dayAttendance.filter((a) => a.code === 'HD').length;
  const lCount = dayAttendance.filter((a) => a.code === 'L').length;
  const attendancePercent = staffList.length > 0 ? Math.round(((presentCount + hdCount * 0.5) / (staffList.length - woCount || 1)) * 100) : 0;

  const canEditInspection = role === 'supervisor' || role === 'admin';
  const canVerifyAdmin = role === 'secretary' || role === 'admin';

  return (
    <div className="space-y-8 pb-16">
      {/* Role Permission Guidance Banner */}
      {role === 'supervisor' && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
            <div>
              <strong className="font-bold">Facility Supervisor Walkthrough Mode (Parvez):</strong> You have direct live editing access. Tap statuses, enter defect observations, mark staff attendance, and click &ldquo;Submit to Estate Office&rdquo; when finished.
            </div>
          </div>
          <span className="font-mono text-[10px] bg-teal-200/60 px-2 py-0.5 rounded font-semibold text-teal-800">
            Write Permissions Active
          </span>
        </div>
      )}

      {role === 'member' && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <div>
              <strong className="font-bold">Resident Member Transparency View:</strong> You are viewing live verified society walkthrough audits logged by Supervisor Parvez and verified by Estate Admin Soleha Khan. Editing is locked for members to maintain official integrity.
            </div>
          </div>
          <span className="font-mono text-[10px] bg-sky-200/60 px-2 py-0.5 rounded font-semibold text-sky-800">
            Read-Only Audit Mode
          </span>
        </div>
      )}

      {(role === 'secretary' || role === 'admin') && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <div>
              <strong className="font-bold">Managing Committee (Secretary / Admin) Oversight Mode:</strong> Monitor real-time supervisor walkthrough logs, escalate open defects to AMC vendor work orders, and provide estate office administrative signoff.
            </div>
          </div>
          <span className="font-mono text-[10px] bg-purple-200/60 px-2 py-0.5 rounded font-semibold text-purple-800">
            Verification & Oversight Active
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 block">
              KOOL HOMES SOLITAIRE CO-OP HOUSING SOCIETY LTD.
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Daily Inspection & Attendance Master System
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Live facility supervisor logs (Parvez), estate office admin verification (Soleha Khan), and Managing Committee monitoring for all 23 estate staff and 33 critical infrastructure points.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSimulateSheetSync}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Sync with Google Sheets"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets Sync</span>
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Sync notification banner */}
        {syncStatus && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between animate-in fade-in duration-150">
            <span className="font-semibold">{syncStatus}</span>
            <span className="text-[11px] text-emerald-600">Real-time Cloud Sync Active</span>
          </div>
        )}

        {/* Day Index Bar (Days 1 - 31 exactly as shown on PDF Page 1) */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              31-Day Daily Inspection Checklist Index:
            </span>
            <span className="text-slate-500 tabular-nums">
              Selected: <strong>Day {selectedInspectionDay} ({currentReport.date})</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
              const hasReport = inspections.some((r) => r.day === dayNum);
              const isSelected = selectedInspectionDay === dayNum;
              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedInspectionDay(dayNum)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-xs'
                      : hasReport
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  Day {dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 2 Navigation Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg max-w-lg">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            33-Point Daily Inspection ({totalItems})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Staff Attendance (23 Staff)
          </button>
        </div>
      </div>

      {/* Tab 1: 33-Point Daily Inspection Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar for Selected Day */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Inspected</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">33 Checkpoints</span>
              <span className="text-[11px] text-slate-500 block">4 Critical Categories</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Working / Cleaned</span>
              <span className="text-xl font-bold text-emerald-700 tabular-nums">{okItems.length} OK</span>
              <span className="text-[11px] text-emerald-600 block">Passed Standard</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Action Required / Flaws</span>
              <span className="text-xl font-bold text-red-600 tabular-nums">{actionItems.length} Issues</span>
              <span className="text-[11px] text-red-500 block">Requires Resolution</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Admin Signoff</span>
              <span className="text-base font-bold text-slate-900 block truncate">
                {currentReport.isVerified ? 'Verified by Soleha' : 'Pending Verification'}
              </span>
              <span className={`text-[11px] font-semibold ${currentReport.isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                {currentReport.isVerified ? 'Signed Off' : 'Review Required'}
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'All',
                'UTILITIES & INFRASTRUCTURE',
                'CLEANING & HYGIENE',
                'LIGHTS & SECURITY',
                'RENOVATION & MAINTENANCE',
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'All' ? 'All 33 Checkpoints' : cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500">
              {role === 'supervisor' ? (
                <span className="font-semibold text-teal-700">Supervisor Edit Mode (Parvez)</span>
              ) : (
                <span>Logged as: <strong>{role.toUpperCase()}</strong></span>
              )}
            </div>
          </div>

          {/* 33-Point Checklist Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">Sr.</th>
                    <th className="py-2.5 px-3">Inspection Category & Activity Details</th>
                    <th className="py-2.5 px-3 w-48">Status / Observation</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Comments / Remarks</th>
                    <th className="py-2.5 px-3 text-right">Committee Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isIssue =
                      item.status === 'Action Required' ||
                      item.status === 'Not Working' ||
                      item.status === 'Bulbs Blown / Replaced' ||
                      item.status === 'Blurry / Adjust Lens';
                    const escalatedTicket = escalatedMap[item.id];

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isIssue ? 'bg-red-50/20' : ''}`}>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {item.id}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold text-teal-800 uppercase block tracking-wider">
                            {item.category}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {item.activity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {canEditInspection ? (
                            /* Interactive status selector for Supervisor */
                            <select
                              value={item.status}
                              onChange={(e) => updateInspectionItem(selectedInspectionDay, item.id, e.target.value)}
                              className={`w-full text-xs p-1.5 rounded-lg border font-semibold ${
                                isIssue
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                              }`}
                            >
                              <option value="Working OK">Working OK</option>
                              <option value="Cleaned & Swept">Cleaned & Swept</option>
                              <option value="Full (100%)">Full (100%)</option>
                              <option value="Adequate (>75%)">Adequate (&gt;75%)</option>
                              <option value="Collected On Time">Collected On Time</option>
                              <option value="No Leakage (OK)">No Leakage (OK)</option>
                              <option value="Action Required">Action Required</option>
                              <option value="Not Working">Not Working</option>
                              <option value="Bulbs Blown / Replaced">Bulbs Blown / Replaced</option>
                              <option value="Blurry / Adjust Lens">Blurry / Adjust Lens</option>
                              <option value="No Violations">No Violations</option>
                            </select>
                          ) : (
                            /* Read-only status badge for Residents */
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                isIssue
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}
                            >
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {canEditInspection ? (
                            <input
                              type="text"
                              value={item.remarks}
                              placeholder="Add defect notes or observations..."
                              onChange={(e) => updateInspectionItem(selectedInspectionDay, item.id, item.status, e.target.value)}
                              className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-teal-600"
                            />
                          ) : (
                            <span className="text-xs text-slate-700">
                              {item.remarks ? (
                                <span className={isIssue ? 'font-medium text-red-800' : 'text-slate-800'}>
                                  {item.remarks}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No defect observed</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isIssue ? (
                            escalatedTicket ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                {escalatedTicket}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleEscalate(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                                title="Escalate directly to Society Helpdesk"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>Create Ticket</span>
                              </button>
                            )
                          ) : (
                            <span className="text-slate-400 text-[11px]">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Supervisor & Admin Signoff Box (matching PDF Page 13) */}
            <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Supervisor Sign */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Facility Supervisor Signoff
                </span>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Logged by: <strong>Parvez (Facility Supervisor)</strong></span>
                  <span className="tabular-nums text-slate-500">{currentReport.submittedAt || 'Pending final submit'}</span>
                </div>
                {!currentReport.isSubmitted && (
                  <button
                    onClick={() => submitInspection(selectedInspectionDay)}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors cursor-pointer mt-2"
                  >
                    Submit Day {selectedInspectionDay} Checklist for Admin Verification
                  </button>
                )}
                {currentReport.isSubmitted && (
                  <div className="p-2 bg-teal-50 border border-teal-200 text-teal-800 rounded font-semibold text-center">
                    ✓ Submitted to Estate Office on {currentReport.submittedAt}
                  </div>
                )}
              </div>

              {/* Admin Signoff & Verification */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  Office Admin Verification (Soleha Khan)
                </span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Enter admin remarks / work orders given..."
                    value={adminCommentInput || currentReport.adminComments}
                    onChange={(e) => setAdminCommentInput(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  {!currentReport.isVerified ? (
                    <button
                      onClick={handleVerify}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Verify & Sign Off Day {selectedInspectionDay} Checklist
                    </button>
                  ) : (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-semibold text-center">
                      ✓ Verified by Soleha Khan ({currentReport.verifiedAt})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Monthly Staff Attendance Matrix */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Staff & Vendor Attendance Matrix (Day {selectedInspectionDay})
              </h2>
              <p className="text-xs text-slate-500">
                Master attendance roster for 23 active staff members (Security, Housekeeping, Admin, Electrician, Plumber).
              </p>
            </div>

            <div className="flex items-center gap-2">
              {canEditInspection ? (
                <button
                  onClick={() => bulkMarkAttendance(selectedInspectionDay, 'P')}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Mark All Present (P)
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">
                  Attendance entries verified by Estate Office
                </span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Staff</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{staffList.length} Personnel</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Present (P)</span>
              <span className="text-lg font-bold text-emerald-800 tabular-nums">{presentCount} On Duty</span>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-700 block text-[10px] uppercase font-semibold">Absent (A)</span>
              <span className="text-lg font-bold text-red-800 tabular-nums">{absentCount} Absent</span>
            </div>
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
              <span className="text-sky-700 block text-[10px] uppercase font-semibold">Weekly Off (WO)</span>
              <span className="text-lg font-bold text-sky-800 tabular-nums">{woCount} Off</span>
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <span className="text-teal-700 block text-[10px] uppercase font-semibold">Attendance %</span>
              <span className="text-lg font-bold text-teal-800 tabular-nums">{attendancePercent}%</span>
            </div>
          </div>

          {/* Attendance Legend as seen in PDF page 7 */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-800">Attendance Codes:</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-emerald-700">P = Present</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-red-700">A = Absent</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-blue-700">WO = Weekly Off</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-amber-700">HD = Half Day (0.5)</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-semibold text-purple-700">L = Leave</span>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Sr.</th>
                  <th className="py-2.5 px-3">Staff / Vendor Name</th>
                  <th className="py-2.5 px-3">Team / Department</th>
                  <th className="py-2.5 px-3">Designation / Role</th>
                  <th className="py-2.5 px-3">Shift Timings</th>
                  <th className="py-2.5 px-3 text-center">Day {selectedInspectionDay} Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dayAttendance.map((staff) => (
                  <tr key={staff.srNo} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                      {staff.srNo}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{staff.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
                        {staff.team}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{staff.role}</td>
                    <td className="py-2.5 px-3 text-slate-500 tabular-nums">{staff.shift}</td>
                    <td className="py-2.5 px-3 text-center">
                      {canEditInspection ? (
                        <div className="inline-flex items-center gap-1">
                          {(['P', 'A', 'WO', 'HD', 'L'] as AttendanceCode[]).map((code) => {
                            const isCurrent = staff.code === code;
                            return (
                              <button
                                key={code}
                                onClick={() => updateAttendance(staff.srNo, selectedInspectionDay, code)}
                                className={`w-7 h-7 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                                  isCurrent
                                    ? code === 'P'
                                      ? 'bg-emerald-600 text-white'
                                      : code === 'A'
                                      ? 'bg-red-600 text-white'
                                      : code === 'WO'
                                      ? 'bg-blue-600 text-white'
                                      : code === 'HD'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-purple-600 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                              >
                                {code}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                            staff.code === 'P'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : staff.code === 'A'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : staff.code === 'WO'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : staff.code === 'HD'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : staff.code === 'L'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {staff.code === 'P'
                            ? 'Present (P)'
                            : staff.code === 'A'
                            ? 'Absent (A)'
                            : staff.code === 'WO'
                            ? 'Weekly Off (WO)'
                            : staff.code === 'HD'
                            ? 'Half Day (0.5)'
                            : staff.code === 'L'
                            ? 'Approved Leave (L)'
                            : 'Not Marked'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
