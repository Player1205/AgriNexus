import { useState, useEffect } from "react";
import FarmerView from "./components/FarmerView";
import TelemetryView from "./components/TelemetryView";
import PwaInstallBanner from "./components/PwaInstallBanner";
import AuthView from "./components/AuthView";
import UserScansModal from "./components/UserScansModal";
import { getCurrentUser, logout } from "./services/auth";
import { Sprout, Cpu, Download, LogOut, Database, User as UserIcon } from "lucide-react";

export default function App() {
  const [lastResult, setLastResult] = useState(null);
  const [activeTab, setActiveTab] = useState("farmer");
  const [isStandalone, setIsStandalone] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isScansModalOpen, setIsScansModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(standalone);
    }
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#020612] text-sm font-semibold text-emerald-300 gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="animate-pulse">Loading AgriNexus with MongoDB Atlas...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView onAuthenticated={setUser} />;
  }

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <div className="relative flex flex-col h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[#020612]">
      {/* Top Application Header Bar */}
      <header className="shrink-0 flex items-center justify-between border-b border-gray-800/80 bg-[#050b1a] px-3 sm:px-4 py-2 z-40 shadow-lg">
        {/* Left: Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-slate-950 font-black shadow-md shadow-emerald-950/40">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white tracking-tight text-sm">AgriNexus</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ATLAS
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Autonomous Agricultural Intelligence</p>
          </div>
        </div>

        {/* Center: Mobile Navigation Switcher */}
        <div className="flex lg:hidden bg-gray-900/90 p-1 rounded-xl border border-gray-800 text-xs">
          <button
            onClick={() => setActiveTab("farmer")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "farmer"
                ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Farmer</span>
          </button>
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "telemetry"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Swarm</span>
          </button>
        </div>

        {/* Right: User controls & My Scans */}
        <div className="flex items-center gap-2">
          {!isStandalone && (
            <button
              onClick={() => {
                const event = new CustomEvent("trigger-pwa-install");
                window.dispatchEvent(event);
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-bold text-xs shadow-md shadow-emerald-900/40 shrink-0 active:scale-95 transition-all"
              title="Install App for Offline Use"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install</span>
            </button>
          )}

          {/* User History Button */}
          <button
            onClick={() => setIsScansModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-bold text-xs shadow-sm transition"
            title="View your saved scans on MongoDB Atlas"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">My Scans</span>
          </button>

          {/* User Profile Pill */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-300">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-xs font-bold text-slate-300 shadow-sm hover:border-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
            title={`Log out ${user.name || user.email}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Dual Panels: Farmer View and Telemetry View */}
      <div className="flex flex-1 min-h-0 w-full flex-col lg:flex-row overflow-hidden">
        {/* Farmer View Panel */}
        <div
          className={`${
            activeTab === "farmer" ? "flex" : "hidden"
          } lg:flex w-full lg:w-1/2 h-full min-h-0 overflow-y-auto overflow-x-hidden lg:border-r border-gray-800/80 bg-white`}
        >
          <FarmerView 
            onAnalysisComplete={setLastResult}
            onOpenScans={() => setIsScansModalOpen(true)}
          />
        </div>

        {/* Telemetry Panel */}
        <div
          className={`${
            activeTab === "telemetry" ? "flex" : "hidden"
          } lg:flex w-full lg:w-1/2 h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#020612]`}
        >
          <TelemetryView />
        </div>
      </div>

      {/* MongoDB Atlas User Scans Modal */}
      <UserScansModal
        isOpen={isScansModalOpen}
        onClose={() => setIsScansModalOpen(false)}
        user={user}
      />

      {/* PWA Offline Banner */}
      <PwaInstallBanner />
    </div>
  );
}
