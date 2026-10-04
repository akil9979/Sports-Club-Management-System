import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Crown,
  ShieldCheck,
  Award,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Building2,
  Layers,
  ChevronRight,
  LogOut,
  CameraOff
} from 'lucide-react';
import {
  verifyMemberQrCode,
  logFrontdeskCheckIn,
  getFrontdeskCheckIns,
  scanVideoFrame,
  decodeQrFromFile,
  TIER_CONFIG
} from './qrVerificationService.js';
import { getMembers } from './membershipApi.js';
import { useStaffAuth } from '../staff/StaffAuthContext.jsx';
import PlanSelectionModal from './PlanSelectionModal.jsx';

const CLUB_FACILITIES = [
  'Tennis Court 1',
  'Tennis Court 2',
  'Badminton Arena #1',
  'Badminton Arena #2',
  'Box Cricket Arena',
  'Swimming Pool & Gym',
  'Sports Bar & Lounge',
  'Pro Shop & Gear',
  'General Clubhouse'
];

export default function FrontdeskVerificationWorkspace() {
  const staffAuth = useStaffAuth ? useStaffAuth() : null;
  const currentStaff = staffAuth?.currentStaff || { name: 'Frontdesk Officer', role: 'Frontdesk & Reception' };

  // Mode: 'camera' | 'upload' | 'manual'
  const [scanMode, setScanMode] = useState('camera');

  // Input states
  const [manualQuery, setManualQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  // Check-in action state
  const [selectedFacility, setSelectedFacility] = useState(CLUB_FACILITIES[0]);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInSuccessToast, setCheckInSuccessToast] = useState(null);

  // Check-in audit history
  const [checkInLogs, setCheckInLogs] = useState([]);
  const [stats, setStats] = useState({ totalScans: 0, activeVerified: 0, expiredFlagged: 0 });
  const [logFilter, setLogFilter] = useState('all');

  // Demo Roster for 1-click test
  const [demoMembers, setDemoMembers] = useState([]);

  // Renewal Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Camera scanner references
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'

  // Load check-in logs & demo roster on mount
  const refreshHistory = useCallback(async () => {
    try {
      const data = await getFrontdeskCheckIns();
      setCheckInLogs(data.logs || []);
      setStats(data.stats || { totalScans: 0, activeVerified: 0, expiredFlagged: 0 });
    } catch (e) {
      console.warn('Could not load check-in logs:', e);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
    getMembers()
      .then((roster) => setDemoMembers(Array.isArray(roster) ? roster : []))
      .catch((e) => console.warn('Could not load demo roster:', e));
  }, [refreshHistory]);

  // Audio Beep for successful QR verification
  const playBeep = useCallback((success = true) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = success ? 'sine' : 'square';
      osc.frequency.setValueAtTime(success ? 880 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext not allowed or not supported in environment
    }
  }, []);

  // Handle Verification
  const executeVerification = useCallback(async (input) => {
    if (!input) return;
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const res = await verifyMemberQrCode(input);
      setVerificationResult(res);
      playBeep(res.accessGranted);
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationResult(null);
      setVerificationError(err.message || 'Failed to verify member identifier');
      playBeep(false);
    } finally {
      setIsVerifying(false);
    }
  }, [playBeep]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by your browser environment.');
      }
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError(err.message || 'Unable to access camera device');
      setCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Camera continuous frame scanner loop
  useEffect(() => {
    let animId;
    let lastScanTime = 0;

    const tick = (timestamp) => {
      if (cameraActive && videoRef.current && scanMode === 'camera') {
        // Scan every 200ms
        if (timestamp - lastScanTime > 200) {
          lastScanTime = timestamp;
          const qrText = scanVideoFrame(videoRef.current, canvasRef.current);
          if (qrText) {
            stopCamera();
            executeVerification(qrText);
            return;
          }
        }
        animId = requestAnimationFrame(tick);
      }
    };

    if (cameraActive && scanMode === 'camera') {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [cameraActive, scanMode, executeVerification, stopCamera]);

  // Handle Scan Mode Change
  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanMode, startCamera, stopCamera]);

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const qrText = await decodeQrFromFile(file);
      if (!qrText) {
        throw new Error('No valid QR code found in uploaded image. Please try a clearer screenshot.');
      }
      await executeVerification(qrText);
    } catch (err) {
      setVerificationError(err.message || 'Failed to decode QR code from file');
      playBeep(false);
    } finally {
      setIsVerifying(false);
      e.target.value = '';
    }
  };

  // Handle Manual Form Submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    executeVerification(manualQuery.trim());
  };

  // Check In Member Action
  const handleCheckIn = async () => {
    if (!verificationResult || !verificationResult.member) return;
    setIsCheckingIn(true);
    try {
      const checkInData = {
        memberId: verificationResult.member.id,
        memberNumber: verificationResult.member.memberNumber,
        memberName: verificationResult.member.name,
        tier: verificationResult.membership?.tier || 'Walk-In',
        status: verificationResult.status,
        facility: selectedFacility,
        staffId: currentStaff.id || 'staff-1',
        staffName: currentStaff.name || 'Frontdesk Staff',
        accessGranted: verificationResult.accessGranted,
        notes: checkInNotes
      };

      await logFrontdeskCheckIn(checkInData);
      setCheckInNotes('');
      setCheckInSuccessToast(`Member ${verificationResult.member.name} checked in to ${selectedFacility}!`);
      setTimeout(() => setCheckInSuccessToast(null), 4000);
      await refreshHistory();
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Check in URL scan query if present (from pass modal simulator)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanId = params.get('scan');
    if (scanId) {
      executeVerification(scanId);
    }
  }, [executeVerification]);

  const tier = verificationResult?.membership?.tier || 'Standard';
  const tierMeta = TIER_CONFIG[tier] || TIER_CONFIG.Standard;

  const filteredLogs = checkInLogs.filter((log) => {
    if (logFilter === 'active') return log.accessGranted;
    if (logFilter === 'expired') return !log.accessGranted || log.status === 'expired';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner & Stats Overview */}
      <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] flex items-center justify-center font-bold shadow-md shadow-[#dfc99a]/15">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-black text-[#fcfaf5] tracking-tight">
                  Frontdesk QR Verification Terminal
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 uppercase tracking-wider">
                  Live Scanner
                </span>
              </div>
              <p className="text-xs text-emerald-300/70 mt-0.5">
                Frontdesk Member Validation • Entitlement Inspection • Club Attendance Check-In
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center sm:text-left w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-[#02140e] border border-emerald-900/50">
              <span className="text-[10px] uppercase font-bold text-emerald-400/60 block">
                Total Scans
              </span>
              <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                {stats.totalScans}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#02140e] border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Active Verified
              </span>
              <span className="text-lg font-bold text-emerald-300 font-mono mt-0.5 block">
                {stats.activeVerified}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#02140e] border border-rose-500/30">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">
                Expired Flags
              </span>
              <span className="text-lg font-bold text-rose-300 font-mono mt-0.5 block">
                {stats.expiredFlagged}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Demo Test Bar */}
        <div className="mt-5 pt-4 border-t border-emerald-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#dfc99a]" />
              Quick-Test Member Tiers (1-Click Verification Demo):
            </span>
            <span className="text-[10px] text-emerald-500/80">
              Click any card to simulate immediate scanner read
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {demoMembers.map((m) => {
              const tierName = m.activeMembership?.tier || 'No Plan';
              const isExp = m.activeMembership?.status === 'expired';
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => executeVerification(m.id)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 hover:border-[#dfc99a]/50 transition flex items-center gap-2 group active:scale-95"
                >
                  <span className="font-semibold text-white group-hover:text-[#dfc99a] transition">
                    {m.name}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border ${
                      isExp
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : tierName === 'Gold'
                        ? 'bg-[#dfc99a]/20 text-[#dfc99a] border-[#dfc99a]/40'
                        : tierName === 'Silver'
                        ? 'bg-slate-700/40 text-slate-200 border-slate-600/40'
                        : tierName === 'Junior'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}
                  >
                    {isExp ? 'Expired' : tierName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Scanner & Verification Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Scanner & Input Terminal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#02140e] rounded-2xl border border-emerald-900/60 text-xs">
              <button
                type="button"
                onClick={() => setScanMode('camera')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  scanMode === 'camera'
                    ? 'btn-champagne shadow-md text-[#02140e]'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Cam</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('upload')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  scanMode === 'upload'
                    ? 'btn-champagne shadow-md text-[#02140e]'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('manual')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                  scanMode === 'manual'
                    ? 'btn-champagne shadow-md text-[#02140e]'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Manual / Gun</span>
              </button>
            </div>

            {/* MODE 1: Camera Scanner Viewfinder */}
            {scanMode === 'camera' && (
              <div className="space-y-3">
                <div className="relative aspect-4/3 w-full bg-[#02140e] rounded-2xl border border-emerald-900/60 overflow-hidden flex items-center justify-center shadow-inner group">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover transition-opacity ${
                      cameraActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* High-tech Viewfinder Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/40 rounded-3xl flex items-center justify-center shadow-2xl">
                      {/* Corner Target L-Brackets */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#dfc99a] -translate-x-1 -translate-y-1 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#dfc99a] translate-x-1 -translate-y-1 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#dfc99a] -translate-x-1 translate-y-1 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#dfc99a] translate-x-1 translate-y-1 rounded-br-lg" />

                      {/* Animated Laser Scanning Line */}
                      {cameraActive && (
                        <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#dfc99a] to-transparent shadow-lg shadow-[#dfc99a] animate-bounce" />
                      )}

                      {!cameraActive && (
                        <div className="text-center p-4 space-y-2">
                          <CameraOff className="w-8 h-8 text-emerald-400/60 mx-auto" />
                          <p className="text-xs text-emerald-300/80 font-medium">
                            {cameraError || 'Camera Standby'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Status Tag */}
                  <div className="absolute top-3 left-3 bg-[#02140e]/80 border border-emerald-900/60 px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 backdrop-blur-sm">
                    <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span>{cameraActive ? 'SCANNER ACTIVE' : 'CAMERA OFF'}</span>
                  </div>
                </div>

                {/* Camera Action Buttons */}
                <div className="flex items-center justify-between gap-2">
                  {cameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 text-xs font-semibold transition"
                    >
                      Pause Scanner
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 py-2 px-3 rounded-xl btn-champagne text-xs font-bold transition shadow-md shadow-[#dfc99a]/15"
                    >
                      Start Camera Scanner
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                    }}
                    className="py-2 px-3 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 text-xs font-semibold transition"
                    title="Switch Front/Rear Camera"
                  >
                    Flip Camera
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: Upload QR Image */}
            {scanMode === 'upload' && (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-emerald-800/60 hover:border-[#dfc99a]/60 bg-[#02140e]/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group">
                  <div className="w-12 h-12 rounded-2xl bg-[#07261c] group-hover:bg-[#0b3829] text-[#dfc99a] flex items-center justify-center mb-3 border border-emerald-800/60 transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-white group-hover:text-[#dfc99a] transition">
                    Upload Digital QR Pass Image
                  </span>
                  <span className="text-xs text-emerald-400/60 mt-1">
                    Drag & drop or select PNG, JPG, WebP screenshot
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-emerald-400/60 text-center">
                  Instant client-side QR barcode decoding in &lt; 50ms
                </p>
              </div>
            )}

            {/* MODE 3: Laser Barcode Gun / Manual Input */}
            {scanMode === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-emerald-400/70 block">
                    USB Scanner Gun / Member ID / Phone / QR String
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      placeholder="e.g. CC-2026-8801, MEM-8801, or scan gun input..."
                      className="w-full bg-[#02140e] border border-emerald-800/60 focus:border-[#dfc99a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-emerald-700 outline-none font-mono transition"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isVerifying || !manualQuery.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg btn-champagne text-xs font-bold transition disabled:opacity-50"
                    >
                      Lookup
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-500/70">
                  Ready for physical handheld barcode/QR laser guns (autofocus & enter-key triggered).
                </p>
              </form>
            )}

            {/* Verification Loading State */}
            {isVerifying && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-[#dfc99a]" />
                <span>Validating member security credentials and contract status...</span>
              </div>
            )}

            {/* Verification Error Box */}
            {verificationError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600/70 text-xs text-rose-200 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Verification Failed</strong>
                  <span>{verificationError}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Verification Result Dossier (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {verificationResult ? (
            <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
              
              {/* Verdict Header Alert Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                verificationResult.status === 'expired'
                  ? 'bg-rose-950/80 border-rose-600 text-rose-100'
                  : verificationResult.status === 'expiring_soon'
                  ? 'bg-[#dfc99a]/15 border-[#dfc99a] text-[#dfc99a]'
                  : 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
              }`}>
                <div className="flex items-center gap-3">
                  {verificationResult.status === 'expired' ? (
                    <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                  ) : verificationResult.status === 'expiring_soon' ? (
                    <AlertTriangle className="w-7 h-7 text-[#dfc99a] shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest block opacity-75">
                      Verification Status
                    </span>
                    <h3 className="text-base sm:text-lg font-serif font-black tracking-wide">
                      {verificationResult.accessGranted
                        ? `ACCESS GRANTED • ${tier.toUpperCase()} TIER`
                        : `ACCESS RESTRICTED • ${verificationResult.status.toUpperCase()}`}
                    </h3>
                  </div>
                </div>

                {/* Renew Button if expired */}
                {verificationResult.status === 'expired' && (
                  <button
                    type="button"
                    onClick={() => setIsRenewModalOpen(true)}
                    className="shrink-0 px-3.5 py-2 rounded-xl btn-champagne font-bold text-xs shadow-md transition"
                  >
                    Renew Plan
                  </button>
                )}
              </div>

              {/* Alerts List */}
              {verificationResult.alerts?.length > 0 && (
                <div className="space-y-1.5">
                  {verificationResult.alerts.map((al, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                        al.type === 'danger'
                          ? 'bg-rose-950/40 text-rose-200 border-rose-800/40'
                          : al.type === 'warning'
                          ? 'bg-[#dfc99a]/10 text-[#dfc99a] border-[#dfc99a]/30'
                          : 'bg-emerald-950/30 text-emerald-200 border-emerald-800/40'
                      }`}
                    >
                      <span className="font-semibold">•</span>
                      <span>{al.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Full Member Credentials Grid */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] font-serif font-black text-lg sm:text-xl flex items-center justify-center shadow-md shrink-0">
                      {verificationResult.member.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-lg sm:text-xl font-serif font-black text-white truncate">
                        {verificationResult.member.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-emerald-300/70 mt-0.5 truncate">
                        <span className="font-mono text-[#dfc99a] font-bold">
                          {verificationResult.member.memberNumber || verificationResult.member.id}
                        </span>
                        <span>•</span>
                        <span className="truncate">{verificationResult.membership?.planName || 'Walk-in Member'}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`self-start sm:self-auto px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shrink-0 ${tierMeta.iconBg}`}>
                    {tier} Member
                  </span>
                </div>

                {/* Demographic & Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[#02140e] border border-emerald-900/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-400/60 block">
                      Phone Number
                    </span>
                    <span className="text-emerald-100 font-semibold mt-0.5 block truncate">
                      {verificationResult.member.phone}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#02140e] border border-emerald-900/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-400/60 block">
                      Email
                    </span>
                    <span className="text-emerald-100 font-semibold mt-0.5 block truncate" title={verificationResult.member.email}>
                      {verificationResult.member.email}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#02140e] border border-emerald-900/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-400/60 block">
                      Age & DOB
                    </span>
                    <span className="text-emerald-100 font-semibold mt-0.5 block">
                      {verificationResult.member.age !== null ? `${verificationResult.member.age} yrs` : '—'}
                      {verificationResult.member.dob && ` (${verificationResult.member.dob})`}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#02140e] border border-emerald-900/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-400/60 block">
                      Emergency Contact
                    </span>
                    <span className="text-emerald-100 font-semibold mt-0.5 block truncate" title={verificationResult.member.emergencyContact}>
                      {verificationResult.member.emergencyContact || 'None on record'}
                    </span>
                  </div>
                </div>

                {/* Validity Period & Entitlement Chips */}
                <div className="p-4 rounded-2xl bg-[#02140e] border border-emerald-900/60 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-900/40">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400/60 block">
                        Start Date
                      </span>
                      <span className="text-white font-mono font-bold">
                        {verificationResult.membership?.startDate || '—'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-400/60 block">
                        Valid Until (Expiry)
                      </span>
                      <span className={`font-mono font-bold ${
                        verificationResult.status === 'expired' ? 'text-rose-400' : 'text-[#dfc99a]'
                      }`}>
                        {verificationResult.membership?.endDate || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span><strong>Court:</strong> {verificationResult.entitlements?.courtPrivileges}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#dfc99a]" />
                      <span><strong>Pro Shop:</strong> {verificationResult.entitlements?.shopDiscount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span><strong>Sports Bar:</strong> {verificationResult.entitlements?.barDiscount}</span>
                    </div>
                  </div>
                </div>

                {/* Facility Check-In Action Section */}
                <div className="p-4 rounded-2xl bg-[#07261c]/80 border border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#dfc99a]" />
                      Frontdesk Attendance & Facility Check-In
                    </span>
                    <span className="text-[11px] text-emerald-400/70">
                      Operator: <span className="text-[#dfc99a] font-semibold">{currentStaff.name}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-400/70 block mb-1">
                        Access Destination
                      </label>
                      <select
                        value={selectedFacility}
                        onChange={(e) => setSelectedFacility(e.target.value)}
                        className="w-full bg-[#02140e] border border-emerald-800/60 focus:border-[#dfc99a] rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        {CLUB_FACILITIES.map((fac) => (
                          <option key={fac} value={fac}>
                            {fac}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-emerald-400/70 block mb-1">
                        Frontdesk Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={checkInNotes}
                        onChange={(e) => setCheckInNotes(e.target.value)}
                        placeholder="e.g. Locker #14, Guest pass used..."
                        className="w-full bg-[#02140e] border border-emerald-800/60 focus:border-[#dfc99a] rounded-xl px-3 py-2 text-xs text-white placeholder-emerald-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    {checkInSuccessToast && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-pulse">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{checkInSuccessToast}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      disabled={isCheckingIn}
                      className="sm:ml-auto px-5 py-2.5 rounded-xl btn-champagne font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-[#dfc99a]/15 disabled:opacity-50"
                    >
                      <span>Confirm Facility Check-In</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty Standby Card */
            <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-12 text-center shadow-xl backdrop-blur-md flex flex-col items-center justify-center min-h-[380px] space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#07261c] border border-emerald-800/60 text-[#dfc99a] flex items-center justify-center shadow-inner">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-lg font-serif font-bold text-white">
                  Awaiting Member QR Scan
                </h3>
                <p className="text-xs text-emerald-300/70 mt-1">
                  Point the camera at member's phone pass, upload a QR code image, or click any member from the Quick-Test bar above.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Today's Check-in Log Table */}
      <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-black text-white tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#dfc99a]" />
              Today's Frontdesk Verification & Attendance Log
            </h3>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              Real-time audit record of member scans and access authorizations today
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setLogFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                logFilter === 'all'
                  ? 'bg-[#dfc99a]/20 border-[#dfc99a]/50 text-[#dfc99a]'
                  : 'bg-[#02140e] border-emerald-900/60 text-emerald-300/70 hover:text-white'
              }`}
            >
              All ({checkInLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setLogFilter('active')}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                logFilter === 'active'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#02140e] border-emerald-900/60 text-emerald-300/70 hover:text-white'
              }`}
            >
              Granted ({stats.activeVerified})
            </button>
            <button
              type="button"
              onClick={() => setLogFilter('expired')}
              className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                logFilter === 'expired'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-[#02140e] border-emerald-900/60 text-emerald-300/70 hover:text-white'
              }`}
            >
              Flagged ({stats.expiredFlagged})
            </button>
          </div>
        </div>

        {/* Log Entries Table */}
        <div className="overflow-x-auto rounded-2xl border border-emerald-900/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#02140e] text-emerald-400/70 uppercase tracking-wider font-semibold border-b border-emerald-900/40">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Member Number</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Destination Facility</th>
                <th className="py-3 px-4">Frontdesk Staff</th>
                <th className="py-3 px-4">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/30 font-sans">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isExp = log.status === 'expired' || !log.accessGranted;
                  return (
                    <tr key={log.id} className="hover:bg-[#07261c]/40 transition">
                      <td className="py-3 px-4 font-mono text-emerald-300/80">
                        {log.verifiedAtTime || new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {log.memberName}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400/80">
                        {log.memberNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            log.tier === 'Gold'
                              ? 'bg-[#dfc99a]/15 text-[#dfc99a] border-[#dfc99a]/30'
                              : log.tier === 'Silver'
                              ? 'bg-slate-700/40 text-slate-200 border-slate-600/40'
                              : log.tier === 'Junior'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          }`}
                        >
                          {log.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-200 font-medium">
                        {log.facility}
                        {log.notes && (
                          <span className="block text-[10px] text-emerald-400/60 mt-0.5">
                            Note: {log.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-emerald-300/70">
                        {log.staffName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            isExp
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isExp ? (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>Flagged</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Granted</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-emerald-400/60">
                    No frontdesk verification scans recorded yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Selection Modal for Instant Renewal */}
      {isRenewModalOpen && verificationResult?.member && (
        <PlanSelectionModal
          isOpen={isRenewModalOpen}
          member={verificationResult.member}
          onClose={() => setIsRenewModalOpen(false)}
          onSuccess={(updated) => {
            setIsRenewModalOpen(false);
            executeVerification(updated.id);
          }}
        />
      )}
    </div>
  );
}
