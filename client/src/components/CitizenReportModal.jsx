import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, UploadCloud, MapPin, CheckCircle2, 
  AlertTriangle, X, Image as ImageIcon, ArrowRight, ShieldCheck, AlertCircle, FileCheck,
  Video, VideoOff, SwitchCamera
} from 'lucide-react';

const KANPUR_PRESETS = [
  {
    id: "kakadeo_overflow",
    title: "Overflowing Garbage Dumpster near Coaching Hub",
    category: "Garbage Overflow",
    imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
    resolvedImageUrl: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800&q=80",
    description: "Massive pile of uncollected municipal waste spilling onto sidewalk near Rave 3 Mall.",
    locationName: "Kakadeo Market Crossing, Near Rave 3 Mall, Kanpur",
    lat: 26.4727,
    lng: 80.3012,
    ward: "Ward 01 - Kakadeo & Geeta Nagar",
    severity: "High",
    confidence: 96,
  },
  {
    id: "swaroop_drain",
    title: "Severe Drainage Clogging with Stagnant Sewage",
    category: "Blocked Drainage",
    imageUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    resolvedImageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    description: "Drain choked with polythene bags causing dirty sewer water overflow near Hallet Hospital.",
    locationName: "Swaroop Nagar, Near Hallet (LLR) Hospital, Kanpur",
    lat: 26.4850,
    lng: 80.3250,
    ward: "Ward 02 - Swaroop Nagar & Arya Nagar",
    severity: "Critical",
    confidence: 98,
  },
  {
    id: "kalyanpur_pothole",
    title: "Dangerous Asphalt Crater on GT Road",
    category: "Pothole & Road Hazard",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    resolvedImageUrl: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
    description: "Deep road crater near IIT Kanpur Gate on GT Road causing two-wheeler hazard.",
    locationName: "GT Road Kalyanpur, Near IIT Kanpur Main Gate",
    lat: 26.5120,
    lng: 80.2329,
    ward: "Ward 03 - Kalyanpur & IIT Kanpur Zone",
    severity: "High",
    confidence: 94
  }
];

const KANPUR_LOCALITIES = [
  'Kakadeo & Geeta Nagar',
  'Swaroop Nagar & Arya Nagar',
  'Kalyanpur & IIT Kanpur Gate',
  'Civil Lines & Mall Road',
  'Govind Nagar & Fazalganj',
  'Kidwai Nagar & Yashoda Nagar',
  'Barra & Gujaini Sector',
  'Gumti No. 5 & Harsh Nagar',
  'Parade Market & Naveen Market',
  'Jajmau & Ganga Barrage Area'
];

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

