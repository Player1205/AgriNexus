import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, CheckCircle, AlertTriangle, Loader2, Globe, Volume2 } from 'lucide-react';
import { uploadImage, createTelemetrySocket } from '../services/api';

const STATUS = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    ERROR: 'error',
};

const LANGUAGES = [
    { code: 'hi', name: 'हिन्दी', label: 'Hindi', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', label: 'Punjabi', flag: '🌾' },
    { code: 'te', name: 'తెలుగు', label: 'Telugu', flag: '🌴' },
    { code: 'ta', name: 'தமிழ்', label: 'Tamil', flag: '🏛️' },
    { code: 'ml', name: 'മലയാളം', label: 'Malayalam', flag: '🥥' },
    { code: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada', flag: '☕' },
    { code: 'bn', name: 'বাংলা', label: 'Bengali', flag: '🎨' },
    { code: 'mr', name: 'मराठी', label: 'Marathi', flag: '🏰' },
    { code: 'gu', name: 'ગુજરાતી', label: 'Gujarati', flag: '🌊' },
    { code: 'od', name: 'ଓଡ଼ିଆ', label: 'Odia', flag: '🛕' },
    { code: 'en', name: 'English', label: 'English', flag: '🌐' }
];

const NODE_STYLES = {
    vision: { text: "Running computer vision...", size: "text-xl", color: "text-cyan-600" },
    rag: { text: "Fetching ICAR guidelines...", size: "text-lg", color: "text-purple-600" },
    safety: { text: "Verifying safety engine...", size: "text-xl", color: "text-emerald-600" },
    web3: { text: "Putting on blockchain...", size: "text-2xl", color: "text-amber-500" },
    voice: { text: "Synthesizing voice via Sarvam AI...", size: "text-lg", color: "text-green-600" }
};

export default function FarmerView({ onAnalysisComplete }) {
    const [status, setStatus] = useState(STATUS.IDLE);
    const [selectedLang, setSelectedLang] = useState('hi');
    const [activeNode, setActiveNode] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);
    const audioRef = useRef(null);

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

    const handleFileSelect = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setStatus(STATUS.UPLOADING);
        setErrorMessage('');
        setAudioUrl(null);
        setDiagnosis('');
        setTranslatedText('');
        setActiveNode(null);

        try {
            setStatus(STATUS.PROCESSING);
            const result = await uploadImage(file, selectedLang);

            if (onAnalysisComplete) {
                onAnalysisComplete(result);
            }

            setDiagnosis(result.vision_diagnosis || 'Analysis complete');
            if (result.translated_text) {
                setTranslatedText(result.translated_text);
            }

            if (result.vernacular_audio_url) {
                setAudioUrl(result.vernacular_audio_url);
            }

            setStatus(result.is_safe ? STATUS.SUCCESS : STATUS.ERROR);

            if (!result.is_safe) {
                setErrorMessage(result.safety_warning || 'Treatment deemed unsafe.');
            }
        } catch (err) {
            setStatus(STATUS.ERROR);
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    }, [onAnalysisComplete, selectedLang]);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

    return (
        <div className="flex flex-col items-center justify-between w-full h-full min-h-[100dvh] lg:min-h-0 bg-gradient-to-b from-green-50 via-white to-green-50/30 px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
            
            {/* Header */}
            <div className="text-center space-y-1 sm:space-y-1.5 w-full">
                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl sm:text-3xl">🌾</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900 tracking-tight">AgriNexus</h1>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">फसल सुरक्षा एवं प्रामाणिक सलाह</p>
            </div>

            {/* Language Selector Bar */}
            <div className="w-full max-w-md bg-white p-2 rounded-2xl shadow-sm border border-green-100 flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-gray-500">
                    <span className="flex items-center gap-1 text-green-700">
                        <Globe className="w-3.5 h-3.5" /> भाषा चुनें (Select Language)
                    </span>
                    <span className="text-green-600 font-bold">{currentLangObj.name} ({currentLangObj.label})</span>
                </div>
                
                {/* Horizontal Scrollable Language Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setSelectedLang(lang.code)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                                selectedLang === lang.code
                                    ? 'bg-green-600 text-white shadow-md scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Upload Trigger Button */}
            <div className="flex flex-col items-center justify-center my-auto">
                <button
                    onClick={triggerFileInput}
                    disabled={status === STATUS.PROCESSING}
                    className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-dashed border-green-500 bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:scale-105 hover:bg-green-100 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-green-300"
                >
                    {status === STATUS.PROCESSING ? (
                        <Loader2 className="w-14 h-14 text-green-600 animate-spin" />
                    ) : (
                        <>
                            <div className="p-3 bg-white rounded-full shadow-md">
                                <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                            </div>
                            <span className="text-green-800 font-bold text-xs sm:text-sm">फोटो खींचें / Upload</span>
                        </>
                    )}
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

            {/* Status Indicator (Dynamic Animated Swarm Feedback) */}
            {status === STATUS.PROCESSING && (
                <div className="flex flex-col items-center h-14 justify-center overflow-visible">
                    <span 
                        key={activeNode} 
                        className={`font-bold tracking-wide animate-bounce transition-all duration-500 ease-in-out ${
                            activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].size : "text-base"
                        } ${
                            activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].color : "text-amber-600"
                        }`}
                        style={{ textShadow: "0px 2px 10px rgba(0,0,0,0.1)" }}
                    >
                        {activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].text : "Initiating Multi-Agent Swarm..."}
                    </span>
                </div>
            )}

            {/* Success Card */}
            {status === STATUS.SUCCESS && (
                <div className="w-full max-w-md bg-white p-4 rounded-2xl border border-green-200 shadow-md flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <p className="text-green-800 font-extrabold text-base">सत्यापित उपचार (Verified Safe ✓)</p>
                    </div>
                    <div className="bg-green-50 p-2.5 rounded-xl w-full text-center">
                        <p className="text-xs text-gray-500 font-semibold mb-0.5">Crop Diagnosis</p>
                        <p className="text-green-900 font-bold text-sm">{diagnosis}</p>
                    </div>
                    {translatedText && (
                        <p className="text-xs text-gray-700 text-center italic bg-gray-50 p-2.5 rounded-xl border border-gray-100 w-full leading-relaxed">
                            "{translatedText}"
                        </p>
                    )}
                </div>
            )}

            {/* Warning Card */}
            {status === STATUS.ERROR && (
                <div className="w-full max-w-md bg-red-50 p-4 rounded-2xl border border-red-200 shadow-md flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                    <p className="text-red-800 font-bold text-sm">⚠ सुरक्षा चेतावनी (Safety Warning)</p>
                    <p className="text-red-700 text-center text-xs">{errorMessage}</p>
                </div>
            )}

            {/* Sarvam AI Audio Player */}
            {audioUrl && (
                <div className="w-full max-w-md bg-white p-3 rounded-2xl shadow-lg border border-emerald-200 flex flex-col gap-2 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between px-1 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" /> 
                            {currentLangObj.name} Voice Advisory
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            Sarvam AI Bulbul:v3
                        </span>
                    </div>
                    <audio
                        ref={audioRef}
                        controls
                        autoPlay
                        src={audioUrl}
                        className="w-full h-10 rounded-lg"
                    />
                </div>
            )}
        </div>
    );
}
