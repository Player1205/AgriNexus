import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles } from 'lucide-react';

export default function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // 1. Check if already running in standalone mode (already added to home screen)
        const checkStandalone = () => {
            if (typeof window === 'undefined') return false;
            const isStandaloneMode = 
                window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://');
            return isStandaloneMode;
        };

        if (checkStandalone()) {
            setIsInstalled(true);
            return; // Silent mode: User already added to home screen, show nothing!
        }

        // Detect iOS
        const ua = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
        if (isIosDevice) {
            setIsIos(true);
        }

        // Show banner by default if not standalone and not dismissed
        const isDismissed = sessionStorage.getItem('agrinexus_pwa_dismissed');
        if (!isDismissed) {
            setShowBanner(true);
        }

        // 2. Catch Android / Chromium browser PWA installation trigger
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!isDismissed) {
                setShowBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for appinstalled event to auto-hide
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowBanner(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        // Custom trigger from navbar button
        const handleCustomTrigger = () => {
            setShowBanner(true);
            if (deferredPrompt) {
                deferredPrompt.prompt();
            } else {
                setShowInstructions(true);
            }
        };

        window.addEventListener('trigger-pwa-install', handleCustomTrigger);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('trigger-pwa-install', handleCustomTrigger);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult && choiceResult.outcome === 'accepted') {
                console.log('[PWA] User accepted installation');
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        } else {
            // Show helpful instructions if browser hasn't fired beforeinstallprompt
            setShowInstructions(true);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        sessionStorage.setItem('agrinexus_pwa_dismissed', 'true');
    };

    if (isInstalled || !showBanner) {
        return null; // Don't show anything if already installed or dismissed
    }

    return (
        <aside 
            aria-label="App Installation"
            className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md bg-gradient-to-r from-emerald-950 via-gray-900 to-gray-900 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white animate-fade-in transition-all"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/50">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                            Install AgriNexus App
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                                100% Offline
                            </span>
                        </h4>
                        <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                            {isIos 
                                ? "Add to Home Screen for instant offline field diagnostics with 0 internet."
                                : "Add to your phone for instant offline scans & 0 cellular data use."}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    aria-label="Close installation banner"
                    className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/80 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {showInstructions && !isIos && (
                <div className="mt-2.5 p-2.5 bg-emerald-950/70 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 animate-fade-in">
                    <p className="font-semibold text-emerald-300">To add to your phone's Home Screen:</p>
                    <p className="mt-1 text-[11px] text-gray-300">
                        Tap your browser menu (<span className="font-bold text-white">⋮</span> in top-right) and select <span className="font-bold text-white">"Install app"</span> or <span className="font-bold text-white">"Add to Home screen"</span>.
                    </p>
                </div>
            )}

            <div className="mt-3.5 pt-3 border-t border-emerald-500/20 flex items-center justify-between gap-2">
                {isIos ? (
                    <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium">
                        <span>Tap <Share className="w-3.5 h-3.5 inline-block text-cyan-400 mx-0.5" /> Share then select <PlusSquare className="w-3.5 h-3.5 inline-block text-emerald-400 mx-0.5" /> <strong>Add to Home Screen</strong></span>
                    </div>
                ) : (
                    <>
                        <span className="text-[11px] text-gray-400">
                            Fast • No App Store download needed
                        </span>
                        <button
                            onClick={handleInstallClick}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-bold text-xs rounded-xl shadow-md shadow-emerald-900/40 active:scale-95 transition-all"
                        >
                            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Add to Home Screen</span>
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
}