export default function CitizenReportModal({ isOpen, onClose, currentUser, onSubmitReport, isSubmitting }) {
  const [selectedPreset, setSelectedPreset] = useState(KANPUR_PRESETS[0]);
  const [customPhotoFile, setCustomPhotoFile] = useState(null);
  const [useCustomUpload, setUseCustomUpload] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Garbage Overflow');
  const [customSeverity, setCustomSeverity] = useState('High');
  const [customAddress, setCustomAddress] = useState('');
  const [selectedLocality, setSelectedLocality] = useState(KANPUR_LOCALITIES[0]);
  const [customDescription, setCustomDescription] = useState('');
  const [imageError, setImageError] = useState('');

  // Live Camera Stream State
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back camera) or 'user' (webcam)
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera stream when modal unmounts or closes
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  const startLiveCamera = async (mode = facingMode) => {
    setCameraError('');
    setIsLiveCameraActive(true);
    stopLiveCamera(); // stop any previous stream

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device API is not supported on this browser.');
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
      console.warn('Direct getUserMedia failed, attempting fallback constraints', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play();
        }
      } catch (fallbackErr) {
        console.error('Camera access error:', fallbackErr);
        setCameraError('Camera access unavailable. Please permit camera permissions or upload a photo file.');
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
    setFileName(`Live_Camera_Shot_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`);
    setUseCustomUpload(true);
    setImageError('');
    stopLiveCamera();
  };

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingPhoto(true);
      setImageError('');
      try {
        const compressedBase64 = await resizeImageToDataUrl(file);
        setCustomPhotoFile(compressedBase64);
        setFileName(file.name);
        setUseCustomUpload(true);
      } catch (err) {
        console.error('Image compression failed', err);
        // Fallback to standard FileReader
        const reader = new FileReader();
        reader.onload = (event) => {
          setCustomPhotoFile(event.target.result);
          setFileName(file.name);
          setUseCustomUpload(true);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  const handleSelectPreset = (p) => {
    setSelectedPreset(p);
    setUseCustomUpload(false);
    setCustomPhotoFile(null);
    setFileName('');
    setCustomTitle(p.title);
    setCustomCategory(p.category);
    setCustomSeverity(p.severity);
    setCustomDescription(p.description);
    setImageError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const activeImage = useCustomUpload ? customPhotoFile : selectedPreset?.imageUrl;
    if (!activeImage) {
      setImageError('Mandatory: Please attach or select an issue photo before submitting.');
      return;
    }

    const payload = {
      title: customTitle || selectedPreset.title,
      category: customCategory || selectedPreset.category,
      severity: customSeverity || selectedPreset.severity,
      imageUrl: activeImage,
      locationName: customAddress ? `${customAddress}, ${selectedLocality}, Kanpur` : selectedPreset.locationName,
      ward: selectedLocality,
      city: 'Kanpur',
      lat: selectedPreset.lat || 26.4727,
      lng: selectedPreset.lng || 80.3012,
      description: customDescription || selectedPreset.description,
      citizenName: currentUser.name,
      citizenPhone: currentUser.phone,
      citizenUserId: currentUser.userId
    };

    onSubmitReport(payload);
  };

  const hasActiveImage = Boolean((useCustomUpload && customPhotoFile) || (!useCustomUpload && selectedPreset?.imageUrl));

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-panel bg-[#0d1322] max-w-xl w-full p-6 md:p-8 border-emerald-500/40 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase mb-1">
            <Camera size={12} /> Kanpur Nagar Nigam AI Civic Scanner
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">Report Cleanliness Hazard</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Attach verified issue photo to trigger automated AI classification and sanitation dispatch.
          </p>
        </div>

        {/* Verified Citizen Badge */}
        <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-300">Reporting Citizen: </span>
            <strong className="text-white">{currentUser.name}</strong>
          </div>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
            {currentUser.userId} (+50 pts)
          </span>
        </div>

        {/* Image Error Alert */}
        {imageError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} className="flex-shrink-0 text-rose-400" />
            <span>{imageError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* 1. PHOTO UPLOAD SECTION (MANDATORY) */}
          <div className="border border-white/10 p-3.5 rounded-2xl bg-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Camera size={14} /> 1. Upload Issue Photo <span className="text-rose-400">* (Required)</span>
              </label>
              {hasActiveImage && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Photo Attached & Ready
                </span>
              )}
            </div>

            {/* LIVE CAMERA VIEWFINDER OR DROPZONE */}
            {isLiveCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 shadow-2xl p-2 flex flex-col items-center">
                <div className="relative w-full max-h-[320px] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-auto max-h-[320px] object-cover rounded-lg"
                  />

                  {/* Live recording indicator */}
                  <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white"></span> LIVE CAMERA
                  </div>

                  {/* Switch camera button (if on mobile with multi-lens) */}
                  <button
                    type="button"
                    onClick={toggleCameraFacingMode}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all shadow-lg"
                    title="Flip camera"
                  >
                    <SwitchCamera size={16} />
                  </button>
                </div>

                {/* Camera Action Buttons */}
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
                    <Camera size={16} /> Capture Live Image
                  </button>
                </div>
              </div>
            ) : (
              <div className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all relative ${
                useCustomUpload && customPhotoFile 
                  ? 'border-emerald-500 bg-emerald-500/15' 
                  : 'border-white/20 bg-black/40 hover:border-emerald-500/50'
              }`}>
                {isProcessingPhoto ? (
                  <div className="py-4 text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
                    <Sparkles size={16} className="animate-spin" /> Processing & Optimizing Photo...
                  </div>
                ) : useCustomUpload && customPhotoFile ? (
                  <div className="flex items-center gap-3">
                    <img src={customPhotoFile} alt="Uploaded Cleanliness Hazard" className="w-24 h-18 object-cover rounded-lg border border-emerald-500/50 shadow-md" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <FileCheck size={14} className="text-emerald-400" /> {fileName || 'Uploaded Camera Photo'}
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium mt-0.5">✓ Successfully optimized for AI scanning</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setCustomPhotoFile(null); setUseCustomUpload(false); setFileName(''); }}
                      className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    {cameraError && (
                      <div className="mb-2 p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs">
                        {cameraError}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => startLiveCamera()}
                        className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 py-2 px-4 cursor-pointer"
                      >
                        <Video size={15} /> Open Live Camera Stream
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm text-xs font-bold flex items-center gap-1.5 py-2 px-4 cursor-pointer"
                      >
                        <UploadCloud size={15} /> Browse Image File
                      </button>
                    </div>

                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports direct live camera feed, webcam, or high-res photos from smartphone
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Demo Photo Presets */}
            <div>
              <span className="text-[11px] text-slate-300 block mb-1.5 font-medium">Or choose quick Kanpur issue scenario:</span>
              <div className="grid grid-cols-3 gap-2">
                {KANPUR_PRESETS.map((p) => {
                  const isPicked = !useCustomUpload && selectedPreset?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-1.5 rounded-xl border cursor-pointer transition-all ${
                        isPicked 
                          ? 'border-emerald-500 bg-emerald-500/25 ring-2 ring-emerald-500/40 shadow-md' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <img src={p.imageUrl} alt={p.title} className="w-full h-14 object-cover rounded-lg mb-1" />
                      <div className="text-[10px] font-bold text-white truncate">{p.category}</div>
                      <div className="text-[9px] text-amber-400">{p.severity} Severity</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. ISSUE DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">Category</label>
              <select
                className="input-field text-xs"
                value={customCategory || selectedPreset.category}
                onChange={(e) => setCustomCategory(e.target.value)}
              >
                <option value="Garbage Overflow">Garbage Overflow</option>
                <option value="Blocked Drainage">Blocked Drainage / Sewage</option>
                <option value="Pothole & Road Hazard">Pothole & Road Hazard</option>
                <option value="Illegal Waste Dumping">Illegal Waste Dumping</option>
                <option value="Dead Animal Sanitation">Dead Animal Sanitation</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-semibold">Estimated Severity</label>
              <select
                className="input-field text-xs"
                value={customSeverity || selectedPreset.severity}
                onChange={(e) => setCustomSeverity(e.target.value)}
              >
                <option value="Critical">Critical (Immediate SLA &lt; 4h)</option>
                <option value="High">High (Target SLA &lt; 12h)</option>
                <option value="Medium">Medium (Target SLA &lt; 24h)</option>
              </select>
            </div>
          </div>

          {/* 3. KANPUR LOCATION */}
          <div className="border border-white/10 p-3 rounded-2xl bg-white/5 flex flex-col gap-2.5">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <MapPin size={13} /> 2. Kanpur Location & Landmark
            </div>
            
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Street / House / Market Landmark</label>
              <input
                type="text"
                className="input-field text-xs"
                placeholder="e.g. Near Gurudev Crossing, Kakadeo"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Kanpur Municipal Locality / Ward</label>
              <select
                className="input-field text-xs"
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
              >
                {KANPUR_LOCALITIES.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <div className="text-[11px]">
              {hasActiveImage ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Image ready for AI analysis
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">
                  * Photo required to submit
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary btn-sm text-xs"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={isSubmitting || !hasActiveImage || isProcessingPhoto} 
                className={`btn btn-sm text-xs font-bold flex items-center gap-1.5 shadow-lg ${
                  hasActiveImage && !isProcessingPhoto
                    ? 'btn-primary shadow-emerald-500/25 cursor-pointer' 
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? 'Scanning & Submitting...' : 'Submit AI Complaint (+50 Karma pts)'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
