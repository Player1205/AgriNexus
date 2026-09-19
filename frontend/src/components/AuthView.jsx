import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Globe,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react";
import { login, register } from "../services/auth";

export const AUTH_LANGUAGES = [
  {
    code: "en",
    name: "English",
    welcome: "Welcome Back",
    welcomeRegister: "Create Account",
    subWelcome: "Login to continue your crop protection journey.",
    subWelcomeRegister: "Register to safeguard your crops with AI advisory.",
    emailPlaceholder: "Enter your email",
    passwordPlaceholder: "Enter your password",
    namePlaceholder: "Enter your full name",
    forgotPassword: "Forgot password?",
    loginBtn: "Login",
    registerBtn: "Create Account",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    registerNow: "Register Now",
    loginNow: "Login",
    demoFill: "Fill demo account",
    submitting: "Please wait...",
  },
  {
    code: "hi",
    name: "हिन्दी",
    welcome: "स्वागत है",
    welcomeRegister: "खाता बनाएं",
    subWelcome: "अपनी फसल सुरक्षा यात्रा जारी रखने के लिए लॉगिन करें।",
    subWelcomeRegister: "फसल सुरक्षा और AI सलाह के लिए नया खाता बनाएं।",
    emailPlaceholder: "अपना ईमेल दर्ज करें",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    namePlaceholder: "पूरा नाम दर्ज करें",
    forgotPassword: "पासवर्ड भूल गए?",
    loginBtn: "लॉगिन करें",
    registerBtn: "खाता बनाएं",
    noAccount: "खाता नहीं है?",
    haveAccount: "पहले से खाता है?",
    registerNow: "पंजीकरण करें",
    loginNow: "लॉगिन",
    demoFill: "डेमो अकाउंट भरें",
    submitting: "कृपया प्रतीक्षा करें...",
  },
  {
    code: "pa",
    name: "ਪੰਜਾਬੀ",
    welcome: "ਜੀ ਆਇਆ ਨੂੰ",
    welcomeRegister: "ਖਾਤਾ ਬਣਾਓ",
    subWelcome: "ਫਸਲ ਸੁਰੱਖਿਆ ਜਾਰੀ ਰੱਖਣ ਲਈ ਲੌਗ ਇਨ ਕਰੋ।",
    subWelcomeRegister: "ਫਸਲ ਸੁਰੱਖਿਆ ਲਈ ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ।",
    emailPlaceholder: "ਆਪਣਾ ਈਮੇਲ ਦਰਜ ਕਰੋ",
    passwordPlaceholder: "ਆਪਣਾ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ",
    namePlaceholder: "ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ",
    forgotPassword: "ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?",
    loginBtn: "ਲੌਗ ਇਨ",
    registerBtn: "ਖਾਤਾ ਬਣਾਓ",
    noAccount: "ਖਾਤਾ ਨਹੀਂ ਹੈ?",
    haveAccount: "ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?",
    registerNow: "ਰਜਿਸਟਰ ਕਰੋ",
    loginNow: "ਲੌਗ ਇਨ",
    demoFill: "ਡੈਮੋ ਭਰੋ",
    submitting: "ਉਡੀਕ ਕਰੋ...",
  },
  {
    code: "te",
    name: "తెలుగు",
    welcome: "స్వాగతం",
    welcomeRegister: "ఖాతా సృష్టించండి",
    subWelcome: "పంట రక్షణ కొనసాగించడానికి లాగిన్ చేయండి.",
    subWelcomeRegister: "పంట సంరక్షణ కోసం ఖాతా సృష్టించండి.",
    emailPlaceholder: "మీ ఈమెయిల్ నమోదు చేయండి",
    passwordPlaceholder: "మీ పాస్‌వర్డ్ నమోదు చేయండి",
    namePlaceholder: "పూర్తి పేరు నమోదు చేయండి",
    forgotPassword: "పాస్‌వర్డ్ మర్చిపోయారా?",
    loginBtn: "లాగిన్",
    registerBtn: "ఖాతా సృష్టించండి",
    noAccount: "ఖాతా లేదా?",
    haveAccount: "ఖాతా ఉందా?",
    registerNow: "నమోదు చేసుకోండి",
    loginNow: "లాగిన్",
    demoFill: "డెమో",
    submitting: "వేచి ఉండండి...",
  },
  {
    code: "ta",
    name: "தமிழ்",
    welcome: "வரவேற்பு",
    welcomeRegister: "கணக்கு உருவாக்க",
    subWelcome: "பயிர் பாதுகாப்பை தொடர உள்நுழையவும்.",
    subWelcomeRegister: "பயிர் பாதுகாப்புக்காக கணக்கு தொடங்கவும்.",
    emailPlaceholder: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
    passwordPlaceholder: "உங்கள் கடவுச்சொல்லை உள்ளிடவும்",
    namePlaceholder: "முழு பெயரை உள்ளிடவும்",
    forgotPassword: "கடவுச்சொல் மறந்ததா?",
    loginBtn: "உள்நுழைக",
    registerBtn: "கணக்கு உருவாக்க",
    noAccount: "புதியவரா?",
    haveAccount: "கணக்கு உள்ளதா?",
    registerNow: "பதிவு செய்க",
    loginNow: "உள்நுழைக",
    demoFill: "டெமோ",
    submitting: "காத்திருக்கவும்...",
  },
  {
    code: "bn",
    name: "বাংলা",
    welcome: "স্বাগতম",
    welcomeRegister: "অ্যাকাউন্ট তৈরি করুন",
    subWelcome: "ফসল সুরক্ষা চালিয়ে যেতে লগ ইন করুন।",
    subWelcomeRegister: "ফসল সুরক্ষায় অ্যাকাউন্ট খুলুন।",
    emailPlaceholder: "আপনার ইমেল লিখুন",
    passwordPlaceholder: "আপনার পাসওয়ার্ড লিখুন",
    namePlaceholder: "সম্পূর্ণ নাম লিখুন",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    loginBtn: "লগ ইন",
    registerBtn: "অ্যাকাউন্ট তৈরি করুন",
    noAccount: "নতুন অ্যাকাউন্ট?",
    haveAccount: "অ্যাকাউন্ট আছে?",
    registerNow: "নিবন্ধন করুন",
    loginNow: "লগ ইন",
    demoFill: "ডেমো পূরণ করুন",
    submitting: "অনুগ্রহ করে অপেক্ষা করুন...",
  },
  {
    code: "mr",
    name: "मराठी",
    welcome: "स्वागत आहे",
    welcomeRegister: "खाते तयार करा",
    subWelcome: "पीक संरक्षण सुरू ठेवण्यासाठी लॉगिन करा.",
    subWelcomeRegister: "पिकांच्या संरक्षणासाठी खाते तयार करा.",
    emailPlaceholder: "तुमचा ईमेल टाका",
    passwordPlaceholder: "तुमचा पासवर्ड टाका",
    namePlaceholder: "पूर्ण नाव टाका",
    forgotPassword: "पासवर्ड विसरलात?",
    loginBtn: "लॉगिन",
    registerBtn: "खाते तयार करा",
    noAccount: "नवीन खाते?",
    haveAccount: "खाते आहे?",
    registerNow: "नोंदणी करा",
    loginNow: "लॉगिन",
    demoFill: "डेमो भरा",
    submitting: "वाट पहा...",
  },
  {
    code: "gu",
    name: "ગુજરાતી",
    welcome: "સ્વાગત છે",
    welcomeRegister: "ખાતું બનાવો",
    subWelcome: "પાક સુરક્ષા ચાલુ રાખવા માટે લોગ ઇન કરો.",
    subWelcomeRegister: "પાકની સુરક્ષા માટે ખાતું બનાવો.",
    emailPlaceholder: "તમારું ઈમેલ દાખલ કરો",
    passwordPlaceholder: "તમારો પાસવર્ડ દાખલ કરો",
    namePlaceholder: "પૂરું નામ દાખલ કરો",
    forgotPassword: "પાસવર્ડ ભૂલી ગયા?",
    loginBtn: "લોગ ઇન",
    registerBtn: "ખાતું બનાવો",
    noAccount: "નવું ખાતું?",
    haveAccount: "ખાતું છે?",
    registerNow: "નોંધણી કરો",
    loginNow: "લોગ ઇન",
    demoFill: "ડેમો ભરો",
    submitting: "રાહ જુઓ...",
  },
];

