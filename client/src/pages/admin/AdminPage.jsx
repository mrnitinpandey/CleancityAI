import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, PlusCircle, Trash2, Phone, MapPin, 
  Download, FileSpreadsheet, CheckCircle2, AlertCircle, Clock, Database, UserPlus, UserCheck, Send, X, FileText, Activity, User, Mail, Calendar,
  Image as ImageIcon, Eye, ExternalLink, Check
} from 'lucide-react';
import { addWorkerAPI, deleteWorkerAPI, exportDataAPI, assignWorkerAPI, fetchAllUsersAPI } from '../../services/api';
import confetti from 'canvas-confetti';

export default function AdminPage({ complaints = [], workers = [], onAssign, onStatusChange, onWorkersUpdated }) {
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'complaints' | 'users' | 'workers' | 'data'
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('Rapid Sanitation Crew');
  const [newWorkerZone, setNewWorkerZone] = useState('Ward 01 - Kakadeo & Geeta Nagar');
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  // Image Preview Modal State (for Citizen uploaded image and Worker resolved proof image)
  const [previewImageModal, setPreviewImageModal] = useState(null); // { url, title, type, ticketId, date, location }

  // Crew Assignment Selection Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || '');
  const [isAssigning, setIsAssigning] = useState(false);

  // Load registered users audit on mount
  useEffect(() => {
    loadUsersList();
  }, []);

  const loadUsersList = async () => {
    try {
      const users = await fetchAllUsersAPI();
      setRegisteredUsers(users);
    } catch (e) {
      console.error(e);
    }
  };

  // Live Statistics Calculations
  const totalRegistered = complaints.length;
  const totalResolved = complaints.filter(c => c.status === 'Resolved').length;
  const totalPending = complaints.filter(c => c.status === 'Reported').length;
  const totalInProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolutionPercentage = totalRegistered > 0 ? Math.round((totalResolved / totalRegistered) * 100) : 0;

  // Open modal with worker list to assign
  const handleOpenAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedWorkerId(workers[0]?.id || '');
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedComplaint || !selectedWorkerId) return;
    setIsAssigning(true);
    try {
      await assignWorkerAPI(selectedComplaint.ticketId, selectedWorkerId);
      setAssignModalOpen(false);
      onWorkersUpdated();
      confetti({ particleCount: 70, spread: 60 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Add Worker Handler
  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerPhone) return;

    setIsAddingWorker(true);
    try {
      const res = await addWorkerAPI({
        name: newWorkerName,
        phone: newWorkerPhone,
        role: newWorkerRole,
        zone: newWorkerZone
      });
      if (res.success) {
        setNewWorkerName('');
        setNewWorkerPhone('');
        onWorkersUpdated();
        loadUsersList();
        confetti({ particleCount: 60, spread: 60 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingWorker(false);
    }
  };

  // Remove Worker Handler
  const handleDeleteWorker = async (workerId) => {
    if (window.confirm('Are you sure you want to remove this field worker from the municipal roster?')) {
      await deleteWorkerAPI(workerId);
      onWorkersUpdated();
      loadUsersList();
    }
  };

  // Convert complaints array to CSV format
  const convertToCSV = (items) => {
    if (!items || items.length === 0) return '';
    
    const headers = [
      'Ticket ID',
      'Citizen User ID',
      'Title',
      'Category',
      'Severity',
      'Priority Score',
      'Status',
      'Location Landmark',
      'Ward Zone',
      'City',
      'Citizen Name',
      'Citizen Phone',
      'Assigned Worker',
      'Worker Phone',
      'Created Date',
      'Resolved Date',
      'Resolution Notes'
    ];

    const rows = items.map(c => [
      `"${c.ticketId || ''}"`,
      `"${c.citizenUserId || ''}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${c.category || ''}"`,
      `"${c.severity || ''}"`,
      c.priorityScore || 0,
      `"${c.status || ''}"`,
      `"${(c.locationName || '').replace(/"/g, '""')}"`,
      `"${(c.ward || '').replace(/"/g, '""')}"`,
      `"${c.city || 'Kanpur'}"`,
      `"${c.citizenName || ''}"`,
      `"${c.citizenPhone || ''}"`,
      `"${c.assignedWorkerName || 'Unassigned'}"`,
      `"${c.assignedWorkerPhone || ''}"`,
      `"${c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}"`,
      `"${c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : ''}"`,
      `"${(c.resolutionNotes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  };

  // Download Data as CSV file
  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const res = await exportDataAPI();
      const complaintsList = res.data?.complaints || complaints;
      const csvContent = convertToCSV(complaintsList);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `cleancity_kanpur_complaints_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      setExportSuccessMsg('Municipal dataset downloaded as .CSV successfully!');
      setTimeout(() => setExportSuccessMsg(''), 4500);
      confetti({ particleCount: 80, spread: 70 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingCSV(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Admin Top Banner */}
      <div className="glass-panel p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-indigo-500/30">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} /> Full Administrative Operations • Kanpur Nagar Nigam
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
            Municipal Command & Telemetry Center
          </h1>
          <p className="text-slate-300 text-xs mt-1">
            Complete audit trail of registered users, active logins, live problem triage, resolved work orders, and pending dispatches.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="w-full md:w-auto flex gap-1 bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'metrics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            📊 Statistics
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'complaints' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            Incident Triage ({totalRegistered})
          </button>
          <button
            onClick={() => { setActiveTab('users'); loadUsersList(); }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            👥 User Audit ({registeredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'workers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            👷 Staff ({workers.length})
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* TAB: COMPREHENSIVE MUNICIPAL METRICS DASHBOARD */}
      {activeTab === 'metrics' && (
        <div className="flex flex-col gap-6">
          
          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Registered Problems */}
            <div className="glass-panel p-5 border-l-4 border-l-indigo-500 bg-black/40">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                <span>Total Registered</span>
                <Database size={16} className="text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2">{totalRegistered}</div>
              <p className="text-[11px] text-slate-400 mt-1">Total citizen complaints logged</p>
            </div>

            {/* Resolved Problems */}
            <div className="glass-panel p-5 border-l-4 border-l-emerald-500 bg-black/40">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                <span>Resolved Problems</span>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 mt-2">{totalResolved}</div>
              <p className="text-[11px] text-emerald-300/80 mt-1">{resolutionPercentage}% Success resolution rate</p>
            </div>

            {/* Pending Problems */}
            <div className="glass-panel p-5 border-l-4 border-l-rose-500 bg-black/40">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                <span>Pending Problems</span>
                <AlertCircle size={16} className="text-rose-400" />
              </div>
              <div className="text-3xl font-black text-rose-400 mt-2">{totalPending}</div>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting crew assignment</p>
            </div>

            {/* In Progress / Active */}
            <div className="glass-panel p-5 border-l-4 border-l-amber-500 bg-black/40">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                <span>In Progress (On-Site)</span>
                <Clock size={16} className="text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-400 mt-2">{totalInProgress}</div>
              <p className="text-[11px] text-slate-400 mt-1">Crew actively dispatched on-site</p>
            </div>

          </div>

          {/* Breakdown by Category & Ward */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Status Breakdown Bar */}
            <div className="glass-panel p-6 border-white/10 bg-black/40">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-indigo-400" /> Resolution Telemetry Progress
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-400">Resolved ({totalResolved})</span>
                    <span className="text-slate-300">{totalRegistered > 0 ? Math.round((totalResolved / totalRegistered) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${totalRegistered > 0 ? (totalResolved / totalRegistered) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-400">In Progress / Cleaning ({totalInProgress})</span>
                    <span className="text-slate-300">{totalRegistered > 0 ? Math.round((totalInProgress / totalRegistered) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${totalRegistered > 0 ? (totalInProgress / totalRegistered) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-rose-400">Pending / Unassigned ({totalPending})</span>
                    <span className="text-slate-300">{totalRegistered > 0 ? Math.round((totalPending / totalRegistered) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${totalRegistered > 0 ? (totalPending / totalRegistered) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Municipal User Registry Stats */}
            <div className="glass-panel p-6 border-white/10 bg-black/40 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Users size={18} className="text-emerald-400" /> Registered Municipal Network
                </h3>
                <p className="text-xs text-slate-300 mb-4">Live tally of authenticated accounts across Kanpur</p>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[11px] text-slate-400 font-semibold">Citizens</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      {registeredUsers.filter(u => u.role === 'citizen').length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[11px] text-slate-400 font-semibold">Field Crew</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">{workers.length}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[11px] text-slate-400 font-semibold">Admins</div>
                    <div className="text-2xl font-black text-indigo-400 mt-1">
                      {registeredUsers.filter(u => u.role === 'admin').length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-slate-400">View complete user credentials audit</span>
                <button onClick={() => { setActiveTab('users'); loadUsersList(); }} className="btn btn-secondary btn-sm text-xs font-bold">
                  Open User Audit Table ➔
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB: REGISTERED USERS & ACTIVE LOGINS AUDIT */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-indigo-400" /> User Registration & Login Audit Log
              </h2>
              <p className="text-xs text-slate-400">Complete audit of who is registered, active roles, contact numbers, and last login timestamps</p>
            </div>
            
            <button onClick={loadUsersList} className="btn btn-secondary btn-sm text-xs">
              Refresh Users List
            </button>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Full Name & Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Mobile Contact</th>
                <th className="py-3 px-4">Registered Address / Locality</th>
                <th className="py-3 px-4">Last Login Time</th>
              </tr>
            </thead>
            <tbody>
              {registeredUsers.map((user) => (
                <tr key={user.id || user.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-xs text-emerald-400">
                    {user.userId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <Mail size={11} className="text-slate-400" /> {user.email}
                      {user.isEmailVerified && (
                        <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30 flex items-center gap-0.5" title="Email Verified">
                          <Check size={9} /> Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      user.role === 'worker' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'badge-resolved'
                    } text-[10px]`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Phone size={11} className="text-emerald-400" /> {user.phone}
                      {user.isPhoneVerified && (
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5" title="Mobile Verified">
                          <Check size={9} /> Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-300">
                    <div className="flex items-center gap-1">
                      <MapPin size={11} className="text-emerald-400 flex-shrink-0" /> {user.address || 'Kanpur, UP'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} className="text-slate-500" />
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Recent'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: COMPLAINTS & INCIDENT MANAGEMENT */}
      {activeTab === 'complaints' && (
        <div className="glass-panel p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Live Kanpur Complaint Triage Queue</h2>
              <span className="text-xs text-slate-400">
                Total: <strong>{totalRegistered}</strong> | Resolved: <strong className="text-emerald-400">{totalResolved}</strong> | In Progress: <strong className="text-amber-400">{totalInProgress}</strong> | Pending: <strong className="text-rose-400">{totalPending}</strong>
              </span>
            </div>
            
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5 font-bold border-emerald-500/40 text-emerald-300"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" /> Export CSV Spreadsheet
            </button>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Citizen Photo</th>
                <th className="py-3 px-4">Issue & Landmark</th>
                <th className="py-3 px-4">Severity / Score</th>
                <th className="py-3 px-4">Status & Proof</th>
                <th className="py-3 px-4">Assigned Crew</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(item => (
                <tr key={item.ticketId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-xs text-white">
                    <div>{item.ticketId}</div>
                    <span className="text-[10px] text-emerald-400 font-normal">{item.citizenUserId || 'KAN-CIT-1042'}</span>
                  </td>
                  
                  {/* Citizen Uploaded Image */}
                  <td className="py-3 px-4">
                    {item.imageUrl ? (
                      <div 
                        onClick={() => setPreviewImageModal({
                          url: item.imageUrl,
                          title: item.title,
                          type: 'Citizen Reported Issue Photo',
                          ticketId: item.ticketId,
                          date: item.createdAt,
                          location: item.locationName,
                          citizen: `${item.citizenName || 'Citizen'} (${item.citizenUserId || 'KAN-CIT-1042'})`
                        })}
                        className="relative group cursor-pointer w-14 h-14 rounded-xl overflow-hidden border border-white/20 hover:border-emerald-400 transition-all shadow-md bg-black/40"
                        title="Click to view citizen uploaded image"
                      >
                        <img 
                          src={item.imageUrl} 
                          alt="Citizen upload" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye size={16} className="text-white drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-slate-500 bg-black/20">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-emerald-400" /> {item.locationName}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="badge badge-high text-[10px]">★ {item.priorityScore}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`badge ${
                        item.status === 'Resolved' ? 'badge-resolved' : 
                        item.status === 'In Progress' ? 'badge-progress' : 
                        item.status === 'Assigned' ? 'badge-high' : 'badge-reported'
                      } text-[10px]`}>
                        {item.status}
                      </span>

                      {/* Worker Cleanup Proof Image Badge/Button */}
                      {item.resolvedProofImage && (
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal({
                            url: item.resolvedProofImage,
                            title: `Cleaned: ${item.title}`,
                            type: 'Worker After-Cleanup Proof Photo',
                            ticketId: item.ticketId,
                            date: item.resolvedAt,
                            location: item.locationName,
                            citizen: `Resolved by ${item.assignedWorkerName || 'Field Crew'}`
                          })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-colors"
                        >
                          <Check size={10} className="text-emerald-400" /> View Cleaned Proof
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {item.assignedWorkerName ? (
                      <div>
                        <div className="font-semibold text-white">{item.assignedWorkerName}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-emerald-400" /> {item.assignedWorkerPhone || '+91 98112-33441'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-400 font-semibold">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.status === 'Reported' && (
                      <button 
                        onClick={() => handleOpenAssignModal(item)} 
                        className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 ml-auto"
                      >
                        <UserPlus size={13} /> Assign to Crew
                      </button>
                    )}
                    {item.status === 'Assigned' && (
                      <button onClick={() => onStatusChange(item.ticketId, 'In Progress')} className="btn btn-secondary btn-sm text-xs">
                        Mark In Progress
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: LIST OF CREWS TO ASSIGN */}
      {assignModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel bg-[#0f172a] max-w-lg w-full p-6 border-indigo-500/40 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setAssignModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase mb-1">
                <UserCheck size={12} /> Dispatch Sanitation Unit
              </div>
              <h3 className="text-xl font-bold text-white">Select Sanitation Crew</h3>
              <p className="text-xs text-slate-300 mt-1">
                Assigning crew for ticket <span className="font-mono text-emerald-400 font-bold">{selectedComplaint.ticketId}</span> ({selectedComplaint.title})
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mb-5">
              <label className="text-xs font-semibold text-slate-300">Choose from Active Kanpur Field Workers:</label>
              
              {workers.map((worker) => {
                const isSelected = selectedWorkerId === worker.id;
                return (
                  <div
                    key={worker.id}
                    onClick={() => setSelectedWorkerId(worker.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/10' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={worker.avatar} 
                        alt={worker.name} 
                        className={`w-11 h-11 rounded-full object-cover border-2 ${isSelected ? 'border-emerald-400' : 'border-white/20'}`} 
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {worker.name}
                          {isSelected && <span className="text-[10px] bg-emerald-500 text-black font-extrabold px-1.5 py-0.2 rounded-full">SELECTED</span>}
                        </div>
                        <div className="text-xs text-emerald-400 font-medium">{worker.role}</div>
                        <div className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-emerald-400" /> {worker.phone}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{worker.zone}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${worker.activeTasks === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {worker.activeTasks} Active Jobs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              <button 
                type="button" 
                onClick={() => setAssignModalOpen(false)} 
                className="btn btn-secondary btn-sm text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={isAssigning || !selectedWorkerId}
                className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 font-bold"
              >
                <Send size={13} /> {isAssigning ? 'Dispatching...' : 'Confirm Crew Assignment'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB: WORKER STAFF ROSTER */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="glass-panel p-6 border-indigo-500/30">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="text-emerald-400" size={18} /> Add Field Sanitation Worker
            </h2>
            <p className="text-xs text-slate-400 mb-4">Register new municipal worker with contact phone & assigned zone</p>

            <form onSubmit={handleAddWorker} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  className="input-field text-sm"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold flex items-center gap-1">
                  <Phone size={12} className="text-emerald-400" /> Mobile Number (Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98XXX-XXXXX"
                  className="input-field text-sm"
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Specialized Role</label>
                <select
                  className="input-field text-sm"
                  value={newWorkerRole}
                  onChange={(e) => setNewWorkerRole(e.target.value)}
                >
                  <option value="Rapid Sanitation Crew">Rapid Sanitation Crew</option>
                  <option value="Heavy Waste & Compactor Crew">Heavy Waste & Compactor Crew</option>
                  <option value="Drainage & Sewage Specialist">Drainage & Sewage Specialist</option>
                  <option value="Asphalt & Road Patch Unit">Asphalt & Road Patch Unit</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Assigned Ward Zone</label>
                <select
                  className="input-field text-sm"
                  value={newWorkerZone}
                  onChange={(e) => setNewWorkerZone(e.target.value)}
                >
                  <option value="Ward 01 - Kakadeo & Geeta Nagar">Ward 01 - Kakadeo & Geeta Nagar</option>
                  <option value="Ward 02 - Swaroop Nagar & Arya Nagar">Ward 02 - Swaroop Nagar & Arya Nagar</option>
                  <option value="Ward 03 - Kalyanpur & IIT Kanpur Zone">Ward 03 - Kalyanpur & IIT Kanpur Zone</option>
                  <option value="Ward 04 - Civil Lines & Mall Road">Ward 04 - Civil Lines & Mall Road</option>
                  <option value="Ward 05 - Govind Nagar & Fazalganj">Ward 05 - Govind Nagar & Fazalganj</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isAddingWorker}
                className="btn btn-primary w-full mt-2 font-bold"
              >
                {isAddingWorker ? 'Adding Worker...' : '+ Add Worker to Roster'}
              </button>
            </form>
          </div>

          <div className="glass-panel p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Active Field Worker Roster ({workers.length})</h2>
                <p className="text-xs text-slate-400">Manage field workers and their emergency contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workers.map(worker => (
                <div key={worker.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={worker.avatar} alt={worker.name} className="w-12 h-12 rounded-full object-cover border border-emerald-400/50" />
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{worker.name}</div>
                      <div className="text-xs text-emerald-400 font-semibold">{worker.role}</div>
                      <div className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-emerald-400" /> {worker.phone}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{worker.zone}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteWorker(worker.id)}
                    className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 hover:text-rose-200 transition-colors"
                    title="Remove worker from system"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB: DATA TELEMETRY & CSV SPREADSHEET EXPORT */}
      {activeTab === 'data' && (
        <div className="glass-panel p-8 max-w-3xl mx-auto border-indigo-500/30 text-center">
          <div className="inline-flex p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl mb-4">
            <FileSpreadsheet size={32} className="text-emerald-400" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">
            Kanpur Municipal Data Telemetry & CSV Center
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-6">
            Export municipal reports, citizen IDs, priority formulas, and worker execution logs directly in standard <strong className="text-emerald-400">.CSV format</strong> compatible with Excel, Google Sheets, and civic databases.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-left">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="text-xs text-slate-400">Total Registered</div>
              <div className="text-2xl font-black text-white mt-1">{totalRegistered}</div>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="text-xs text-slate-400">Resolved</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{totalResolved}</div>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="text-xs text-slate-400">Pending</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{totalPending}</div>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="text-xs text-slate-400">Registered Users</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{registeredUsers.length}</div>
            </div>
          </div>

          {exportSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2 font-bold">
              <CheckCircle2 size={16} /> {exportSuccessMsg}
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={isExportingCSV}
            className="btn btn-primary btn-lg font-bold shadow-xl shadow-emerald-500/30 flex items-center gap-2 mx-auto cursor-pointer"
          >
            <FileSpreadsheet size={20} /> {isExportingCSV ? 'Generating CSV...' : 'Download Municipal Data as .CSV'}
          </button>
        </div>
      )}

      {/* MODAL: FULL RESOLUTION IMAGE INSPECTION / VIEWER */}
      {previewImageModal && (
        <div 
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel bg-[#090d16] max-w-3xl w-full border-indigo-500/40 shadow-2xl overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                    {previewImageModal.type}
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {previewImageModal.title}
                  </h3>
                </div>
              </div>

              <button 
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Photo Body */}
            <div className="p-4 bg-black/80 flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img 
                src={previewImageModal.url} 
                alt={previewImageModal.title} 
                className="max-h-[60vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
              />
            </div>

            {/* Modal Details Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Ticket Reference</span>
                <span className="font-mono font-bold text-emerald-400">{previewImageModal.ticketId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="text-white font-medium truncate block">{previewImageModal.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Uploaded By</span>
                <span className="text-slate-200 font-medium truncate block">{previewImageModal.citizen}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-4 py-3 bg-black/40 border-t border-white/10 flex justify-end gap-2">
              <a 
                href={previewImageModal.url} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
              >
                <ExternalLink size={13} /> Open Full Size
              </a>
              <button 
                onClick={() => setPreviewImageModal(null)}
                className="btn btn-primary btn-sm text-xs font-bold"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
