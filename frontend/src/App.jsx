import { useState } from 'react';
import FarmerView from './components/FarmerView';
import TelemetryView from './components/TelemetryView';

export default function App() {
    const [lastResult, setLastResult] = useState(null);
    const [activeTab, setActiveTab] = useState('farmer');

    return (
        <div className="flex flex-col lg:flex-row h-[100dvh] w-screen overflow-x-hidden">
            {/* Mobile Tab Bar — hidden on lg+ */}
            <nav className="flex lg:hidden w-full shrink-0 border-b border-gray-200 bg-white">
                <button
                    onClick={() => setActiveTab('farmer')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'farmer'
                            ? 'text-green-700 border-b-2 border-green-600'
                            : 'text-gray-500'
                    }`}
                >
                    🌾 Farmer
                </button>
                <button
                    onClick={() => setActiveTab('telemetry')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                        activeTab === 'telemetry'
                            ? 'text-green-400 border-b-2 border-green-500 bg-gray-950'
                            : 'text-gray-500'
                    }`}
                >
                    ⚡ Telemetry
                </button>
            </nav>

            {/* Farmer View Panel */}
            <div className={`${
                activeTab === 'farmer' ? 'flex' : 'hidden'
            } lg:flex w-full lg:w-1/2 h-full min-h-0 overflow-y-auto overflow-x-hidden lg:border-r border-gray-200`}>
                <FarmerView onAnalysisComplete={setLastResult} />
            </div>

            {/* Telemetry Panel */}
            <div className={`${
                activeTab === 'telemetry' ? 'flex' : 'hidden'
            } lg:flex w-full lg:w-1/2 h-full min-h-0 overflow-y-auto overflow-x-hidden`}>
                <TelemetryView />
            </div>
        </div>
    );
}
