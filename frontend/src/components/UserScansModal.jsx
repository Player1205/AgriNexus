import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Volume2,
  RefreshCw,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Database,
  CloudRain,
  Sprout,
  Leaf,
  Wind,
  Droplets,
} from "lucide-react";
import { getUserScans, deleteUserScan, getBaseApiUrl } from "../services/api";

export default function UserScansModal({ isOpen, onClose, user }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const data = await getUserScans();
      setScans(data.scans || []);
    } catch (err) {
      console.error("Failed to load user scans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchScans();
    } else {
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
        setPlayingAudio(null);
      }
    }
  }, [isOpen]);

  const handleDelete = async (scanId) => {
    if (!confirm("क्या आप वाकई इस स्कैन को हटाना चाहते हैं?\nAre you sure you want to delete this scan?")) return;
    setDeletingId(scanId);
    try {
      await deleteUserScan(scanId);
      setScans((prev) => prev.filter((s) => s.id !== scanId));
    } catch (err) {
      alert("Failed to delete scan: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePlayAudio = (audioUrl, id) => {
    if (audioElement && playingAudio === id) {
      audioElement.pause();
      setPlayingAudio(null);
      return;
    }
    if (audioElement) audioElement.pause();

    const baseUrl = getBaseApiUrl();
    const resolvedUrl =
      audioUrl.startsWith("http") || audioUrl.startsWith("data:") || !baseUrl
        ? audioUrl
        : `${baseUrl}${audioUrl}`;

    const audio = new Audio(resolvedUrl);
    setAudioElement(audio);
    setPlayingAudio(id);
    audio.play().catch(() => setPlayingAudio(null));
    audio.onended = () => setPlayingAudio(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Dark green backdrop with blur */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(2, 26, 16, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      />

      {/* Animated glow orbs */}
      <div
        className="absolute top-[10%] left-[10%] w-[250px] h-[250px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "scansPulse 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[10%] right-[10%] w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "scansPulse 7s ease-in-out infinite reverse",
        }}
      />

      {/* Modal */}
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[88vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
        style={{
          background: "linear-gradient(160deg, rgba(5,46,22,0.92) 0%, rgba(6,78,59,0.88) 50%, rgba(2,44,34,0.92) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scans-modal-title"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/8"
          style={{ background: "rgba(0,0,0,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/30 shadow-lg shadow-green-900/40"
              style={{
                background: "linear-gradient(135deg, rgba(34,197,94,0.25) 0%, rgba(16,185,129,0.15) 100%)",
              }}
            >
              <Leaf className="h-5 w-5 text-green-400 drop-shadow" />
            </div>
            <div>
              <h2
                id="scans-modal-title"
                className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2 drop-shadow"
              >
                मेरी फसल जाँच
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}
                >
                  {scans.length} saved
                </span>
              </h2>
              <p className="text-[11px] text-green-300/50 font-medium">
                My Field Scans • MongoDB Atlas • {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchScans}
              disabled={loading}
              className="p-2 rounded-lg transition border border-white/5 hover:border-green-500/30 hover:bg-white/5 disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin text-green-400" : "text-green-300/60"}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-green-300/50 hover:text-red-300"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scans List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {loading && scans.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center border border-green-500/20"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <RefreshCw className="h-6 w-6 text-green-400 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-green-300/70">
                MongoDB Atlas से रिकॉर्ड लोड हो रहे हैं...
              </p>
              <p className="text-[11px] text-green-400/40">Fetching your field records</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-4">
              <div
                className="h-20 w-20 rounded-3xl flex items-center justify-center border border-green-600/20 shadow-lg shadow-green-950/30"
                style={{
                  background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.06) 100%)",
                }}
              >
                <Sprout className="h-10 w-10 text-green-500/50" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white/90 mb-1">
                  अभी तक कोई जाँच नहीं
                </h3>
                <p className="text-[11px] text-green-300/40 font-medium">
                  No field scans recorded yet
                </p>
              </div>
              <p
                className="text-xs max-w-xs leading-relaxed font-medium px-4 py-3 rounded-xl border border-white/5"
                style={{ color: "rgba(134,239,172,0.5)", background: "rgba(255,255,255,0.03)" }}
              >
                जब आप Farmer View में फसल की फोटो कैप्चर या अपलोड करेंगे, तो आपका निदान, मौसम डेटा और
                खुराक स्वचालित रूप से यहाँ सेव होगा।
              </p>
            </div>
          ) : (
            scans.map((scan) => {
              const formattedDate = scan.created_at
                ? new Date(scan.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recent scan";

              return (
                <div
                  key={scan.id}
                  className="rounded-2xl border border-white/8 hover:border-green-500/25 transition-all p-4 sm:p-5 shadow-lg group relative"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {/* Top row: badges + timestamp + actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Crop badge */}
                        <span
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1"
                          style={{ background: "rgba(34,197,94,0.12)", color: "#86efac" }}
                        >
                          <Sprout className="w-3 h-3" />
                          {scan.crop ? scan.crop : "Field Scan"}
                        </span>

                        {/* Spray safety */}
                        {scan.is_spray_safe !== undefined && (
                          <span
                            className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
                              scan.is_spray_safe
                                ? "border-green-500/30 text-green-300"
                                : "border-amber-500/30 text-amber-300"
                            }`}
                            style={{
                              background: scan.is_spray_safe
                                ? "rgba(34,197,94,0.1)"
                                : "rgba(245,158,11,0.1)",
                            }}
                          >
                            {scan.is_spray_safe ? (
                              <><ShieldCheck className="w-3 h-3" /> Safe</>
                            ) : (
                              <><ShieldAlert className="w-3 h-3" /> Delay</>
                            )}
                          </span>
                        )}

                        {/* Timestamp */}
                        <span className="text-[10px] text-green-400/40 flex items-center gap-1 ml-auto font-medium">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Diagnosis title */}
                      <h4 className="text-sm sm:text-base font-bold text-white/90 leading-snug">
                        {scan.vision_diagnosis || "General Crop Diagnosis"}
                      </h4>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                      {scan.vernacular_audio_url && (
                        <button
                          onClick={() => handlePlayAudio(scan.vernacular_audio_url, scan.id)}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                            playingAudio === scan.id
                              ? "bg-green-500 text-green-950 border-green-400 shadow-lg shadow-green-900/50"
                              : "border-white/10 text-green-300/70 hover:border-green-500/30 hover:text-green-300 hover:bg-white/5"
                          }`}
                          title="सुनो (Play audio)"
                        >
                          <Volume2 className={`h-3.5 w-3.5 ${playingAudio === scan.id ? "animate-pulse" : ""}`} />
                          <span className="hidden sm:inline">{playingAudio === scan.id ? "Playing" : "सुनो"}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(scan.id)}
                        disabled={deletingId === scan.id}
                        className="p-2 rounded-xl border border-white/8 text-green-400/30 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition disabled:opacity-40"
                        title="हटाएं (Delete)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Translated advice text */}
                  {scan.translated_text && (
                    <p
                      className="text-xs leading-relaxed p-3 rounded-xl border border-white/5 mb-3 font-medium"
                      style={{ color: "rgba(187,247,208,0.7)", background: "rgba(0,0,0,0.15)" }}
                    >
                      {scan.translated_text}
                    </p>
                  )}

                  {/* Details footer strip */}
                  <div
                    className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-medium pt-2.5 border-t border-white/5"
                    style={{ color: "rgba(134,239,172,0.4)" }}
                  >
                    {scan.dosage_unit && (
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3" />
                        <span>Unit: <span className="text-green-300/70 font-semibold">{scan.dosage_unit}</span></span>
                      </div>
                    )}
                    {scan.weather_data && (
                      <>
                        <div className="flex items-center gap-1">
                          <CloudRain className="w-3 h-3 text-cyan-400/40" />
                          <span>{scan.weather_data.temperature_c}°C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind className="w-3 h-3" />
                          <span>{scan.weather_data.relative_humidity}% Humidity</span>
                        </div>
                      </>
                    )}
                    {scan.filename && (
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{scan.filename}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="border-t border-white/8 px-5 sm:px-6 py-3 flex items-center justify-between text-[11px] font-medium"
          style={{ background: "rgba(0,0,0,0.2)", color: "rgba(134,239,172,0.35)" }}
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-green-500/40" />
            MongoDB Atlas में सुरक्षित • Encrypted at rest
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold text-green-300/80 transition border border-white/10 hover:border-green-500/30 hover:bg-white/5 hover:text-green-200"
          >
            बंद करें (Done)
          </button>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes scansPulse {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.12); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
