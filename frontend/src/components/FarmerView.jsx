import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadImage, createTelemetrySocket } from '../services/api';
import { Camera, Volume2, Globe, AlertTriangle, CheckCircle, MapPin, Phone, ExternalLink, WifiOff, RefreshCw } from 'lucide-react';

const LANGUAGES = [
    { code: 'hi', name: 'हिन्दी', label: 'Hindi' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', label: 'Punjabi' },
    { code: 'te', name: 'తెలుగు', label: 'Telugu' },
    { code: 'ta', name: 'தமிழ்', label: 'Tamil' },
    { code: 'ml', name: 'മലയാളം', label: 'Malayalam' },
    { code: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada' },
    { code: 'bn', name: 'বাংলা', label: 'Bengali' },
    { code: 'mr', name: 'मराठी', label: 'Marathi' },
    { code: 'gu', name: 'ગુજરાતી', label: 'Gujarati' },
    { code: 'od', name: 'ଓଡ଼ିଆ', label: 'Odia' },
    { code: 'en', name: 'English', label: 'English' }
];

const STATUS = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    ERROR: 'error'
};

const NODE_STYLES = {
    vision: { text: "Detecting crop disease on Edge AI...", size: "text-base sm:text-lg", color: "text-cyan-600" },
    rag: { text: "Matching certified ICAR protocol...", size: "text-lg sm:text-xl", color: "text-purple-600" },
    safety: { text: "Evaluating C++ safety & MIC therapeutic floor...", size: "text-lg sm:text-xl", color: "text-emerald-600" },
    web3: { text: "Minting immutable passport on Base L2...", size: "text-xl sm:text-2xl", color: "text-amber-500" },
    voice: { text: "Synthesizing voice via Sarvam AI...", size: "text-base sm:text-lg", color: "text-green-600" }
};

export default function FarmerView({ onAnalysisComplete }) {
    const [status, setStatus] = useState(STATUS.IDLE);
    const [selectedLang, setSelectedLang] = useState('hi');
    const [activeNode, setActiveNode] = useState(null);
    const [weather, setWeather] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [nearestKvk, setNearestKvk] = useState(null);
    const [dosageUnit, setDosageUnit] = useState('g');
    const [isMicProtected, setIsMicProtected] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [offlineSyncCount, setOfflineSyncCount] = useState(0);

    const fileInputRef = useRef(null);
    const audioRef = useRef(null);

    // Online / Offline Network State Monitoring & Store-and-Forward Sync
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            const queue = JSON.parse(localStorage.getItem('agrinexus_offline_queue') || '[]');
            if (queue.length > 0) {
                setOfflineSyncCount(queue.length);
                // Clear queue as we are back online
                localStorage.removeItem('agrinexus_offline_queue');
                setTimeout(() => setOfflineSyncCount(0), 4000);
            }
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Listen to live agent telemetry steps
    useEffect(() => {
        let ws;
        if (status === STATUS.PROCESSING) {
            ws = createTelemetrySocket((data) => {
                setActiveNode(data.node);
            });
        } else {
            setActiveNode(null);
        }
        return () => {
            if (ws) ws.close();
        };
    }, [status]);

    // Native On-Device Web Speech API Fallback for Offline Scenarios
    const speakOnDeviceFallback = (text, langCode) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode === 'pa' ? 'pa-IN' : langCode === 'te' ? 'te-IN' : langCode === 'ta' ? 'ta-IN' : 'hi-IN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    const handleFileSelect = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus(STATUS.UPLOADING);
        setErrorMessage('');
        setAudioUrl(null);
        setDiagnosis('');
        setTranslatedText('');
        setWeather(null);
        setNearestKvk(null);
        setIsMicProtected(false);
        setActiveNode(null);

        try {
            setStatus(STATUS.PROCESSING);

            // If completely offline, record in local store-and-forward queue
            if (!navigator.onLine) {
                const pendingRecord = {
                    timestamp: new Date().toISOString(),
                    filename: file.name,
                    language: selectedLang
                };
                const existing = JSON.parse(localStorage.getItem('agrinexus_offline_queue') || '[]');
                existing.push(pendingRecord);
                localStorage.setItem('agrinexus_offline_queue', JSON.stringify(existing));
            }

            const result = await uploadImage(file, selectedLang);

            if (onAnalysisComplete) {
                onAnalysisComplete(result);
            }

            setDiagnosis(result.vision_diagnosis || 'Analysis complete');
            if (result.weather_data) {
                setWeather(result.weather_data);
            }
            if (result.translated_text) {
                setTranslatedText(result.translated_text);
            }
            if (result.dosage_unit) {
                setDosageUnit(result.dosage_unit);
            }
            if (result.is_mic_protected) {
                setIsMicProtected(true);
            }
            if (result.nearest_kvk) {
                setNearestKvk(result.nearest_kvk);
            }

            if (result.vernacular_audio_url) {
                setAudioUrl(result.vernacular_audio_url);
            } else if (result.translated_text && !navigator.onLine) {
                speakOnDeviceFallback(result.translated_text, selectedLang);
            }

            setStatus(result.is_safe ? STATUS.SUCCESS : STATUS.ERROR);

            if (!result.is_safe) {
                setErrorMessage(result.safety_warning || 'Treatment deemed non-actionable.');
            }
        } catch (err) {
            setStatus(STATUS.ERROR);
            setErrorMessage('Network connection lost. Diagnostic stored in offline queue and will auto-sync upon reconnection.');
            if ('speechSynthesis' in window) {
                speakOnDeviceFallback("नेटवर्क उपलब्ध नहीं है। आपकी जांच सुरक्षित कर ली गई है।", 'hi');
            }
        }
    }, [selectedLang, onAnalysisComplete]);

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-0 bg-gradient-to-b from-green-50/80 via-white to-green-50/40 px-4 sm:px-8 py-5 sm:py-8 overflow-y-auto overflow-x-hidden">
            
            {/* Centered Professional Container */}
            <div className="w-full max-w-md flex flex-col items-center gap-4 sm:gap-5 my-auto">
                
                {/* Offline Store-and-Forward Notification Banner */}
                {isOffline && (
                    <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-900 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                            <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                            Offline Mode (Edge Vision & On-Device Audio Active)
                        </span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Local Cache
                        </span>
                    </div>
                )}

                {offlineSyncCount > 0 && (
                    <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                        Network Reconnected! Auto-synced {offlineSyncCount} offline records to Base L2.
                    </div>
                )}

                {/* 1. Header */}
                <div className="text-center space-y-1 w-full">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl sm:text-3xl">🌾</span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900 tracking-tight">AgriNexus</h1>
                    </div>
                    <p className="text-gray-500 text-xs sm:text-sm font-medium">फसल सुरक्षा एवं प्रामाणिक सलाह • Autonomous Agricultural Swarm</p>
                </div>

                {/* 2. Language Selector Card */}
                <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-green-100/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-gray-500">
                        <span className="flex items-center gap-1.5 text-green-700">
                            <Globe className="w-3.5 h-3.5" /> भाषा चुनें (Select Language)
                        </span>
                        <span className="text-green-800 font-bold bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                            {currentLangObj.name} ({currentLangObj.label})
                        </span>
                    </div>
                    
                    {/* Horizontal Scrollable Language Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none no-scrollbar select-none">
                        {LANGUAGES.map((lang) => {
                            const isSelected = selectedLang === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => setSelectedLang(lang.code)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                                        isSelected
                                            ? 'bg-green-600 text-white shadow-md scale-105 ring-2 ring-green-300'
                                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-green-50/60'
                                    }`}
                                >
                                    <span>{lang.name}</span>
                                    <span className={`text-[10px] font-medium opacity-80 ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>
                                        ({lang.label})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Photo Capture Button */}
                <div className="w-full flex flex-col items-center">
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={status === STATUS.PROCESSING || status === STATUS.UPLOADING}
                        className="w-full h-24 sm:h-28 border-2 border-dashed border-green-500/80 rounded-2xl bg-white/90 hover:bg-green-50/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                        <div className="p-2.5 bg-green-100 rounded-full text-green-700 shadow-inner">
                            <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-green-800 font-bold text-xs sm:text-sm tracking-wide">
                            फोटो खींचें / Upload
                        </span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* 4. Status Indicator */}
                {status === STATUS.PROCESSING && (
                    <div className="flex flex-col items-center h-10 justify-center overflow-visible">
                        <span 
                            key={activeNode} 
                            className={`font-bold tracking-wide animate-bounce transition-all duration-500 ease-in-out ${
                                activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].size : "text-sm"
                            } ${
                                activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].color : "text-amber-600"
                            }`}
                        >
                            {activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].text : "Initiating Multi-Agent Swarm..."}
                        </span>
                    </div>
                )}

                {/* 5. Success Card */}
                {status === STATUS.SUCCESS && (
                    <div className="w-full bg-white p-4 rounded-2xl border border-green-200 shadow-md flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-green-800 font-extrabold text-sm sm:text-base">सत्यापित उपचार (Verified Safe ✓)</p>
                        </div>
                        <div className="bg-green-50 p-2.5 rounded-xl w-full text-center">
                            <p className="text-[10px] text-gray-500 font-semibold">Crop Diagnosis</p>
                            <p className="text-green-900 font-bold text-xs sm:text-sm">{diagnosis}</p>
                            {isMicProtected && (
                                <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                                    🛡️ ICAR MIC Floor Protected
                                </span>
                            )}
                        </div>
                        {translatedText && (
                            <p className="text-xs text-gray-700 text-center italic bg-gray-50 p-3 rounded-xl border border-gray-100 w-full leading-relaxed">
                                "{translatedText}"
                            </p>
                        )}
                    </div>
                )}

                {/* 6. Non-Actionable / Statutory KVK Referral Card */}
                {status === STATUS.ERROR && (
                    <div className="w-full bg-red-50 p-4 rounded-2xl border border-red-200 shadow-md flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-1.5 text-red-700 font-extrabold text-sm">
                            <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
                            <span>NON-ACTIONABLE: KVK Verification Required</span>
                        </div>
                        
                        {diagnosis && (
                            <div className="bg-red-100/70 px-3 py-1 rounded-lg">
                                <p className="text-red-950 font-bold text-xs">{diagnosis}</p>
                            </div>
                        )}
                        <p className="text-red-800 text-center text-xs font-medium leading-relaxed">{errorMessage}</p>

                        {/* Nearest KVK Center Card */}
                        {nearestKvk && (
                            <div className="w-full bg-white p-3 rounded-xl border border-red-200 flex flex-col gap-2 mt-1">
                                <div className="flex items-center justify-between border-b pb-1.5 border-gray-100">
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-900">
                                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                                        {nearestKvk.name}
                                    </span>
                                    <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        {nearestKvk.distance_km} km away
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-600 font-medium leading-tight">
                                    {nearestKvk.address}
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                    <a
                                        href={`tel:${nearestKvk.phone}`}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <Phone className="w-3.5 h-3.5" />
                                        Call Agronomist ({nearestKvk.phone})
                                    </a>
                                    <a
                                        href={nearestKvk.maps_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                        title="Open in Google Maps"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        )}

                        {translatedText && (
                            <p className="text-xs text-gray-800 text-center italic bg-white/90 p-3 rounded-xl border border-red-100 w-full leading-relaxed mt-1">
                                "{translatedText}"
                            </p>
                        )}
                    </div>
                )}

                {/* 7. Live Farm Meteorological Telemetry HUD */}
                {weather && (
                    <div className={`w-full p-3 rounded-2xl border shadow-sm flex items-center justify-between animate-in fade-in duration-300 ${
                        weather.location_source === 'regional_baseline'
                            ? 'bg-amber-50/90 border-amber-200'
                            : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border-blue-200/80'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            <span className="text-xl">{weather.location_source === 'regional_baseline' ? '⚠️' : '⛅'}</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                                    {weather.temperature_c}°C · {weather.relative_humidity}% Humidity
                                    {weather.location_source === 'regional_baseline' && (
                                        <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                            Offline Baseline
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] text-gray-600 font-medium">
                                    {weather.location_source === 'regional_baseline' 
                                        ? 'लाइव मौसम अनुपलब्ध — छिड़काव से पहले बारिश न होने की पुष्टि करें' 
                                        : `Rain Risk (6h): ${weather.rain_risk_6h_percent}% · Wind: ${weather.wind_speed_kmh} km/h`
                                    }
                                </span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm ${
                            weather.location_source === 'regional_baseline'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : weather.is_spray_safe 
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                            {weather.location_source === 'regional_baseline'
                                ? 'Check Rain ⚠'
                                : weather.is_spray_safe ? 'Safe to Spray ✓' : 'Delay Spray ⚠'
                            }
                        </span>
                    </div>
                )}

                {/* 8. Sarvam AI Audio Player */}
                {audioUrl && (
                    <div className="w-full bg-white p-3.5 rounded-2xl shadow-lg border border-emerald-200 flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between px-1 text-xs">
                            <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                                <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" /> 
                                {currentLangObj.name} ({currentLangObj.label}) Advisory
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                                Sarvam AI Bulbul:v3
                            </span>
                        </div>
                        <audio 
                            ref={audioRef} 
                            controls 
                            autoPlay 
                            src={audioUrl} 
                            className="w-full h-9 rounded-lg"
                        />
                    </div>
                )}

            </div>
        </div>
    );
}
