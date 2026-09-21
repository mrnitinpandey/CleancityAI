import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, UserCheck, ShieldCheck, Wrench, Lock, Mail, User, Phone, MapPin, 
  ArrowRight, Hash, CheckCircle2, KeyRound, Check, RefreshCw, Send, AlertTriangle, X
} from 'lucide-react';
import { loginAPI, registerAPI, sendOTPAPI, verifyOTPAPI, sendTestMailAPI } from '../services/api';

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

  // OTP Popup & Verification State
  const [isOtpPopupOpen, setIsOtpPopupOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // SMTP Test State
  const [testMailStatus, setTestMailStatus] = useState('');
  const [isTestingMail, setIsTestingMail] = useState(false);

  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Timer countdown effect for OTP popup
  useEffect(() => {
    let timer;
    if (isOtpPopupOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpPopupOpen, countdown]);

  if (!isOpen) return null;

  const handleSelectRoleOption = (selectedRoleId) => {
    setRole(selectedRoleId);
    setError('');
    setSuccessMsg('');
    
    // Auto-fill demo credentials for convenience in login mode
    if (!isRegister) {
      const match = ROLES.find(r => r.id === selectedRoleId);
      if (match) {
        setEmail(match.demoEmail);
        setPassword(match.demoPass);
      }
    }
  };

  // Dispatch OTP to Email
  const requestEmailOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address to receive your OTP.');
      return false;
    }
    setError('');
    setOtpError('');
    setIsSendingOtp(true);
    try {
      const res = await sendOTPAPI(email.trim(), 'email');
      if (res.success) {
        setSuccessMsg(`✓ Verification OTP sent to ${email}`);
        setCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setIsOtpPopupOpen(true);
        setTimeout(() => otpInputRefs[0]?.current?.focus(), 150);
        return true;
      } else {
        setError(res.message || 'Failed to send OTP to email.');
        return false;
      }
    } catch (err) {
      setError('Failed to connect to email verification service.');
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle individual digit input in OTP popup
  const handleDigitChange = (index, value) => {
    // Only accept numeric inputs
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setOtpError('');

    // If character entered, auto-focus next field
    if (char && index < 5) {
      otpInputRefs[index + 1]?.current?.focus();
    }
  };

  // Handle backspace and paste in OTP inputs
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs[index - 1]?.current?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(pastedData.length, 5);
    otpInputRefs[focusIndex]?.current?.focus();
  };

  // Verify OTP and complete Registration
  const handleVerifyOtpAndRegister = async () => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const verifyRes = await verifyOTPAPI(email.trim(), fullOtp);
      if (verifyRes.success) {
        setIsEmailVerified(true);
        setIsOtpPopupOpen(false);

        // Proceed to finalize registration immediately
        setLoading(true);
        const fullAddress = `${streetAddress || 'Premises'}, ${kanpurArea}, Kanpur, UP`;
        const regRes = await registerAPI({
          name,
          email: email.trim(),
          password,
          role,
          phone: phone || '+91 98765-43210',
          customUserId: customUserId.trim() || undefined,
          address: fullAddress,
          zone: kanpurArea
        });

        if (regRes.success) {
          onAuthSuccess(regRes.user);
          onClose();
        } else {
          setError(regRes.message || 'Registration failed after OTP verification');
        }
      } else {
        setOtpError(verifyRes.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setOtpError('Verification request failed. Please retry.');
    } finally {
      setIsVerifyingOtp(false);
      setLoading(false);
    }
  };

  // Main Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!email || !password || !name) {
        setError('Please fill in your name, email, and password.');
        return;
      }
      if (!isEmailVerified) {
        // Trigger OTP verification popup
        await requestEmailOTP();
        return;
      }
    }

    // Login Flow
    setLoading(true);
    try {
      const res = await loginAPI({ email: email.trim(), password, role });
      if (res.success) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection to auth server failed');
    } finally {
      setLoading(false);
    }
  };

  // Direct test email trigger
  const handleTriggerTestEmail = async () => {
    setIsTestingMail(true);
    setTestMailStatus('');
    try {
      const res = await sendTestMailAPI('nitinkumar.passionne@gmail.com');
      if (res.success) {
        setTestMailStatus('✓ Test email dispatched to nitinkumar.passionne@gmail.com!');
      } else {
        setTestMailStatus('❌ Test failed: ' + res.message);
      }
    } catch (err) {
      setTestMailStatus('❌ Server error sending test email');
    } finally {
      setIsTestingMail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel bg-[#0d1322] max-w-lg w-full p-6 md:p-8 border-emerald-500/40 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-2.5 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-2xl shadow-lg shadow-emerald-500/30 mb-2">
            <Sparkles size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">
            {isRegister ? 'Register CleanCity Account' : 'CleanCity AI Portal Login'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {isRegister ? 'Enter details & verify email with one-time OTP' : 'Choose your role to access features'}
          </p>
        </div>

        {/* ROLE SELECTION */}
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

        {successMsg && !isOtpPopupOpen && (
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
                  <User size={13} /> Full Name <span className="text-rose-400">*</span>
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

          {/* EMAIL INPUT WITH OTP BADGE */}
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
                    onClick={requestEmailOTP}
                    disabled={isSendingOtp || !email}
                    className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/30 px-2.5 py-0.5 rounded-full border border-indigo-500/40 transition-colors cursor-pointer"
                  >
                    {isSendingOtp ? 'Sending OTP...' : 'Send Verification OTP'}
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
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="text-xs text-slate-300 block mb-1 font-semibold flex items-center gap-1">
              <Lock size={13} /> Password <span className="text-rose-400">*</span>
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

          {/* MOBILE NUMBER & LOCALITY */}
          {isRegister && (
            <>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold flex items-center gap-1">
                  <Phone size={13} className="text-emerald-400" /> Mobile Number
                </label>
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="+91 98765-43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
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
            disabled={loading || isSendingOtp}
            className="btn btn-primary w-full mt-2 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
          >
            {loading ? 'Authenticating...' : isSendingOtp ? 'Sending OTP to Email...' : isRegister ? `Verify OTP & Register (${role.toUpperCase()})` : `Login as ${role.toUpperCase()}`}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Switch Login / Register */}
        <div className="text-center mt-4 text-xs text-slate-400 border-t border-white/10 pt-3 flex flex-col gap-2">
          {isRegister ? (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); handleSelectRoleOption(role); }}
                className="text-emerald-400 font-bold hover:underline ml-1 cursor-pointer"
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
                className="text-emerald-400 font-bold hover:underline ml-1 cursor-pointer"
              >
                Register New Role Account (with Email OTP)
              </button>
            </span>
          )}

          {/* Quick SMTP Test Button */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <span>Gmail SMTP Test:</span>
            <button
              type="button"
              onClick={handleTriggerTestEmail}
              disabled={isTestingMail}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
            >
              {isTestingMail ? 'Sending test mail...' : 'Send Test Mail to nitinkumar.passionne@gmail.com'}
            </button>
          </div>
          {testMailStatus && (
            <div className="text-[11px] text-emerald-400 font-medium">{testMailStatus}</div>
          )}
        </div>

      </div>

      {/* DEDICATED POPUP OTP VERIFICATION MODAL */}
      {isOtpPopupOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="glass-panel bg-[#0b101d] max-w-md w-full p-6 md:p-8 border-emerald-500/50 shadow-2xl relative rounded-2xl">
            
            <button
              onClick={() => setIsOtpPopupOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl mb-3 shadow-lg shadow-emerald-500/20">
                <KeyRound size={28} />
              </div>
              <h3 className="text-xl font-black text-white">Enter Verification Code</h3>
              <p className="text-xs text-slate-300 mt-1.5">
                We sent a 6-digit OTP code to:
              </p>
              <div className="inline-block mt-1 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-emerald-400">
                {email}
              </div>
            </div>

            {otpError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center font-semibold flex items-center justify-center gap-2">
                <AlertTriangle size={15} />
                <span>{otpError}</span>
              </div>
            )}

            {/* 6-DIGIT OTP INPUT BOXES */}
            <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpInputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-13 md:w-12 md:h-14 text-center text-xl font-bold font-mono rounded-xl border bg-black/60 text-emerald-400 transition-all focus:outline-none focus:scale-105 ${
                    digit 
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/20' 
                      : 'border-white/20 focus:border-emerald-400'
                  }`}
                />
              ))}
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={handleVerifyOtpAndRegister}
              disabled={isVerifyingOtp || otpDigits.join('').length < 6}
              className="btn btn-primary w-full py-3 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30"
            >
              {isVerifyingOtp ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Verifying OTP...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Verify & Complete Registration
                </>
              )}
            </button>

            {/* RESEND OTP & COUNTDOWN */}
            <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              {countdown > 0 ? (
                <span>Resend code in <strong className="text-emerald-400 font-mono">{countdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={requestEmailOTP}
                  disabled={isSendingOtp}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={13} className={isSendingOtp ? 'animate-spin' : ''} />
                  Resend OTP to Email
                </button>
              )}
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setIsOtpPopupOpen(false)}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
              >
                Change email address
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
