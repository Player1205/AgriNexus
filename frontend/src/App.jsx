import { useState, useEffect } from 'react';
import FarmerView from './components/FarmerView';
import TelemetryView from './components/TelemetryView';
import PwaInstallBanner from './components/PwaInstallBanner';
import { Sprout, Cpu, Download } from 'lucide-react';

export default function App() {
    const [lastResult, setLastResult] = useState(null);
    const [activeTab, setActiveTab] = useState('farmer');
    const [isStandalone, setIsStandalone] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const standalone = 
                window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://');
            setIsStandalone(standalone);
        }
    }, []);

    return (
        <div className="flex flex-col lg:flex-row h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-[#020612]">
            {/* Mobile Adaptive Top Navigation Bar — hidden on lg+ */}
            <nav className="flex lg:hidden w-full shrink-0 border-b border-gray-800/80 bg-[#050b1a] px-3 py-2 z-30 shadow-lg">
                <div className="flex w-full items-center gap-2">
                    <div className="flex flex-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800">
                        <button
                            onClick={() => setActiveTab('farmer')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                activeTab === 'farmer'
                                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            <Sprout className="w-4 h-4" />
                            <span>Farmer View</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('telemetry')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                activeTab === 'telemetry'
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            <Cpu className="w-4 h-4" />
                            <span>AI Swarm (MAS)</span>
                        </button>
                    </div>

                    {!isStandalone && (
                        <button
                            onClick={() => {
                                // Trigger install or open guide
                                const event = new CustomEvent('trigger-pwa-install');
                                window.dispatchEvent(event);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-bold text-xs shadow-md shadow-emerald-900/40 shrink-0 active:scale-95 transition-all"
                            title="Install App for 100% Offline Use"
                        >
                            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Install</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* Farmer View Panel */}
            <div className={`${
                activeTab === 'farmer' ? 'flex' : 'hidden'
            } lg:flex w-full lg:w-1/2 h-full min-h-0 overflow-y-auto overflow-x-hidden lg:border-r border-gray-800/80 bg-white`}>
                <FarmerView onAnalysisComplete={setLastResult} />
            </div>

            {/* Telemetry Panel */}
            <div className={`${
                activeTab === 'telemetry' ? 'flex' : 'hidden'
            } lg:flex w-full lg:w-1/2 h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#020612]`}>
                <TelemetryView />
            </div>

            {/* PWA 100% Offline Add to Home Screen Banner (Silent when already installed) */}
            <PwaInstallBanner />
        </div>
    );
}
