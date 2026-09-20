import React, { useState } from 'react';
import { 
  Sparkles, UserCheck, ShieldCheck, Wrench, Lock, Mail, User, Phone, MapPin, 
  ArrowRight, Hash, Home, CheckCircle2, ChevronRight, KeyRound, ShieldAlert, Check, RefreshCw
} from 'lucide-react';
import { loginAPI, registerAPI, sendOTPAPI, verifyOTPAPI } from '../services/api';

const KANPUR_AREAS = [
  'Kakadeo & Geeta Nagar',
  'Swaroop Nagar & Arya Nagar',
  'Kalyanpur & IIT Kanpur Gate',
  'Civil Lines & Mall Road',
  'Govind Nagar & Fazalganj',
  'Kidwai Nagar & Yashoda Nagar',
  'Barra & Gujaini Sector',
  'Gumti No. 5 & Harsh Nagar',
  'Parade Market & Naveen Market',
  'Jajmau & Ganga Barrage Road'
];

const ROLES = [
  {
    id: 'citizen',
    title: 'Citizen',
    subtitle: 'Report cleanliness issues & track resolutions',
    icon: UserCheck,
    activeColor: 'border-emerald-500 bg-emerald-500/15 text-emerald-400',
    badgeColor: 'bg-emerald-500 text-black',
    demoEmail: 'citizen@cleancity.ai',
    demoPass: 'password123'
  },
  {
    id: 'admin',
    title: 'Nagar Nigam Admin',
    subtitle: 'Manage complaints, assign crews & telemetry',
    icon: ShieldCheck,
    activeColor: 'border-indigo-500 bg-indigo-500/15 text-indigo-400',
    badgeColor: 'bg-indigo-600 text-white',
    demoEmail: 'admin@cleancity.ai',
    demoPass: 'admin123'
  },
  {
    id: 'worker',
    title: 'Field Sanitation Worker',
    subtitle: 'Receive tasks, start cleanup & submit photo proof',
    icon: Wrench,
    activeColor: 'border-amber-500 bg-amber-500/15 text-amber-400',
    badgeColor: 'bg-amber-500 text-black',
    demoEmail: 'rajesh@cleancity.ai',
    demoPass: 'worker123'
  }
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialRole = 'citizen' }) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [customUserId, setCustomUserId] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [kanpurArea, setKanpurArea] = useState(KANPUR_AREAS[0]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Mobile & Email OTP Verification States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  const [showPhoneOTPInput, setShowPhoneOTPInput] = useState(false);
  const [showEmailOTPInput, setShowEmailOTPInput] = useState(false);
  
  const [phoneOTP, setPhoneOTP] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  
  const [isSendingPhoneOTP, setIsSendingPhoneOTP] = useState(false);
  const [isSendingEmailOTP, setIsSendingEmailOTP] = useState(false);
  const [isVerifyingPhoneOTP, setIsVerifyingPhoneOTP] = useState(false);
  const [isVerifyingEmailOTP, setIsVerifyingEmailOTP] = useState(false);
  const [demoPhoneOtpCode, setDemoPhoneOtpCode] = useState('');
  const [demoEmailOtpCode, setDemoEmailOtpCode] = useState('');

  if (!isOpen) return null;

  const handleSelectRoleOption = (selectedRoleId) => {
    setRole(selectedRoleId);
    setError('');
    setSuccessMsg('');
    
    // Auto-fill demo credentials for convenience if in login mode
    if (!isRegister) {
      const match = ROLES.find(r => r.id === selectedRoleId);
      if (match) {
        setEmail(match.demoEmail);
        setPassword(match.demoPass);
      }
    }
  };

  // Trigger Phone OTP
  const handleSendPhoneOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number first.');
      return;
    }
    setError('');
    setIsSendingPhoneOTP(true);
    try {
      const res = await sendOTPAPI(phone, 'phone');
      if (res.success) {
        setShowPhoneOTPInput(true);
        setDemoPhoneOtpCode(res.otp || '123456');
        setSuccessMsg(`OTP sent to mobile ${phone}! (Code: ${res.otp || '123456'})`);
      } else {
        setError(res.message || 'Failed to send mobile OTP');
      }
    } catch (err) {
      setError('Failed to send mobile OTP. Please try again.');
    } finally {
      setIsSendingPhoneOTP(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOTP = async () => {
    if (!phoneOTP) return;
    setIsVerifyingPhoneOTP(true);
    setError('');
    try {
      const res = await verifyOTPAPI(phone, phoneOTP);
      if (res.success) {
        setIsPhoneVerified(true);
        setShowPhoneOTPInput(false);
        setSuccessMsg('✓ Mobile number verified successfully!');
      } else {
        setError(res.message || 'Incorrect Mobile OTP.');
      }
    } catch (err) {
      setError('OTP verification failed.');
    } finally {
      setIsVerifyingPhoneOTP(false);
    }
  };

  // Trigger Email OTP
  const handleSendEmailOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }
    setError('');
    setIsSendingEmailOTP(true);
    try {
      const res = await sendOTPAPI(email, 'email');
      if (res.success) {
        setShowEmailOTPInput(true);
        setDemoEmailOtpCode(res.otp || '123456');
        setSuccessMsg(`OTP sent to email ${email}! (Code: ${res.otp || '123456'})`);
      } else {
        setError(res.message || 'Failed to send email OTP');
      }
    } catch (err) {
      setError('Failed to send email OTP. Please try again.');
    } finally {
      setIsSendingEmailOTP(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOTP = async () => {
    if (!emailOTP) return;
    setIsVerifyingEmailOTP(true);
    setError('');
    try {
      const res = await verifyOTPAPI(email, emailOTP);
      if (res.success) {
        setIsEmailVerified(true);
        setShowEmailOTPInput(false);
        setSuccessMsg('✓ Email address verified successfully!');
      } else {
        setError(res.message || 'Incorrect Email OTP.');
      }
    } catch (err) {
      setError('Email OTP verification failed.');
    } finally {
      setIsVerifyingEmailOTP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fullAddress = `${streetAddress || 'Premises'}, ${kanpurArea}, Kanpur, UP`;
      if (isRegister) {
        const res = await registerAPI({ 
          name, 
          email, 
          password, 
          role, 
          phone, 
          customUserId: customUserId.trim() || undefined,
          address: fullAddress,
          zone: kanpurArea
        });
        if (res.success) {
          onAuthSuccess(res.user);
          onClose();
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        const res = await loginAPI({ email, password, role });
        if (res.success) {
          onAuthSuccess(res.user);
          onClose();
        } else {
          setError(res.message || 'Login failed');
        }
      }
    } catch (err) {
      setError('Connection to auth server failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel bg-[#0d1322] max-w-lg w-full p-6 md:p-8 border-emerald-500/40 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-2.5 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-2xl shadow-lg shadow-emerald-500/30 mb-2">
            <Sparkles size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">
            {isRegister ? 'Register New Account' : 'CleanCity AI Portal Login'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {isRegister ? 'Select your role and create your credentials' : 'Choose your role to access features'}
          </p>
        </div>

        {/* EXPLICIT LIST OF ROLE OPTIONS (CITIZEN, ADMIN, WORKER) */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wide">
            1. Select Your Account Role:
          </label>
          
          <div className="flex flex-col gap-2">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRoleOption(r.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected 
                      ? `${r.activeColor} shadow-md` 
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-black/30'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {r.title}
                        {isSelected && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full ${r.badgeColor}`}>
                            ACTIVE ROLE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">{r.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-white/30'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* Success / Info Notification Banner */}
        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-0.5">
            2. Enter Account Credentials ({role.toUpperCase()}):
          </div>

          {isRegister && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold flex items-center gap-1">
                  <User size={13} /> Full Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field text-sm"
                  placeholder="e.g. Vikram Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold flex items-center gap-1">
                  <Hash size={13} className="text-emerald-400" /> User ID (Optional)
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder={role === 'worker' ? 'e.g. KAN-WRK-0012' : role === 'admin' ? 'e.g. KAN-ADM-0001' : 'e.g. KAN-CIT-1042'}
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* EMAIL INPUT WITH OTP VERIFICATION SYSTEM */}
          <div className="border border-white/10 p-3 rounded-xl bg-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                <Mail size={13} /> Email Address <span className="text-rose-400">*</span>
              </label>
              
              {isRegister && (
                isEmailVerified ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Check size={11} /> Email Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendEmailOTP}
                    disabled={isSendingEmailOTP || !email}
                    className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/30 px-2.5 py-0.5 rounded-full border border-indigo-500/40 transition-colors"
                  >
                    {isSendingEmailOTP ? 'Sending OTP...' : 'Verify Email (OTP)'}
                  </button>
                )
              )}
            </div>

            <input
              type="email"
              required
              className="input-field text-sm"
              placeholder="name@cleancity.ai"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (isEmailVerified) setIsEmailVerified(false);
              }}
            />

            {/* Email OTP Verification Input */}
            {isRegister && showEmailOTPInput && !isEmailVerified && (
              <div className="mt-1 p-2.5 rounded-lg bg-black/50 border border-indigo-500/30 flex items-center gap-2 animate-in fade-in">
                <KeyRound size={15} className="text-indigo-400 flex-shrink-0" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-Digit Email OTP (e.g. 123456)"
                  className="input-field text-xs py-1.5 font-mono"
                  value={emailOTP}
                  onChange={(e) => setEmailOTP(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleVerifyEmailOTP}
                  disabled={isVerifyingEmailOTP || !emailOTP}
                  className="btn btn-primary btn-sm text-xs py-1.5 px-3 font-bold flex-shrink-0"
                >
                  {isVerifyingEmailOTP ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
            )}
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold flex items-center gap-1">
              <Lock size={13} /> Password
            </label>
            <input
              type="password"
              required
              className="input-field text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* MOBILE NUMBER INPUT WITH OTP VERIFICATION SYSTEM */}
          {isRegister && (
            <>
              <div className="border border-white/10 p-3 rounded-xl bg-white/5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                    <Phone size={13} className="text-emerald-400" /> Mobile Number <span className="text-rose-400">*</span>
                  </label>
                  
                  {isPhoneVerified ? (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Check size={11} /> Mobile Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendPhoneOTP}
                      disabled={isSendingPhoneOTP || !phone}
                      className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 hover:bg-emerald-500/30 px-2.5 py-0.5 rounded-full border border-emerald-500/40 transition-colors"
                    >
                      {isSendingPhoneOTP ? 'Sending OTP...' : 'Verify Mobile (OTP)'}
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  required
                  className="input-field text-sm"
                  placeholder="+91 98765-43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (isPhoneVerified) setIsPhoneVerified(false);
                  }}
                />

                {/* Mobile OTP Verification Input */}
                {showPhoneOTPInput && !isPhoneVerified && (
                  <div className="mt-1 p-2.5 rounded-lg bg-black/50 border border-emerald-500/30 flex items-center gap-2 animate-in fade-in">
                    <KeyRound size={15} className="text-emerald-400 flex-shrink-0" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-Digit Mobile OTP (e.g. 123456)"
                      className="input-field text-xs py-1.5 font-mono"
                      value={phoneOTP}
                      onChange={(e) => setPhoneOTP(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOTP}
                      disabled={isVerifyingPhoneOTP || !phoneOTP}
                      className="btn btn-primary btn-sm text-xs py-1.5 px-3 font-bold flex-shrink-0"
                    >
                      {isVerifyingPhoneOTP ? 'Verifying...' : 'Confirm'}
                    </button>
                  </div>
                )}
              </div>

              {/* Kanpur City Address Selection */}
              <div className="border border-white/10 p-3 rounded-xl bg-white/5 flex flex-col gap-2.5">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <MapPin size={13} /> Kanpur Locality & Ward Sector
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">House / Street / Landmark</label>
                    <input
                      type="text"
                      className="input-field text-xs"
                      placeholder="e.g. 112/A, Geeta Nagar"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Kanpur Area / Zone</label>
                    <select
                      className="input-field text-xs"
                      value={kanpurArea}
                      onChange={(e) => setKanpurArea(e.target.value)}
                    >
                      {KANPUR_AREAS.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-2 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
          >
            {loading ? 'Authenticating...' : isRegister ? `Register as ${role.toUpperCase()}` : `Login as ${role.toUpperCase()}`}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Switch Login / Register */}
        <div className="text-center mt-4 text-xs text-slate-400 border-t border-white/10 pt-3">
          {isRegister ? (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); handleSelectRoleOption(role); }}
                className="text-emerald-400 font-bold hover:underline ml-1"
              >
                Sign In to Existing Account
              </button>
            </span>
          ) : (
            <span>
              Need a new account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setEmail(''); setPassword(''); }}
                className="text-emerald-400 font-bold hover:underline ml-1"
              >
                Register New Role Account
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
