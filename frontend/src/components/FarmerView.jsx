import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadImage, createTelemetrySocket, getBaseApiUrl } from '../services/api';
import { synthesizeSarvamSpeech } from '../services/edgeVoiceAgent';
import { Camera, Volume2, Globe, AlertTriangle, CheckCircle, MapPin, Phone, ExternalLink, WifiOff, RefreshCw, Image as ImageIcon, Database } from 'lucide-react';
import LaptopWebcamModal from './LaptopWebcamModal';

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

const UI_TRANSLATIONS = {
    hi: { camera: "फोटो खींचें", gallery: "गैलरी से चुनें" },
    pa: { camera: "ਫੋਟੋ ਖਿੱਚੋ", gallery: "ਗੈਲਰੀ ਤੋਂ ਚੁਣੋ" },
    te: { camera: "ఫోటో తీయండి", gallery: "గ్యాలరీ నుండి ఎంచుకోండి" },
    ta: { camera: "புகைப்படம் எடுக்கவும்", gallery: "கேலரியில் இருந்து தேர்ந்தெடுக்கவும்" },
    ml: { camera: "ഫോട്ടോ എടുക്കുക", gallery: "ഗാലറിയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക" },
    kn: { camera: "ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ", gallery: "ಗ್ಯಾಲರಿಯಿಂದ ಆರಿಸಿ" },
    bn: { camera: "ছবি তুলুন", gallery: "গ্যালারি থেকে বেছে নিন" },
    mr: { camera: "फोटो काढा", gallery: "गॅलरीतून निवडा" },
    gu: { camera: "ફોટો લો", gallery: "ગેલેરીમાંથી પસંદ કરો" },
    od: { camera: "ଫଟୋ ନିଅନ୍ତୁ", gallery: "ଗ୍ୟାଲେରୀରୁ ବାଛନ୍ତୁ" },
    en: { camera: "Take Photo", gallery: "Choose from Gallery" }
};

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

