import { useState, useEffect } from "react";
import { AlertOctagon, ShieldAlert, X, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import bannedPesticidesLocal from "../data/banned_pesticides.json";
import { fetchBannedPesticides } from "../services/api";

export default function BannedPesticidesTicker({ selectedLang = "hi" }) {
  const [pesticides, setPesticides] = useState(bannedPesticidesLocal);
  const [selectedPesticide, setSelectedPesticide] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchBannedPesticides()
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setPesticides(data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const isHindi = selectedLang === "hi";

  // Duplicate items array once to achieve infinite seamless loop with translate-x: -50%
  const tickerItems = [...pesticides, ...pesticides];

  return (
    <>
      {/* Statutory Alert Marquee Container */}
      <div 
        className="shrink-0 relative w-full h-8 sm:h-9 bg-gradient-to-r from-[#1c0407] via-[#0f0204] to-[#1c0407] border-b border-rose-900/50 flex items-center overflow-hidden z-40 select-none shadow-inner"
        role="region"
        aria-label="Statutory Banned Pesticides Marquee"
      >
        {/* Pinned Left Statutory Badge */}
        <div className="shrink-0 z-10 flex items-center gap-1.5 h-full px-2 sm:px-3 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-r border-rose-700/60 shadow-lg text-[10px] sm:text-[11px] font-black text-rose-100 tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-300 stroke-[2.5]" />
          <span className="hidden xs:inline uppercase">
            {isHindi ? "प्रतिबंधित कीटनाशक" : "CIB&RC BANNED PESTICIDES"}
          </span>
          <span className="xs:hidden uppercase">
            {isHindi ? "प्रतिबंधित" : "BANNED"}
          </span>
        </div>

        {/* Scrolling News Ticker Track */}
        <div className="flex-1 overflow-hidden relative flex items-center h-full">
          <div className="animate-ticker-marquee flex items-center gap-6 sm:gap-8 cursor-pointer py-1">
            {tickerItems.map((item, idx) => (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => setSelectedPesticide(item)}
                className="group inline-flex items-center gap-2 text-rose-200/90 hover:text-white transition-colors duration-150 text-[11px] sm:text-xs font-semibold whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-rose-500 rounded px-1"
                title="Click to view statutory prohibition details"
              >
                <span className="px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-700/60 text-rose-300 font-bold text-[9px] sm:text-[10px] uppercase tracking-wide group-hover:border-rose-400 group-hover:bg-rose-900 transition">
                  {isHindi && item.hi_name ? item.hi_name : item.display_name}
                </span>
                <span className="text-[10px] sm:text-[11px] text-rose-300/80 group-hover:text-rose-100">
                  {item.hazard_class ? item.hazard_class.split("(")[0].trim() : "BANNED"}
                </span>
                <span className="text-rose-600/60 font-black text-xs select-none">✦</span>
              </button>
            ))}
          </div>

          {/* Right Gradient Vignette for Smooth Fade */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#1c0407] to-transparent z-10" />
        </div>
      </div>

      {/* Statutory Detail Modal */}
      {selectedPesticide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPesticide(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#0a0507] border border-rose-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl text-left text-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-52 h-52 bg-rose-600/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-52 h-52 bg-rose-900/15 rounded-full blur-3xl" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-rose-900/50 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950 border border-rose-700/80 text-rose-400 shadow-md">
                  <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-rose-100 tracking-tight">
                      {selectedPesticide.display_name}
                    </h3>
                    {selectedPesticide.hi_name && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-800 text-rose-300 font-semibold">
                        {selectedPesticide.hi_name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                    {selectedPesticide.status}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPesticide(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-3.5 text-xs sm:text-sm">
              {/* Gazette / Act Notice */}
              <div className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-3">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>Statutory Authority & Gazette Notification</span>
                </div>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {selectedPesticide.gazette_ref} under the <strong className="text-rose-200">Insecticides Act, 1968</strong> (CIB&RC, Govt. of India).
                </p>
              </div>

              {/* Hazard Classification */}
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>WHO / CIB&RC Hazard Classification</span>
                </div>
                <p className="text-slate-200 font-semibold">
                  {selectedPesticide.hazard_class}
                </p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {selectedPesticide.reason}
                </p>
              </div>

              {/* Safe ICAR Certified Alternative */}
              <div className="rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Safe ICAR Certified Bio-Alternative</span>
                </div>
                <p className="text-emerald-200 font-bold">
                  {selectedPesticide.safe_alternative}
                </p>
              </div>

              {/* Statutory Warning Box */}
              <div className="text-[11px] text-rose-300/90 bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5 text-center font-medium">
                ⚠️ Field spraying or sale of this substance is an offence under Indian agricultural law. AgriNexus C++ Safety Core automatically blocks any treatment containing this chemical.
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedPesticide(null)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/50 transition active:scale-95"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
