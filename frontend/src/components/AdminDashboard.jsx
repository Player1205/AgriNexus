import { useState, useEffect } from "react";
import { 
  Users, Activity, Image as ImageIcon, ShieldCheck, Mail, Calendar, MapPin, 
  Search, User, Trash2, CheckCircle2, AlertTriangle, ShieldAlert, Layers, Check, X, 
  FileQuestion, Database, AlertCircle, Sparkles
} from "lucide-react";
import { 
  getAdminUsers, getAdminScans, adminDeleteUser, adminDeleteScan,
  getKvkReviewQueue, resolveKvkReviewItem, getTelemetryStats
} from "../services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [telemetryStats, setTelemetryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [showCorrectionFor, setShowCorrectionFor] = useState(null);
  const [correctionInputs, setCorrectionInputs] = useState({});
  const [officerNotes, setOfficerNotes] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, scansData, queueData, statsData] = await Promise.all([
        getAdminUsers().catch(() => ({ users: [] })),
        getAdminScans().catch(() => ({ scans: [] })),
        getKvkReviewQueue().catch(() => ({ review_queue: [] })),
        getTelemetryStats().catch(() => null)
      ]);
      setUsers(usersData.users || []);
      setScans(scansData.scans || []);
      setReviewQueue(queueData.review_queue || []);
      setTelemetryStats(statsData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleResolve = async (itemId, action) => {
    const notes = officerNotes[itemId] || "";
    const correctedDiag = correctionInputs[itemId] || null;
    setResolvingId(itemId);
    try {
      const res = await resolveKvkReviewItem(itemId, action, notes, correctedDiag);
      if (res.status === "ok") {
        setReviewQueue(prev => prev.filter(item => item.id !== itemId && item._id !== itemId));
        if (action === "APPROVE" || action === "CORRECT") {
          showToast(`✅ Scan successfully verified & promoted to MongoDB Atlas 'verified_telemetry' for ML active learning!`);
          if (telemetryStats) {
            setTelemetryStats(prev => ({
              ...prev,
              verified_telemetry_count: (prev?.verified_telemetry_count || 0) + 1,
              pending_kvk_reviews: Math.max(0, (prev?.pending_kvk_reviews || 1) - 1)
            }));
          }
        } else {
          showToast(`❌ Scan marked as rejected and quarantined in audit history.`);
        }
      }
    } catch (err) {
      alert("Failed to resolve review item: " + err.message);
    } finally {
      setResolvingId(null);
      setShowCorrectionFor(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user ${userName} and all their scans? This action cannot be undone.`)) {
      return;
    }
    try {
      await adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setScans(prev => prev.filter(s => s.user_id !== userId));
      showToast(`User ${userName} deleted successfully.`);
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan?")) {
      return;
    }
    try {
      await adminDeleteScan(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
      showToast("Scan deleted successfully.");
    } catch (err) {
      alert("Failed to delete scan: " + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "Total Farmers", value: users.length, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    { label: "Total User Scans", value: scans.length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { 
      label: "Verified Ground-Truth (Atlas)", 
      value: telemetryStats?.verified_telemetry_count || 0, 
      icon: Sparkles, 
      color: "text-purple-600", 
      bg: "bg-purple-50", 
      border: "border-purple-200",
      subtext: "ML Retraining Ready" 
    },
    { 
      label: "Pending KVK Audits (HITL)", 
      value: reviewQueue.length, 
      icon: AlertTriangle, 
      color: reviewQueue.length > 0 ? "text-amber-600" : "text-gray-400", 
      bg: reviewQueue.length > 0 ? "bg-amber-50" : "bg-gray-50", 
      border: reviewQueue.length > 0 ? "border-amber-200" : "border-gray-200",
      subtext: "Needs Agronomist Eyes" 
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-emerald-700 font-medium animate-pulse">Loading Nexus Command Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50 text-gray-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500 text-emerald-300 text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border-b border-green-100 bg-white shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-green-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Nexus Command & KVK Supervisor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enterprise multi-agent telemetry, human-in-the-loop review, and active learning curation
          </p>
        </div>
        
        {/* Admin Tabs */}
        <div className="flex flex-wrap bg-green-50/60 p-1 rounded-xl border border-green-200 shadow-inner">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "overview" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-green-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("review_queue")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "review_queue" ? "bg-amber-600 text-white shadow-sm" : "text-gray-600 hover:text-amber-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>KVK Review Queue</span>
            {reviewQueue.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "review_queue" ? "bg-white text-amber-700" : "bg-amber-500 text-white animate-pulse"
              }`}>
                {reviewQueue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "users" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-green-900"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("scans")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "scans" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-green-900"
            }`}
          >
            Scans Platform
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border ${stat.border} bg-white shadow-sm`}>
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    {stat.subtext && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{stat.subtext}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture Ingestion Diagram Card */}
            <div className="p-6 rounded-2xl border border-green-200 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-black text-white">MongoDB Atlas Multi-Collection Ingestion Architecture (Way A)</h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Autonomous Ingestion Agent (Agent 6) evaluates foliar confidence, statutory safety, and botanical authenticity to route data.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 font-bold text-xs">
                  Active Collection Separation
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80">
                  <div className="flex items-center gap-2 font-bold text-blue-400 mb-1">
                    <Activity className="w-4 h-4" />
                    <span>user_scans</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Preserves complete chronological farmer history. Powers the "My Scans" modal and offline reconciliation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-800/80">
                  <div className="flex items-center gap-2 font-bold text-purple-400 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>verified_telemetry</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Auto-curated scans with ≥80% confidence, C++ safety compliance, and approved KVK reviews. Used for model retraining.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-800/80">
                  <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>kvk_review_queue</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Quarantines uncertain (&lt;60%), non-target, or safety-flagged scans. Requires human agronomist sign-off.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KVK REVIEW QUEUE TAB (HITL) */}
        {activeTab === "review_queue" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-950">Human-in-the-Loop (HITL) Agronomy Audit Queue</h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Scans flagged by Agent 6 due to low neural confidence, anomalous symptoms, or statutory safety intercepts.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchAdminData}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition shadow-sm"
              >
                Refresh Queue
              </button>
            </div>

            {reviewQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-gray-300 bg-white text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                <h4 className="text-base font-bold text-gray-800">All Scans Verified & Clear</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  There are currently no flagged scans in the KVK audit queue. All incoming foliar diagnostics met certified standards.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviewQueue.map((item) => {
                  const itemId = item.id || item._id;
                  const isResolving = resolvingId === itemId;
                  const isShowingCorrection = showCorrectionFor === itemId;

                  return (
                    <div 
                      key={itemId}
                      className="flex flex-col rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-md hover:border-amber-400 transition"
                    >
                      {/* Image Header with Priority Pill */}
                      <div className="relative h-44 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.vision_diagnosis} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-slate-600" />
                        )}
                        {/* Audit Priority Badge */}
                        <div className="absolute top-2 left-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md ${
                            item.audit_priority === "CRITICAL"
                              ? "bg-rose-600 text-white animate-pulse"
                              : item.audit_priority === "HIGH"
                              ? "bg-amber-500 text-white"
                              : "bg-blue-600 text-white"
                          }`}>
                            {item.audit_priority || "NORMAL"} PRIORITY
                          </span>
                        </div>
                        {/* Confidence Score */}
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/20">
                          {Math.round((item.vision_confidence || 0) * 100)}% Conf
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 flex flex-col flex-1 gap-2.5">
                        <div>
                          <h4 className="text-base font-black text-gray-900 leading-tight">
                            {item.vision_diagnosis || "Uncertain Crop Condition"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">Crop: <span className="font-semibold text-gray-700">{item.crop || "Unknown"}</span></p>
                        </div>

                        {/* Flag Reason */}
                        <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-xs text-amber-900 font-medium leading-relaxed">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase mb-0.5">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Triage Flag Reason</span>
                          </div>
                          {item.flag_reason}
                        </div>

                        {/* Nearest KVK Referral Center */}
                        {item.nearest_kvk && (
                          <div className="text-[11px] text-gray-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="font-bold text-gray-800">Assigned KVK:</span> {item.nearest_kvk.name} ({item.nearest_kvk.distance_km} km)
                          </div>
                        )}

                        {/* Correction Input Accordion */}
                        {isShowingCorrection && (
                          <div className="flex flex-col gap-2 mt-1 p-3 rounded-xl bg-slate-100 border border-slate-300 animate-in fade-in duration-150">
                            <label className="text-[11px] font-bold text-gray-700">Corrected Diagnosis / Disease:</label>
                            <input
                              type="text"
                              placeholder="e.g. Tomato Early Blight"
                              value={correctionInputs[itemId] || ""}
                              onChange={(e) => setCorrectionInputs({ ...correctionInputs, [itemId]: e.target.value })}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <label className="text-[11px] font-bold text-gray-700">Agronomist Audit Notes:</label>
                            <input
                              type="text"
                              placeholder="Foliar concentric rings verified under microscope"
                              value={officerNotes[itemId] || ""}
                              onChange={(e) => setOfficerNotes({ ...officerNotes, [itemId]: e.target.value })}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <div className="flex justify-end gap-2 mt-1">
                              <button
                                onClick={() => setShowCorrectionFor(null)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleResolve(itemId, "CORRECT")}
                                disabled={isResolving || !correctionInputs[itemId]}
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Save Correction
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!isShowingCorrection && (
                          <div className="mt-auto pt-2 grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => handleResolve(itemId, "APPROVE")}
                              disabled={isResolving}
                              className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                              title="Confirm as valid ground-truth"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => setShowCorrectionFor(itemId)}
                              disabled={isResolving}
                              className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                              title="Correct botanical diagnosis"
                            >
                              <span>Correct</span>
                            </button>

                            <button
                              onClick={() => handleResolve(itemId, "REJECT")}
                              disabled={isResolving}
                              className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                              title="Reject & quarantine scan"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search farmers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-green-100 bg-white shadow-sm">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="border-b border-gray-100 bg-green-50/50 text-xs font-black uppercase text-green-900">
                  <tr>
                    <th className="px-6 py-4">Farmer</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900">{user.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.is_admin ? 'Supervisor' : 'Farmer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User and Scans"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCANS TAB */}
        {activeTab === "scans" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scans.map((scan) => (
              <div key={scan.id} className="flex flex-col rounded-2xl border border-green-100 bg-white overflow-hidden shadow-md hover:border-emerald-300 transition-colors">
                <div className="relative h-48 w-full bg-gray-100 border-b border-green-100 flex items-center justify-center overflow-hidden">
                  {scan.image_url ? (
                    <img src={scan.image_url} alt={scan.crop} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  )}
                  {scan.weather_data && scan.weather_data.temperature_c && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-gray-800 border border-gray-200 shadow-sm">
                      {scan.weather_data.temperature_c}°C
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-green-900">{scan.crop || (scan.vision_diagnosis ? scan.vision_diagnosis.split(' ')[0] : "Field Scan")}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                        <User className="h-3 w-3" />
                        {users.find(u => u.id === scan.user_id)?.name || <span className="font-mono">{scan.user_id.slice(-6)}</span>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        scan.is_spray_safe ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {scan.is_spray_safe ? "Safe" : "Warning"}
                      </span>
                      <button 
                        onClick={() => handleDeleteScan(scan.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Delete Scan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {scan.vision_diagnosis && (
                    <div className="mt-2 text-sm text-gray-700 bg-green-50/80 p-2.5 rounded-lg border border-green-100">
                      <p className="line-clamp-3 leading-snug">{scan.vision_diagnosis}</p>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>{new Date(scan.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {scans.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No scans found on the platform yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
