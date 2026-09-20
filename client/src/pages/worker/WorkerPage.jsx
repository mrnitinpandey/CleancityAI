import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, CheckCircle2, Camera, UploadCloud, MapPin, Phone, 
  Send, Sparkles, AlertCircle, FileText, ArrowRight, X, Clock, AlertTriangle, Image as ImageIcon, Award, Flame, Star, Trophy, RefreshCw, Check, Video, VideoOff, SwitchCamera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateCrewKarma } from '../../utils/gamification';

/**
 * Resizes large smartphone camera photos into optimized web base64 format
 */
function resizeImageToDataUrl(file, maxWidth = 1280, maxHeight = 960, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const RESOLVED_DEMO_PHOTOS = [
  {
    title: 'Cleaned Road & Empty Bin',
    url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Unclogged & Disinfected Drain',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Patched Asphalt Surface',
    url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'
  }
];

export default function WorkerPage({ complaints = [], currentUser, onStatusChange, onResolve }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState('');
  const [customPhotoFile, setCustomPhotoFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('Area fully cleared of waste debris. Roadway swept, lime powder sanitized, and flow restored.');
  const [photoError, setPhotoError] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Live Camera Stream State for Field Worker
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // environment (back camera for on-site verification)
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  const startLiveCamera = async (mode = facingMode) => {
    setCameraError('');
    setIsLiveCameraActive(true);
    stopLiveCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Direct back-camera failed, attempting general camera', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play();
        }
      } catch (fallbackErr) {
        setCameraError('Camera access unavailable. Please grant browser camera permissions or upload an image.');
        setIsLiveCameraActive(false);
      }
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  const captureLiveSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCustomPhotoFile(snapshotDataUrl);
    setFileName(`Field_Cleanup_Shot_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`);
    setResolutionPhotoUrl('');
    setPhotoError('');
    stopLiveCamera();
  };

  // Filter tasks assigned to current logged in worker or uncompleted active jobs
  const myAssignedTasks = complaints.filter(c => {
    if (c.status === 'Resolved') return false;
    if (currentUser?.workerId && c.assignedWorkerId) {
      return c.assignedWorkerId === currentUser.workerId;
    }
    return true;
  });

  // Calculate resolved jobs completed by this crew
  const myResolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const crewStats = calculateCrewKarma(myResolvedCount);

  const handleOpenResolveModal = (task) => {
    setSelectedTask(task);
    setResolutionPhotoUrl('');
    setCustomPhotoFile(null);
    setFileName('');
    setPhotoError('');
    setIsResolveModalOpen(true);
  };

  const handleCustomPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingPhoto(true);
      setPhotoError('');
      try {
        const compressedBase64 = await resizeImageToDataUrl(file);
        setCustomPhotoFile(compressedBase64);
        setResolutionPhotoUrl('');
        setFileName(file.name);
      } catch (err) {
        console.error('Image processing failed, falling back to raw reader', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          setCustomPhotoFile(event.target.result);
          setResolutionPhotoUrl('');
          setFileName(file.name);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  const handleSelectDemoPhoto = (url) => {
    setResolutionPhotoUrl(url);
    setCustomPhotoFile(null);
    setFileName('');
    setPhotoError('');
  };

  const handleClearPhoto = () => {
    setCustomPhotoFile(null);
    setResolutionPhotoUrl('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitResolutionProof = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    const finalProofImg = customPhotoFile || resolutionPhotoUrl;

    if (!finalProofImg) {
      setPhotoError('Mandatory requirement: You must capture or attach an after-cleanup photo before marking the task as resolved.');
      return;
    }

    setIsSubmittingProof(true);
    try {
      await onResolve(selectedTask.ticketId, {
        afterImageUrl: finalProofImg,
        notes: resolutionNotes
      });
      setIsResolveModalOpen(false);
      confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      setPhotoError('Submission failed. Please check network connection and try again.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const hasPhotoSelected = Boolean(customPhotoFile || resolutionPhotoUrl);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Field Worker Profile Header with Points and Karma Tier */}
      <div className="glass-panel p-6 bg-gradient-to-r from-amber-500/15 via-transparent to-emerald-500/10 border-amber-500/30 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-black font-extrabold rounded-2xl shadow-lg shadow-amber-500/30">
            <Wrench size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Kanpur Nagar Nigam Field Sanitation Portal</h1>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Trophy size={11} /> {crewStats.rank}
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Field Worker: <strong className="text-white">{currentUser?.name || 'Rajesh Sharma'}</strong> • User ID: <span className="font-mono text-emerald-400">{currentUser?.userId || 'KAN-WRK-0012'}</span> • Mobile: <span className="text-emerald-400">{currentUser?.phone || '+91 98112-33441'}</span>
            </p>
          </div>
        </div>

        {/* Crew Gamification Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-center backdrop-blur-md">
            <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
              <Flame size={12} className="text-amber-400" fill="#f59e0b" /> Crew Karma
            </div>
            <div className="text-xl font-black text-amber-400">{crewStats.points} pts</div>
          </div>

          <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-center backdrop-blur-md">
            <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" /> Solved Proofs
            </div>
            <div className="text-xl font-black text-emerald-400">{myResolvedCount}</div>
          </div>

          <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-center backdrop-blur-md">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Active Jobs</div>
            <div className="text-xl font-black text-cyan-400">{myAssignedTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Unlocked Crew Badges Banner */}
      <div className="glass-panel p-5 border-amber-500/20 bg-black/40">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">Crew Achievement Badges & Recognition</h2>
          </div>
          <span className="text-xs text-amber-400 font-semibold">{crewStats.unlockedBadges.length} of {crewStats.allBadges.length} Unlocked</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {crewStats.allBadges.map(badge => {
            const isUnlocked = myResolvedCount >= badge.threshold;
            return (
              <div 
                key={badge.id}
                className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  isUnlocked 
                    ? 'border-amber-500/40 bg-amber-500/10 shadow-md shadow-amber-500/5' 
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

      {/* Task Queue Cards */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-amber-400" /> Active Job Queue ({myAssignedTasks.length})
          </h2>
          <span className="text-xs text-slate-400">Step 1: Start Cleanup ➔ Step 2: Upload "After Photo" (Required) to Resolve (+150 pts)</span>
        </div>

        {myAssignedTasks.length === 0 ? (
          <div className="glass-panel p-12 text-center border-white/10">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white">All Field Tasks Completed!</h3>
            <p className="text-slate-400 text-xs mt-1">No pending work orders assigned in your zone currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myAssignedTasks.map(task => (
              <div key={task.ticketId} className="glass-panel p-5 flex flex-col gap-4 border-amber-500/30">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-slate-400 font-bold">{task.ticketId}</span>
                  <span className={`badge ${task.status === 'In Progress' ? 'badge-progress' : 'badge-high'} text-[10px]`}>
                    {task.status}
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden h-48 border border-white/10">
                  <img src={task.imageUrl} alt={task.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2.5 left-2.5 badge badge-critical text-[10px] shadow-lg backdrop-blur-md">
                    Priority Score: {task.priorityScore}/100
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-white">{task.title}</h3>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                    <MapPin size={13} className="text-emerald-400 flex-shrink-0" /> {task.locationName}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Reported by: <strong className="text-slate-200">{task.citizenName}</strong> ({task.citizenPhone || '+91 98765-43210'})
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-white/10">
                  {task.status === 'Assigned' && (
                    <button 
                      onClick={() => onStatusChange(task.ticketId, 'In Progress')} 
                      className="btn btn-secondary btn-sm flex-1 text-xs font-bold"
                    >
                      Start Cleanup (In Progress)
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleOpenResolveModal(task)} 
                    className="btn btn-primary btn-sm flex-1 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Camera size={14} /> Upload Proof Photo & Resolve (+150 pts)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESOLUTION PROOF UPLOAD MODAL */}
      {isResolveModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel bg-[#0d1322] max-w-xl w-full p-6 md:p-8 border-emerald-500/40 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setIsResolveModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase mb-1">
                <Camera size={12} /> Work Completion Proof • Required Photo
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">Upload Cleaned Area Photo</h2>
              <p className="text-xs text-slate-300 mt-1">
                Ticket <span className="font-mono text-emerald-400 font-bold">{selectedTask.ticketId}</span> ({selectedTask.title})
              </p>
            </div>

            {/* Photo Error Banner if attempted without photo */}
            {photoError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle size={16} className="flex-shrink-0 text-rose-400" />
                <span>{photoError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitResolutionProof} className="flex flex-col gap-4">
              
              {/* Before vs After Preview Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-white/10 rounded-xl p-2 bg-white/5">
                  <div className="text-[11px] font-bold text-rose-400 mb-1 flex items-center gap-1">
                    Original Issue (Before)
                  </div>
                  <img 
                    src={selectedTask.imageUrl} 
                    alt="Before" 
                    className="w-full h-28 object-cover rounded-lg border border-white/10"
                  />
                </div>

                <div className={`rounded-xl p-2 transition-all ${
                  hasPhotoSelected 
                    ? 'border border-emerald-500/50 bg-emerald-500/10' 
                    : 'border-2 border-dashed border-amber-500/50 bg-amber-500/5'
                }`}>
                  <div className="text-[11px] font-bold text-emerald-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Cleaned Proof (After)</span>
                    {!hasPhotoSelected && <span className="text-amber-400 font-bold text-[10px] uppercase">Photo Required</span>}
                  </div>
                  
                  {hasPhotoSelected ? (
                    <img 
                      src={customPhotoFile || resolutionPhotoUrl} 
                      alt="After Proof" 
                      className="w-full h-28 object-cover rounded-lg border border-emerald-500/50 shadow-md"
                    />
                  ) : (
                    <div className="w-full h-28 rounded-lg border border-white/10 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-2">
                      <ImageIcon size={24} className="text-amber-400 mb-1" />
                      <span>Select or upload photo below to unlock submit</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Photo Selection */}
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-semibold">
                  1. Choose Sample On-Site Cleaned Photo or Upload Live Camera Shot <span className="text-rose-400">*</span>:
                </label>
                
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  {RESOLVED_DEMO_PHOTOS.map((dp, i) => {
                    const isPicked = resolutionPhotoUrl === dp.url && !customPhotoFile;
                    return (
                      <div
                        key={i}
                        onClick={() => handleSelectDemoPhoto(dp.url)}
                        className={`p-1.5 rounded-xl border cursor-pointer transition-all ${
                          isPicked 
                            ? 'border-emerald-500 bg-emerald-500/25 ring-2 ring-emerald-500/50' 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <img src={dp.url} alt={dp.title} className="w-full h-14 object-cover rounded-md mb-1" />
                        <div className="text-[10px] font-bold text-slate-200 truncate">{dp.title}</div>
                      </div>
                    );
                  })}
                </div>

                {/* WORKER LIVE CAMERA OR DROPZONE */}
                {isLiveCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 shadow-2xl p-2 flex flex-col items-center">
                    <div className="relative w-full max-h-[300px] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-auto max-h-[300px] object-cover rounded-lg"
                      />

                      {/* Live indicator */}
                      <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span> FIELD CAMERA LIVE
                      </div>

                      {/* Flip Camera */}
                      <button
                        type="button"
                        onClick={toggleCameraFacingMode}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all shadow-lg"
                        title="Flip camera"
                      >
                        <SwitchCamera size={16} />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between w-full mt-3 px-2 gap-2">
                      <button
                        type="button"
                        onClick={stopLiveCamera}
                        className="btn btn-secondary btn-sm text-xs font-semibold"
                      >
                        <VideoOff size={14} /> Cancel
                      </button>

                      <button
                        type="button"
                        onClick={captureLiveSnapshot}
                        className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 px-5 py-2 cursor-pointer"
                      >
                        <Camera size={16} /> Capture Cleanup Proof
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all ${
                      customPhotoFile 
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' 
                        : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-emerald-400/60'
                    }`}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleCustomPhotoUpload}
                      className="hidden"
                    />
                    
                    {isProcessingPhoto ? (
                      <div className="flex items-center justify-center gap-2 py-1 text-xs text-amber-300 font-semibold">
                        <RefreshCw size={16} className="animate-spin text-amber-400" />
                        <span>Optimizing and compressing high-res camera shot...</span>
                      </div>
                    ) : customPhotoFile ? (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-white truncate">
                            {fileName || 'Field Camera Image Attached'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearPhoto();
                          }}
                          className="text-[11px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-md font-bold transition-colors"
                        >
                          Change Photo
                        </button>
                      </div>
                    ) : (
                      <div>
                        {cameraError && (
                          <div className="mb-2 p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs">
                            {cameraError}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-1.5">
                          <button
                            type="button"
                            onClick={() => startLiveCamera()}
                            className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 py-2 px-4 cursor-pointer"
                          >
                            <Video size={15} /> Open Live Camera
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-secondary btn-sm text-xs font-bold flex items-center gap-1.5 py-2 px-4 cursor-pointer"
                          >
                            <UploadCloud size={15} /> Choose Photo File
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-400 block">
                          Captures direct on-site camera feed or smartphone gallery images
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold flex items-center gap-1">
                  <FileText size={13} className="text-emerald-400" /> 2. Sanitation Action Notes:
                </label>
                <textarea
                  required
                  rows="2"
                  className="input-field text-xs"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe actions taken (e.g. swept road, disinfected with lime, restored drain flow)..."
                />
              </div>

              {/* Submit Resolution Action */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <div className="text-[11px] text-slate-400">
                  {hasPhotoSelected ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Photo attached & ready (+150 pts)
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">
                      * Photo attachment required to submit
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsResolveModalOpen(false)} 
                    className="btn btn-secondary btn-sm text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProof || !hasPhotoSelected}
                    className={`btn btn-sm text-xs flex items-center gap-1.5 font-bold shadow-lg ${
                      hasPhotoSelected 
                        ? 'btn-primary shadow-emerald-500/25 cursor-pointer' 
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <CheckCircle2 size={14} /> {isSubmittingProof ? 'Verifying & Submitting...' : 'Submit Proof & Earn +150 pts'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
