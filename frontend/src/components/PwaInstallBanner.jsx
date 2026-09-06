import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles } from 'lucide-react';

export default function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // 1. Check if already running in standalone mode (already added to home screen)
        const checkStandalone = () => {
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

        // Check if user dismissed the prompt in this session
        const isDismissed = sessionStorage.getItem('agrinexus_pwa_dismissed');
        if (isDismissed) return;

        // 2. Android / Chromium browser PWA installation trigger
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 3. Detect iOS Safari (which doesn't fire beforeinstallprompt)
        const ua = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
        const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

        if (isIosDevice && isSafari && !checkStandalone()) {
            setIsIos(true);
            setShowBanner(true);
        }

        // Listen for appinstalled event to auto-hide
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowBanner(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted the installation');
            setShowBanner(false);
        } else {
            console.log('[PWA] User dismissed the installation');
        }
        setDeferredPrompt(null);
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