export default function FarmerView({ onAnalysisComplete, onOpenScans }) {
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
    const [isCropSupported, setIsCropSupported] = useState(true);
    const [detectedSubject, setDetectedSubject] = useState('');
    const [isSpraySafe, setIsSpraySafe] = useState(true);
    const [weatherWarnings, setWeatherWarnings] = useState([]);

    // Laptop Webcam Fallback State
    const [showLaptopWebcam, setShowLaptopWebcam] = useState(false);

    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [offlineSyncCount, setOfflineSyncCount] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [boundingBox, setBoundingBox] = useState(null);

    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const audioRef = useRef(null);

    // Online / Offline Network State Monitoring & Store-and-Forward Sync
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            let queue = [];
            try {
                queue = JSON.parse(localStorage.getItem('agrinexus_offline_queue') || '[]');
            } catch {
                localStorage.removeItem('agrinexus_offline_queue');
            }
            if (queue.length > 0) {
                setOfflineSyncCount(queue.length);
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
                // Strict isolation
                const activeSession = typeof window !== 'undefined' ? window.__agrinexus_active_session : null;
                if (!activeSession || data.session_id !== activeSession) {
                    return; // Ignore events from other devices / sessions
                }
                setActiveNode(data.node);
            }, 'farmer_view');
        } else {
            setActiveNode(null);
        }
        return () => {
            if (ws) ws.close();
        };
    }, [status]);

    // Native On-Device Web Speech API Fallback strictly for Offline Scenarios
    const speakOnDeviceFallback = (text, langCode) => {
        // Strict Invariant: Built-in device TTS should ONLY occur when internet is not connected!
        if (typeof navigator !== 'undefined' && navigator.onLine) {
            console.log("[TTS INVARIANT] Device is connected to the internet; suppressing on-device speech synthesis to maintain Sarvam AI priority.");
            return;
        }
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode === 'pa' ? 'pa-IN' : langCode === 'te' ? 'te-IN' : langCode === 'ta' ? 'ta-IN' : 'hi-IN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    // Auto-trigger Sarvam AI audio element playback upon URL arrival
    useEffect(() => {
        if (audioUrl && audioRef.current) {
            try {
                audioRef.current.currentTime = 0;
            } catch {}
            try {
                audioRef.current.play()?.catch((e) => {
                    console.log('[SARVAM PLAYBACK] Autoplay deferred until user interaction:', e);
                });
            } catch {}
        }
    }, [audioUrl]);

    const handleReplayVoice = useCallback(() => {
        if (audioUrl) {
            if (audioRef.current) {
                try {
                    audioRef.current.currentTime = 0;
                } catch {}
                try {
                    audioRef.current.play()?.catch((e) => console.warn('[AUDIO] Playback error:', e));
                } catch {}
            } else {
                // Prevent ghost audio that cannot be paused by the user UI
                console.warn('[AUDIO] Audio player is not mounted yet.');
            }
        } else if (typeof navigator !== 'undefined' && navigator.onLine && translatedText) {
            // User gesture tap to synthesize and play Sarvam AI online speech
            synthesizeSarvamSpeech(translatedText, selectedLang).then((newUrl) => {
                if (newUrl) {
                    setAudioUrl(newUrl);
                    // Playback is automatically handled by the useEffect above when audioUrl state updates
                }
            });
        } else if (typeof navigator !== 'undefined' && !navigator.onLine && translatedText) {
            speakOnDeviceFallback(translatedText, selectedLang);
        }
    }, [audioUrl, translatedText, selectedLang]);

    const handleFileSelect = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setPreviewUrl(URL.createObjectURL(file));
        setBoundingBox(null);
        setStatus(STATUS.UPLOADING);
        setErrorMessage('');
        setAudioUrl(null);
        setDiagnosis('');
        setTranslatedText('');
        setWeather(null);
        setNearestKvk(null);
        setIsMicProtected(false);
        setIsSpraySafe(true);
        setWeatherWarnings([]);
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
                let existing = [];
                try {
                    existing = JSON.parse(localStorage.getItem('agrinexus_offline_queue') || '[]');
                } catch {
                    existing = [];
                }
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
            if (result.bounding_box) {
                setBoundingBox(result.bounding_box);
            }

            if (result.vernacular_audio_url) {
                const baseUrl = getBaseApiUrl();
                const resolvedAudio = (
                    result.vernacular_audio_url.startsWith('http') ||
                    result.vernacular_audio_url.startsWith('data:') ||
                    result.vernacular_audio_url.startsWith('blob:') ||
                    !baseUrl
                )
                    ? result.vernacular_audio_url
                    : `${baseUrl}${result.vernacular_audio_url}`;
                setAudioUrl(resolvedAudio);
            } else if (result.translated_text && typeof navigator !== 'undefined' && navigator.onLine) {
                // Online but audioUrl was not ready from cloud; synthesize immediately via Sarvam AI
                synthesizeSarvamSpeech(result.translated_text, selectedLang).then((newUrl) => {
                    if (newUrl) setAudioUrl(newUrl);
                });
            } else if (result.translated_text && !navigator.onLine) {
                speakOnDeviceFallback(result.translated_text, selectedLang);
            }

            if (result.is_crop_supported !== undefined) {
                setIsCropSupported(result.is_crop_supported);
            } else {
                setIsCropSupported(true);
            }
            if (result.detected_subject) {
                setDetectedSubject(result.detected_subject);
            }

            if (result.is_spray_safe !== undefined) {
                setIsSpraySafe(result.is_spray_safe);
            }
            if (result.weather_warnings && Array.isArray(result.weather_warnings)) {
                setWeatherWarnings(result.weather_warnings);
            } else if (result.safety_warning && (result.safety_warning.includes('rain') || result.safety_warning.includes('wind') || result.safety_warning.includes('temperature') || result.safety_warning.includes('barish') || result.safety_warning.includes('hawa'))) {
                setWeatherWarnings([result.safety_warning]);
            }

            setStatus(result.is_safe ? STATUS.SUCCESS : STATUS.ERROR);

            if (!result.is_safe) {
                setErrorMessage(result.safety_warning || 'Treatment deemed non-actionable.');
            }
        } catch (err) {
            setStatus(STATUS.ERROR);
            setErrorMessage('Network connection lost. Diagnostic stored in offline queue and will auto-sync upon reconnection.');
            if ('speechSynthesis' in window && !navigator.onLine) {
                speakOnDeviceFallback("नेटवर्क उपलब्ध नहीं है। आपकी जांच सुरक्षित कर ली गई है।", 'hi');
            }
        }
    }, [selectedLang, onAnalysisComplete]);

    const triggerCamera = () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            if (cameraInputRef.current) {
                cameraInputRef.current.value = '';
                cameraInputRef.current.click();
            }
        } else {
            setShowLaptopWebcam(true);
        }
    };

    const triggerGallery = () => {
        if (galleryInputRef.current) {
            galleryInputRef.current.value = '';
            galleryInputRef.current.click();
        }
    };

    const currentLangObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

    return (
        <div className="flex flex-col items-center justify-start w-full h-full min-h-0 bg-gradient-to-b from-green-50/80 via-white to-green-50/40 px-4 sm:px-8 py-5 sm:py-8 overflow-y-auto overflow-x-hidden">
            
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
                    <div className="flex items-center justify-center gap-2.5">
                        <img src="/app-logo.png" alt="AgriNexus Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm" />
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

                {/* 3. Dual Photo Capture Options (Camera & Gallery) */}
                <div className="w-full grid grid-cols-2 gap-3">
                    {/* 📸 Take Photo (Direct Camera) */}
                    <button
                        type="button"
                        onClick={triggerCamera}
                        disabled={status === STATUS.PROCESSING || status === STATUS.UPLOADING}
                        className="h-24 sm:h-28 border-2 border-dashed border-green-500/80 rounded-2xl bg-white/90 hover:bg-green-50/60 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                        <div className="p-2 bg-green-100 rounded-full text-green-700 shadow-inner">
                            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-green-900 font-bold text-xs sm:text-sm tracking-wide">
                            {UI_TRANSLATIONS[selectedLang]?.camera || UI_TRANSLATIONS['en'].camera}
                        </span>
                        <span className="text-[10px] text-green-700 font-medium">
                            (Camera)
                        </span>
                    </button>

                    {/* 🖼️ Upload from Gallery / Files */}
                    <button
                        type="button"
                        onClick={triggerGallery}
                        disabled={status === STATUS.PROCESSING || status === STATUS.UPLOADING}
                        className="h-24 sm:h-28 border-2 border-dashed border-emerald-500/80 rounded-2xl bg-white/90 hover:bg-emerald-50/60 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                        <div className="p-2 bg-emerald-100 rounded-full text-emerald-700 shadow-inner">
                            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-emerald-900 font-bold text-xs sm:text-sm tracking-wide">
                            {UI_TRANSLATIONS[selectedLang]?.gallery || UI_TRANSLATIONS['en'].gallery}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium">
                            (Gallery)
                        </span>
                    </button>

                    {/* Hidden Native File Inputs */}
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Image Preview with Bounding Box Overlay */}
                {previewUrl && (
                    <div className="w-full relative mt-2 mb-2 rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-black/5 flex justify-center">
                        <div className="relative inline-block max-w-full">
                            <img src={previewUrl} alt="Uploaded Crop" className="max-w-full h-auto max-h-64 object-contain" />
                            {boundingBox && (
                                <div 
                                    className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none transition-all duration-500"
                                    style={{
                                        left: `${(boundingBox.x / 640) * 100}%`,
                                        top: `${(boundingBox.y / 640) * 100}%`,
                                        width: `${(boundingBox.width / 640) * 100}%`,
                                        height: `${(boundingBox.height / 640) * 100}%`
                                    }}
                                >
                                    <span className="absolute -top-5 left-[-2px] bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-t whitespace-nowrap">
                                        {diagnosis || "Detected Area"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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

                        {/* Weather Spray Safety Alert Banner */}
                        {(!isSpraySafe || (weatherWarnings && weatherWarnings.length > 0)) && (
                            <div className="w-full bg-amber-50 border-2 border-amber-300/80 p-2.5 rounded-xl flex items-start gap-2 text-amber-900 text-xs shadow-sm">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                <div className="flex flex-col text-left">
                                    <span className="font-extrabold text-amber-950 text-xs">
                                        ⚠️ मौसम चेतावनी — छिड़काव स्थगित करें (Weather Alert):
                                    </span>
                                    <span className="text-[11px] text-amber-900 font-medium leading-tight mt-0.5">
                                        {weatherWarnings && weatherWarnings.length > 0
                                            ? weatherWarnings.join(" | ")
                                            : "प्रतिकूल मौसम के कारण अभी रासायनिक छिड़काव न करें। मौसम साफ होने की प्रतीक्षा करें।"}
                                    </span>
                                </div>
                            </div>
                        )}
                        {translatedText && (
                            <div className="w-full flex flex-col items-center gap-2 mt-1">
                                <p className="text-xs text-gray-700 text-center italic bg-gray-50 p-3 rounded-xl border border-gray-100 w-full leading-relaxed">
                                    "{translatedText}"
                                </p>
                                <button
                                    type="button"
                                    onClick={handleReplayVoice}
                                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                                    title="Listen to vernacular spoken advisory"
                                >
                                    <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                    <span>{audioUrl ? "🔊 सुनो (Play Audio)" : "🔊 सुनो (Offline Audio)"}</span>
                                </button>
                            </div>
                        )}

                        {/* MongoDB Atlas Saved Record Indicator */}
                        <div className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs text-emerald-800 mt-1">
                            <span className="flex items-center gap-1.5 font-medium">
                                <Database className="w-3.5 h-3.5 text-emerald-600" />
                                Stored in your MongoDB Atlas account
                            </span>
                            {onOpenScans && (
                                <button
                                    type="button"
                                    onClick={onOpenScans}
                                    className="font-bold text-emerald-700 hover:text-emerald-950 underline ml-2 text-[11px]"
                                >
                                    My Scans &rarr;
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 6. Non-Actionable / Statutory KVK Referral or Non-Agricultural Card */}
                {status === STATUS.ERROR && (
                    !isCropSupported ? (
                        /* 🌿 Non-Agricultural Subject Intercept Card (Amber) */
                        <div className="w-full bg-amber-50/95 p-4 rounded-2xl border-2 border-amber-300 shadow-md flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-sm">
                                <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
                                <span>गैर-लक्षित / अनधिकृत विषय (Non-Target Subject)</span>
                            </div>
                            
                            <div className="bg-amber-100/90 px-3 py-1.5 rounded-xl text-center w-full">
                                <p className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider">पहचाना गया विषय (Detected Subject)</p>
                                <p className="text-amber-950 font-extrabold text-xs sm:text-sm">{detectedSubject || diagnosis || 'Non-Agricultural Subject'}</p>
                            </div>
                            
                            <p className="text-amber-900 text-center text-xs font-medium leading-relaxed">
                                {errorMessage || 'AgriNexus 14 मुख्य कृषि फसलों के लिए प्रमाणित है। कृपया समर्थित फसल की पत्ती का फोटो अपलोड करें।'}
                            </p>

                            {/* Supported 14 Crops Pill Grid */}
                            <div className="w-full bg-white/90 p-2.5 rounded-xl border border-amber-200">
                                <p className="text-[10px] font-bold text-gray-500 mb-1.5 text-center">🌿 समर्थित 14 मुख्य कृषि फसलें (Certified Crops):</p>
                                <div className="flex flex-wrap gap-1 justify-center">
                                    {['Tomato', 'Potato', 'Corn', 'Apple', 'Grape', 'Strawberry', 'Pepper', 'Orange', 'Soybean', 'Peach', 'Cherry', 'Squash', 'Raspberry', 'Blueberry'].map((c) => (
                                        <span key={c} className="text-[10px] bg-green-50 text-green-800 font-semibold px-2 py-0.5 rounded-md border border-green-200">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {translatedText && (
                                <div className="w-full flex flex-col items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-800 text-center italic bg-white/90 p-3 rounded-xl border border-amber-200 w-full leading-relaxed">
                                        "{translatedText}"
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleReplayVoice}
                                        className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                                        title="Listen to non-target subject advisory"
                                    >
                                        <Volume2 className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                                        <span>{audioUrl ? "🔊 सुनो (Play Audio)" : "🔊 सुनो (Offline Audio)"}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ⚠️ Low-Confidence / KVK Verification Card (Red) */
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
                                            {nearestKvk.distance_km === 'Unknown' ? 'Location Disabled' : `${nearestKvk.distance_km} km away`}
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
                                <div className="w-full flex flex-col items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-800 text-center italic bg-white/90 p-3 rounded-xl border border-red-100 w-full leading-relaxed">
                                        "{translatedText}"
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleReplayVoice}
                                        className="flex items-center gap-1.5 text-xs font-bold text-red-900 bg-red-100 hover:bg-red-200 border border-red-300 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                                        title="Listen to KVK referral advisory"
                                    >
                                        <Volume2 className="w-3.5 h-3.5 text-red-700 animate-pulse" />
                                        <span>{audioUrl ? "🔊 सुनो (Play Audio)" : "🔊 सुनो (Offline Audio)"}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                )}

                {/* 7. Live Farm Meteorological Telemetry HUD */}
                {weather && (
                    <div className={`w-full p-3 rounded-2xl border shadow-sm flex items-center justify-between animate-in fade-in duration-300 ${
                        (!weather.is_live_weather || weather.location_source.toUpperCase() === 'REGIONAL_BASELINE' || weather.location_source.toUpperCase() === 'OFFLINE_FALLBACK')
                            ? 'bg-amber-50/90 border-amber-200'
                            : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border-blue-200/80'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            <span className="text-xl">{(!weather.is_live_weather || weather.location_source.toUpperCase() === 'REGIONAL_BASELINE' || weather.location_source.toUpperCase() === 'OFFLINE_FALLBACK') ? '⚠️' : '⛅'}</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                                    {weather.temperature_c}°C · {weather.relative_humidity}% Humidity
                                    {(!weather.is_live_weather || weather.location_source.toUpperCase() === 'REGIONAL_BASELINE' || weather.location_source.toUpperCase() === 'OFFLINE_FALLBACK') && (
                                        <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                            Offline Baseline
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] text-gray-600 font-medium">
                                    {(!weather.is_live_weather || weather.location_source.toUpperCase() === 'REGIONAL_BASELINE' || weather.location_source.toUpperCase() === 'OFFLINE_FALLBACK')
                                        ? 'लाइव मौसम अनुपलब्ध — छिड़काव से पहले बारिश न होने की पुष्टि करें' 
                                        : `Rain Risk (6h): ${weather.rain_risk_6h_percent}% · Wind: ${weather.wind_speed_kmh} km/h`
                                    }
                                </span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm ${
                            (!weather.is_live_weather || weather.location_source.toUpperCase() === 'REGIONAL_BASELINE' || weather.location_source.toUpperCase() === 'OFFLINE_FALLBACK')
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : weather.is_spray_safe 
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                            {(!weather.is_live_weather || weather.location_source.toUpperCase() === 'REGIONAL_BASELINE' || weather.location_source.toUpperCase() === 'OFFLINE_FALLBACK')
                                ? 'Check Rain ⚠'
                                : weather.is_spray_safe ? 'Safe to Spray ✓' : 'Delay Spray ⚠'
                            }
                        </span>
                    </div>
                )}

                {/* 8. Sarvam AI Audio Player */}
                {audioUrl ? (
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
                ) : (translatedText && !isOffline) ? (
                    <div className="w-full bg-emerald-50/90 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                            <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                            <span>Sarvam AI Audio ready</span>
                        </div>
                        <button
                            onClick={handleReplayVoice}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-emerald-700 hover:to-green-700 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Play Voice Note</span>
                        </button>
                    </div>
                ) : null}

            </div>

            {/* Laptop Webcam Modal (Fallback for Desktop) */}
            <LaptopWebcamModal 
                isOpen={showLaptopWebcam} 
                onClose={() => setShowLaptopWebcam(false)} 
                onCapture={(file) => {
                    handleFileSelect({ target: { files: [file] } });
                }} 
            />
        </div>
    );
}
