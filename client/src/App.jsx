import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, UserCheck, Wrench, Camera, MapPin, 
  CheckCircle2, AlertCircle, RefreshCw, Send, PlusCircle, Award, Flame, Search, ArrowRight, LogIn, LogOut, Phone, Hash, Lock, Star, Trophy, Medal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  checkHealth, 
  fetchComplaints, 
  submitComplaint, 
  assignWorkerAPI, 
  updateStatusAPI, 
  resolveComplaintAPI,
  fetchWorkers
} from './services/api';
import { calculateCitizenKarma } from './utils/gamification';
import AuthModal from './components/AuthModal';
import CitizenReportModal from './components/CitizenReportModal';
import AdminPage from './pages/admin/AdminPage';
import WorkerPage from './pages/worker/WorkerPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); // null means logged out
  const [role, setRole] = useState('citizen');
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRoleTarget, setAuthRoleTarget] = useState('citizen');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const health = await checkHealth();
      setHealthStatus(health);
      const list = await fetchComplaints();
      setComplaints(list);
      const staff = await fetchWorkers();
      setWorkers(staff);
    } catch (err) {
      console.error('Server sync error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Citizen Gamification Calculations
  const myReportsCount = complaints.filter(c => currentUser?.userId ? c.citizenUserId === currentUser.userId : true).length;
  const myResolvedCount = complaints.filter(c => (currentUser?.userId ? c.citizenUserId === currentUser.userId : true) && c.status === 'Resolved').length;
  const citizenKarma = calculateCitizenKarma(myReportsCount, myResolvedCount);

  const handleOpenReportModal = () => {
    if (!currentUser) {
      setAuthRoleTarget('citizen');
      setIsAuthModalOpen(true);
      return;
    }
    setIsReportOpen(true);
  };

  const handleRoleSwitch = (newRole) => {
    if (!currentUser || currentUser.role !== newRole) {
      setAuthRoleTarget(newRole);
      setIsAuthModalOpen(true);
    } else {
      setRole(newRole);
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setRole(user.role);
    confetti({ particleCount: 70, spread: 60 });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRole('citizen');
  };

  const handleReportSubmit = async (payload) => {
    if (!currentUser) {
      setIsReportOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitComplaint(payload);
      setIsReportOpen(false);
      await loadData();
      confetti({ particleCount: 90, spread: 70 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (ticketId, workerId) => {
    const workerToAssign = workerId || workers[0]?.id || 'w1';
    await assignWorkerAPI(ticketId, workerToAssign);
    await loadData();
  };

  const handleStatusChange = async (ticketId, status) => {
    await updateStatusAPI(ticketId, status);
    await loadData();
  };

  const handleResolve = async (ticketId, resolutionData) => {
    await resolveComplaintAPI(ticketId, {
      afterImageUrl: resolutionData?.afterImageUrl,
      notes: resolutionData?.notes || 'Kanpur Nagar Nigam field crew resolved the issue and disinfected road perimeter.'
    });
    await loadData();
    confetti({ particleCount: 100, spread: 80 });
  };

  return (
    <div className="app-bg-wrapper text-[#f8fafc] flex flex-col">
      <div className="ambient-glow" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          
          <div className="w-full md:w-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => setRole('citizen')}>
              <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-xl shadow-lg shadow-emerald-500/30 flex-shrink-0">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <div className="font-black text-xl sm:text-2xl tracking-tight leading-none flex items-center">
                  Clean<span className="text-emerald-400">City</span>
                  <span className="ml-2 text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">KANPUR</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-400/90 font-semibold tracking-wide mt-0.5">
                  Building a Cleaner Tomorrow
                </div>
              </div>
            </div>

            {/* Mobile-only Logout/Login Quick Button */}
            <div className="md:hidden flex items-center gap-1.5">
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              ) : (
                <button
                  onClick={() => { setAuthRoleTarget('citizen'); setIsAuthModalOpen(true); }}
                  className="btn btn-primary btn-sm text-xs font-bold py-1.5 px-3"
                >
                  <LogIn size={13} /> Login
                </button>
              )}
            </div>
          </div>

          {/* Role Switcher */}
          <div className="w-full md:w-auto flex items-center justify-center gap-1 bg-black/60 p-1 rounded-full border border-white/10 text-xs font-semibold backdrop-blur-md overflow-x-auto">
            <button
              onClick={() => handleRoleSwitch('citizen')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all text-xs whitespace-nowrap ${role === 'citizen' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              <UserCheck size={13} /> Citizen
            </button>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all text-xs whitespace-nowrap ${role === 'admin' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              <ShieldCheck size={13} /> Admin
            </button>
            <button
              onClick={() => handleRoleSwitch('worker')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all text-xs whitespace-nowrap ${role === 'worker' ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/30' : 'text-slate-300 hover:text-white'}`}
            >
              <Wrench size={13} /> Field Worker
            </button>
          </div>

          {/* Desktop Profile / Karma Status */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-white truncate max-w-[120px]">{currentUser.name}</span>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{currentUser.userId}</span>
                
                {currentUser.role === 'citizen' && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Flame size={11} fill="#f59e0b" /> {citizenKarma.points} pts
                  </span>
                )}

                <button
                  onClick={handleLogout}
                  className="ml-1 text-slate-400 hover:text-rose-400 p-1 transition-colors"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthRoleTarget('citizen'); setIsAuthModalOpen(true); }}
                className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-bold"
              >
                <LogIn size={14} /> Citizen Login / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 md:gap-8">
        
        {/* CITIZEN VIEW */}
        {role === 'citizen' && (
          <div className="flex flex-col gap-6 md:gap-8">
            
            {/* CleanCity Hero Banner */}
            <div className="glass-panel p-6 sm:p-8 md:p-12 relative overflow-hidden border-emerald-500/30">
              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles size={13} /> Building a Cleaner Kanpur
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3">
                  Smart Garbage Complaint <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                    Management System • Kanpur
                  </span>
                </h1>

                <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed mb-6">
                  AI-powered municipal cleanliness network spanning all areas of Kanpur. Upload photos of cleanliness hazards to earn Karma Points, unlock Swachh Badges, and track before/after verified resolution proofs.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <button 
                    onClick={handleOpenReportModal}
                    className="btn btn-primary btn-lg flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-500/30 text-sm sm:text-base"
                  >
                    Upload Photo & Report (+50 Karma pts) <ArrowRight size={18} />
                  </button>
                  
                  {!currentUser ? (
                    <button 
                      onClick={() => { setAuthRoleTarget('citizen'); setIsAuthModalOpen(true); }}
                      className="btn btn-secondary btn-lg flex items-center justify-center gap-2 text-xs sm:text-sm border-white/20"
                    >
                      <LogIn size={16} /> Login / Register
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleRoleSwitch('admin')}
                      className="btn btn-secondary btn-lg flex items-center justify-center gap-2 text-xs sm:text-sm border-white/20"
                    >
                      <ShieldCheck size={16} /> Nagar Nigam Operations
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Citizen Gamification Points & Badges Dashboard Card */}
            <div className="glass-panel p-6 border-emerald-500/30 bg-black/40">
              <div className="flex justify-between items-center flex-wrap gap-4 mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/40">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white">Citizen Swachh Karma Dashboard</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {citizenKarma.tier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Earn +50 pts per report filed with photo and +100 pts per verified resolution in Kanpur
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-black/50 px-4 py-2 rounded-2xl border border-white/10 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1">
                      <Flame size={12} className="text-amber-400" fill="#f59e0b" /> Karma Points
                    </div>
                    <div className="text-xl font-black text-amber-400">{citizenKarma.points} pts</div>
                  </div>
                  <div className="bg-black/50 px-4 py-2 rounded-2xl border border-white/10 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Reports Filed</div>
                    <div className="text-xl font-black text-emerald-400">{citizenKarma.reportsCount}</div>
                  </div>
                </div>
              </div>

              {/* Citizen Unlocked Badges Showcase */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Medal size={14} className="text-emerald-400" /> Civic Achievement Badges
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {citizenKarma.unlockedBadges.length} of {citizenKarma.allBadges.length} Badges Unlocked
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {citizenKarma.allBadges.map(badge => {
                    const isUnlocked = myReportsCount >= badge.threshold;
                    return (
                      <div 
                        key={badge.id}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                          isUnlocked 
                            ? 'border-emerald-500/40 bg-emerald-500/10 shadow-md shadow-emerald-500/5' 
                            : 'border-white/5 bg-white/5 opacity-40 grayscale'
                        }`}
                      >
                        <div className="text-2xl">{badge.icon}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                            {badge.name}
                            {isUnlocked && <Star size={10} className="text-amber-400 flex-shrink-0" fill="#f59e0b" />}
                          </div>
                          <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">{badge.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Complaints Feed */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Live Kanpur Cleanliness Incidents ({complaints.length})</h2>
                <p className="text-xs text-slate-300">Prioritized and tracked across all municipal wards of Kanpur</p>
              </div>
              <button onClick={handleOpenReportModal} className="btn btn-primary flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/20">
                <Camera size={16} /> Upload Photo & Report (+50 pts)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaints.map(item => (
                <div key={item.ticketId} className="glass-panel glass-panel-interactive p-4 flex flex-col gap-3">
                  <div className="relative rounded-xl overflow-hidden h-48 border border-white/10">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 badge badge-critical text-[10px] shadow-lg backdrop-blur-md">
                      {item.severity} • {item.priorityScore}/100 Score
                    </span>
                    <span className="absolute top-3 right-3 badge badge-progress text-[10px] shadow-lg backdrop-blur-md">
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>{item.ticketId}</span>
                      <span className="text-emerald-400 font-semibold">{item.citizenUserId || 'KAN-CIT-1042'}</span>
                    </div>
                    <div className="font-bold text-base mt-0.5 text-white">{item.title}</div>
                    <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                      <MapPin size={13} className="text-emerald-400" /> {item.locationName}
                    </div>
                  </div>

                  {item.status === 'Resolved' && item.afterImageUrl && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs">
                      <div className="font-bold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Verified Cleaned Proof Photo
                      </div>
                      <img src={item.afterImageUrl} alt="Cleaned" className="w-full h-28 object-cover rounded-lg mt-1 border border-emerald-500/50 shadow-md" />
                      {item.resolutionNotes && (
                        <div className="mt-2 text-[11px] text-slate-300 italic">
                          "{item.resolutionNotes}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMIN VIEW - STRICT AUTHENTICATION BARRIER */}
        {role === 'admin' && (
          currentUser && currentUser.role === 'admin' ? (
            <AdminPage
              complaints={complaints}
              workers={workers}
              onAssign={handleAssign}
              onStatusChange={handleStatusChange}
              onWorkersUpdated={loadData}
            />
          ) : (
            <div className="glass-panel p-8 md:p-12 text-center max-w-2xl mx-auto border-indigo-500/40 shadow-2xl">
              <div className="inline-flex p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/40 mb-4 shadow-lg shadow-indigo-500/20">
                <ShieldCheck size={36} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                Nagar Nigam Admin Authentication Required
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                The Municipal Command & Telemetry Center contains sensitive civic records, worker dispatch controls, and citizen audit data. You must sign in with an authorized <strong className="text-indigo-400">Admin Account</strong> to access this portal.
              </p>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 mb-6 text-left text-xs">
                <div className="text-slate-400 font-semibold mb-1">Administrative Access Security Checklist:</div>
                <ul className="text-slate-300 list-disc list-inside flex flex-col gap-1">
                  <li>Requires verified municipal email & phone verification</li>
                  <li>Municipal credentials encrypted with role-based session token</li>
                  <li>Audit trails permanently log all triage & assignment actions</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setAuthRoleTarget('admin');
                  setIsAuthModalOpen(true);
                }}
                className="btn btn-primary btn-lg font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 mx-auto"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}
              >
                <LogIn size={18} /> Sign In to Admin Portal
              </button>
            </div>
          )
        )}

        {/* WORKER VIEW - STRICT AUTHENTICATION BARRIER */}
        {role === 'worker' && (
          currentUser && currentUser.role === 'worker' ? (
            <WorkerPage
              complaints={complaints}
              currentUser={currentUser}
              onStatusChange={handleStatusChange}
              onResolve={handleResolve}
            />
          ) : (
            <div className="glass-panel p-8 md:p-12 text-center max-w-2xl mx-auto border-amber-500/40 shadow-2xl">
              <div className="inline-flex p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/40 mb-4 shadow-lg shadow-amber-500/20">
                <Wrench size={36} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                Field Worker Sanitation Login Required
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                The Field Worker Portal allows on-site sanitation crews to receive assigned tasks, mark in-progress jobs, upload "after cleanup" proof photos, and earn Karma points. Please authenticate with your <strong className="text-amber-400">Field Worker Credentials</strong>.
              </p>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 mb-6 text-left text-xs">
                <div className="text-slate-400 font-semibold mb-1">Field Crew Protocol Requirements:</div>
                <ul className="text-slate-300 list-disc list-inside flex flex-col gap-1">
                  <li>Mandatory GPS/Camera access for after-cleanup proof photos</li>
                  <li>Mobile OTP verification required for active dispatch</li>
                  <li>+150 Crew Karma points awarded upon verified task completion</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setAuthRoleTarget('worker');
                  setIsAuthModalOpen(true);
                }}
                className="btn btn-primary btn-lg font-extrabold text-black shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 mx-auto"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                <LogIn size={18} /> Sign In to Field Worker Portal
              </button>
            </div>
          )
        )}

      </main>

      {/* CITIZEN REPORT MODAL WITH PHOTO UPLOAD & VALIDATION */}
      <CitizenReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        currentUser={currentUser}
        onSubmitReport={handleReportSubmit}
        isSubmitting={isSubmitting}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialRole={authRoleTarget}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-6 text-center text-xs text-slate-400 bg-black/60 backdrop-blur-md mt-auto">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <strong>CleanCity AI Kanpur</strong> • Building a Cleaner Tomorrow
          </div>
          <div>
            Kanpur Nagar Nigam Smart Garbage Complaint Management System
          </div>
        </div>
      </footer>

    </div>
  );
}
