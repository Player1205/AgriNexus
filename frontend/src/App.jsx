import { useState } from 'react';
import FarmerView from './components/FarmerView';
import TelemetryView from './components/TelemetryView';
import { Sprout, Cpu, ShieldCheck } from 'lucide-react';

export default function App() {
    const [lastResult, setLastResult] = useState(null);
    const [activeTab, setActiveTab] = useState('farmer');

    return (
        <div className="flex flex-col lg:flex-row h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-[#020612]">
            {/* Mobile Adaptive Top Navigation Bar — hidden on lg+ */}
            <nav className="flex lg:hidden w-full shrink-0 border-b border-gray-800/80 bg-[#050b1a] px-3 py-2 z-30 shadow-lg">
                <div className="flex w-full bg-gray-900/90 p-1 rounded-xl border border-gray-800">
                    <button
                        onClick={() => setActiveTab('farmer')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
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
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                            activeTab === 'telemetry'
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <Cpu className="w-4 h-4" />
                        <span>AI Swarm (MAS)</span>
                    </button>
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
        </div>
    );
}
