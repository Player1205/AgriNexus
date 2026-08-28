import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { uploadImage, createTelemetrySocket } from '../services/api';

const STATUS = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    ERROR: 'error',
};

const NODE_STYLES = {
    vision: { text: "Running computer vision...", size: "text-xl", color: "text-cyan-600" },
    rag: { text: "Fetching ICAR guidelines...", size: "text-lg", color: "text-purple-600" },
    safety: { text: "Verifying safety engine...", size: "text-xl", color: "text-emerald-600" },
    web3: { text: "Putting on blockchain...", size: "text-2xl", color: "text-amber-500" },
    voice: { text: "Synthesizing voice...", size: "text-lg", color: "text-green-600" }
};

export default function FarmerView({ onAnalysisComplete }) {
    const [status, setStatus] = useState(STATUS.IDLE);
    const [activeNode, setActiveNode] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);
    const audioRef = useRef(null);

    // Listen to live agent steps to update the UI
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
        setActiveNode(null);

        try {
            setStatus(STATUS.PROCESSING);
            const result = await uploadImage(file);

            if (onAnalysisComplete) {
                onAnalysisComplete(result);
            }

            setDiagnosis(result.vision_diagnosis || 'Analysis complete');

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
    }, [onAnalysisComplete]);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-green-50 to-white px-4 py-6 sm:p-6 space-y-6 sm:space-y-8 overflow-x-hidden">
            {/* Header */}
            <div className="text-center space-y-1 sm:space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-green-800">🌾 AgriNexus</h1>
                <p className="text-gray-600 text-sm">फसल की फ़ोटो लें या अपलोड करें</p>
            </div>

            {/* Upload Area */}
            <button
                onClick={triggerFileInput}
                disabled={status === STATUS.PROCESSING}
                className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border-4 border-dashed border-green-400 bg-green-50 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-green-300"
            >
                {status === STATUS.PROCESSING ? (
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                ) : (
                    <>
                        <Camera className="w-12 h-12 text-green-600" />
                        <span className="text-green-700 font-semibold text-sm">Tap to Upload</span>
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

            {/* Status Indicator (Dynamic Animation per Node) */}
            {status === STATUS.PROCESSING && (
                <div className="flex flex-col items-center h-16 justify-center overflow-visible">
                    <span 
                        key={activeNode} 
                        className={`font-bold tracking-wide animate-bounce transition-all duration-500 ease-in-out ${
                            activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].size : "text-base"
                        } ${
                            activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].color : "text-amber-600"
                        }`}
                        style={{ textShadow: "0px 2px 10px rgba(0,0,0,0.1)" }}
                    >
                        {activeNode && NODE_STYLES[activeNode] ? NODE_STYLES[activeNode].text : "Initializing AI..."}
                    </span>
                </div>
            )}

            {status === STATUS.SUCCESS && (
                <div className="flex flex-col items-center gap-3 animate-in fade-in">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <p className="text-green-700 font-bold text-lg">Verified & Safe ✓</p>
                    <p className="text-gray-600 text-center text-sm max-w-xs">{diagnosis}</p>
                </div>
            )}

            {status === STATUS.ERROR && (
                <div className="flex flex-col items-center gap-3">
                    <AlertTriangle className="w-16 h-16 text-red-500" />
                    <p className="text-red-700 font-bold">⚠ Warning</p>
                    <p className="text-red-600 text-center text-sm max-w-xs">{errorMessage}</p>
                </div>
            )}

            {/* Audio Player */}
            {audioUrl && (
                <div className="w-full max-w-xs">
                    <p className="text-xs text-gray-500 mb-1 text-center">🔊 Treatment Audio (Hindi)</p>
                    <audio
                        ref={audioRef}
                        controls
                        autoPlay
                        src={audioUrl}
                        className="w-full"
                    />
                </div>
            )}
        </div>
    );
}