export default function AuthView({ onAuthenticated }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = AUTH_LANGUAGES.find((l) => l.code === selectedLang) || AUTH_LANGUAGES[0];

  const handleDemoFill = () => {
    setError("");
    setEmail("farmer@example.com");
    setPassword("FarmerDemo123!");
    if (isRegistering) {
      setName("Ramesh Patel");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const user = isRegistering
        ? await register(name, email, password)
        : await login(email, password);
      onAuthenticated(user);
    } catch (submitError) {
      setError(submitError.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-br from-[#f8faf7] via-[#f1f5ef] to-[#e7efe5] font-sans">
      
      {/* Background Decorative Foliage Elements (Top-Left & Bottom-Right) */}
      <div className="absolute top-[-30px] left-[-30px] w-64 h-64 pointer-events-none opacity-40 sm:opacity-75 select-none filter blur-[0.5px]">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
          <path d="M20,10 Q60,40 40,90 Q80,70 110,120 Q60,110 30,140 Q50,170 20,200" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <path d="M40,30 C65,15 90,35 85,60 C65,65 45,50 40,30 Z" fill="#2d6a4f" opacity="0.75" />
          <path d="M75,55 C105,45 125,75 110,100 C85,95 70,75 75,55 Z" fill="#40916c" opacity="0.7" />
          <path d="M25,80 C50,75 65,105 50,125 C30,115 20,95 25,80 Z" fill="#52b788" opacity="0.6" />
          <path d="M60,110 C90,105 105,135 90,155 C65,145 55,125 60,110 Z" fill="#2d6a4f" opacity="0.65" />
        </svg>
      </div>

      <div className="absolute bottom-[-30px] right-[-30px] w-72 h-72 pointer-events-none opacity-40 sm:opacity-85 select-none filter blur-[0.5px]">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
          <path d="M190,10 Q140,80 150,130 Q120,110 90,150 Q130,150 160,180" stroke="#1b4332" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          <path d="M160,40 C140,65 155,95 180,90 C185,65 175,45 160,40 Z" fill="#1b4332" opacity="0.8" />
          <path d="M130,85 C105,105 120,135 145,130 C155,105 145,90 130,85 Z" fill="#2d6a4f" opacity="0.75" />
          <path d="M85,130 C60,150 75,180 105,175 C115,150 100,135 85,130 Z" fill="#40916c" opacity="0.7" />
          <path d="M140,140 C120,165 135,195 165,190 C170,165 155,145 140,140 Z" fill="#52b788" opacity="0.7" />
        </svg>
      </div>

      {/* Background Corner Watermark Typography */}
      <div className="hidden md:block absolute top-8 right-8 text-right font-sans select-none pointer-events-none z-0">
        <p className="text-xs font-medium text-gray-500 leading-snug">Healthy Crops</p>
        <p className="text-xs font-medium text-gray-500 leading-snug">Brighter Tomorrows</p>
        <div className="w-5 h-[1.5px] bg-gray-400 ml-auto mt-2" />
      </div>

      <div className="hidden md:block absolute bottom-8 left-8 text-left font-sans select-none pointer-events-none z-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">TECHNOLOGY</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">FOR HEALTHIER</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">CROPS</p>
        <div className="w-5 h-[1.5px] bg-gray-400 mt-2" />
      </div>

      {/* Main Elevated White Card Matching the Reference Design */}
      <div className="relative z-10 w-full max-w-[390px] sm:max-w-[430px] rounded-[32px] sm:rounded-[36px] bg-white/95 sm:bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/90 p-7 sm:p-9 flex flex-col transition-all">
        
        {/* Top Floating Language Dropdown inside card */}
        <div className="flex justify-end w-full mb-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-600 text-xs font-medium transition cursor-pointer"
              title="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.name}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-36 max-h-56 overflow-y-auto py-1.5 rounded-2xl bg-white border border-gray-100 shadow-xl z-50 text-left">
                {AUTH_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3.5 py-2 text-xs text-left transition flex items-center justify-between cursor-pointer ${
                      selectedLang === lang.code
                        ? "text-emerald-700 font-bold bg-emerald-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{lang.name}</span>
                    {selectedLang === lang.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Brand Logo: Overlapping Dual Leaves */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 flex items-center justify-center mb-1">
            <svg viewBox="0 0 100 100" fill="none" className="w-14 h-14 drop-shadow-sm">
              {/* Left darker leaf */}
              <path
                d="M49 70 C47 52 35 37 23 35 C22 51 32 66 49 70 Z"
                fill="#1a472a"
              />
              {/* Right fresh green leaf */}
              <path
                d="M51 70 C53 45 70 26 85 22 C87 45 74 64 51 70 Z"
                fill="#388e3c"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-[#173e23]">
            AgriNexus
          </h1>
          <p className="text-[10px] font-bold text-gray-400 tracking-[0.22em] uppercase mt-1">
            AI-POWERED CROP INTELLIGENCE
          </p>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-[25px] font-extrabold text-[#1a202c] tracking-tight">
            {isRegistering ? t.welcomeRegister : t.welcome}
          </h2>
          <p className="text-xs sm:text-[13px] text-gray-500 font-normal mt-1 leading-snug">
            {isRegistering ? t.subWelcomeRegister : t.subWelcome}
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 w-full">
          
          {/* Full Name Input (Register Mode Only) */}
          {isRegistering && (
            <div className="relative flex items-center h-12 sm:h-13 rounded-2xl border border-gray-200 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[#1e6b37] focus-within:ring-2 focus-within:ring-[#1e6b37]/10 transition">
              <User className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                placeholder={t.namePlaceholder}
                className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none font-medium"
              />
            </div>
          )}

          {/* Email Input */}
          <div className="relative flex items-center h-12 sm:h-13 rounded-2xl border border-gray-200 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[#1e6b37] focus-within:ring-2 focus-within:ring-[#1e6b37]/10 transition">
            <Mail className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t.emailPlaceholder}
              className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none font-medium"
            />
          </div>

          {/* Password Input */}
          <div className="relative flex items-center h-12 sm:h-13 rounded-2xl border border-gray-200 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[#1e6b37] focus-within:ring-2 focus-within:ring-[#1e6b37]/10 transition">
            <Lock className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder={t.passwordPlaceholder}
              className="w-full text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-gray-400 hover:text-gray-600 transition shrink-0 ml-1 cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Forgot Password & Demo Fill Row */}
          <div className="flex items-center justify-between text-xs px-1 pt-0.5">
            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition hover:underline cursor-pointer"
              title="Auto-fill demo credentials"
            >
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{t.demoFill}</span>
            </button>

            {!isRegistering && (
              <button
                type="button"
                className="font-semibold text-[#1e6b37] hover:underline cursor-pointer ml-auto text-xs"
              >
                {t.forgotPassword}
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border border-rose-200 bg-rose-50 text-rose-700"
            >
              {error}
            </div>
          )}

          {/* Solid Forest Green Action Button with Arrow */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 sm:h-13 mt-2 rounded-2xl bg-[#236838] hover:bg-[#1b532c] text-white font-bold text-sm sm:text-base shadow-md shadow-green-900/15 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 font-medium">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t.submitting}</span>
              </span>
            ) : (
              <>
                <span>{isRegistering ? t.registerBtn : t.loginBtn}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Switcher: Register / Login (NO Google auth as requested) */}
        <div className="mt-7 text-center text-xs sm:text-[13px] text-gray-500">
          {isRegistering ? (
            <p>
              {t.haveAccount}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                }}
                className="font-bold text-[#1e6b37] hover:underline cursor-pointer ml-1"
              >
                {t.loginNow}
              </button>
            </p>
          ) : (
            <p>
              {t.noAccount}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                }}
                className="font-bold text-[#1e6b37] hover:underline cursor-pointer ml-1"
              >
                {t.registerNow}
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
