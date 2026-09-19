import { useState } from "react";
import { ArrowRight, LockKeyhole, Sprout, Mail, User, Eye, EyeOff, Globe, ShieldCheck } from "lucide-react";
import { login, register } from "../services/auth";

const AUTH_LANGUAGES = [
  { code: "hi", loginLabel: "लॉग इन करें", registerLabel: "खाता बनाएं", welcome: "स्वागत है", subtitle: "फसल सुरक्षा एवं प्रामाणिक सलाह", namePlaceholder: "पूरा नाम दर्ज करें", emailPlaceholder: "ईमेल पता", passwordPlaceholder: "पासवर्ड (कम से कम 8 अक्षर)", submitting: "कृपया प्रतीक्षा करें...", switchToRegister: "नया खाता बनाएं?", switchToLogin: "पहले से खाता है? लॉग इन करें", name: "हिन्दी" },
  { code: "en", loginLabel: "Log In", registerLabel: "Create Account", welcome: "Welcome", subtitle: "Crop Protection & Certified Advisory", namePlaceholder: "Full name", emailPlaceholder: "Email address", passwordPlaceholder: "Password (min 8 chars)", submitting: "Please wait...", switchToRegister: "New? Create account", switchToLogin: "Already have an account? Log in", name: "English" },
  { code: "pa", loginLabel: "ਲੌਗ ਇਨ", registerLabel: "ਖਾਤਾ ਬਣਾਓ", welcome: "ਜੀ ਆਇਆ ਨੂੰ", subtitle: "ਫਸਲ ਸੁਰੱਖਿਆ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਸਲਾਹ", namePlaceholder: "ਪੂਰਾ ਨਾਮ", emailPlaceholder: "ਈਮੇਲ", passwordPlaceholder: "ਪਾਸਵਰਡ (ਘੱਟੋ-ਘੱਟ 8)", submitting: "ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕ ਕਰੋ...", switchToRegister: "ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ?", switchToLogin: "ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ? ਲੌਗ ਇਨ ਕਰੋ", name: "ਪੰਜਾਬੀ" },
  { code: "te", loginLabel: "లాగిన్", registerLabel: "ఖాతా సృష్టించు", welcome: "స్వాగతం", subtitle: "పంట రక్షణ & ధృవీకరించిన సలహా", namePlaceholder: "పూర్తి పేరు", emailPlaceholder: "ఈమెయిల్", passwordPlaceholder: "పాస్‌వర్డ్ (కనీసం 8)", submitting: "దయచేసి వేచి ఉండండి...", switchToRegister: "కొత్త ఖాతా?", switchToLogin: "ఖాతా ఉందా? లాగిన్ చేయండి", name: "తెలుగు" },
  { code: "ta", loginLabel: "உள்நுழை", registerLabel: "கணக்கு உருவாக்கு", welcome: "வரவேற்பு", subtitle: "பயிர் பாதுகாப்பு & சான்றளிக்கப்பட்ட ஆலோசனை", namePlaceholder: "முழு பெயர்", emailPlaceholder: "மின்னஞ்சல்", passwordPlaceholder: "கடவுச்சொல் (குறைந்தது 8)", submitting: "காத்திருங்கள்...", switchToRegister: "புதிய கணக்கு?", switchToLogin: "கணக்கு உள்ளதா? உள்நுழையவும்", name: "தமிழ்" },
  { code: "bn", loginLabel: "লগ ইন", registerLabel: "অ্যাকাউন্ট তৈরি করুন", welcome: "স্বাগতম", subtitle: "ফসল সুরক্ষা ও প্রমাণিত পরামর্শ", namePlaceholder: "পুরো নাম", emailPlaceholder: "ইমেইল", passwordPlaceholder: "পাসওয়ার্ড (ন্যূনতম ৮)", submitting: "অনুগ্রহ করে অপেক্ষা করুন...", switchToRegister: "নতুন অ্যাকাউন্ট?", switchToLogin: "অ্যাকাউন্ট আছে? লগ ইন করুন", name: "বাংলা" },
  { code: "mr", loginLabel: "लॉग इन", registerLabel: "खाते तयार करा", welcome: "स्वागत आहे", subtitle: "पीक संरक्षण आणि प्रमाणित सल्ला", namePlaceholder: "पूर्ण नाव", emailPlaceholder: "ईमेल", passwordPlaceholder: "पासवर्ड (किमान ८)", submitting: "कृपया वाट पहा...", switchToRegister: "नवीन खाते तयार करा?", switchToLogin: "खाते आहे? लॉग इन करा", name: "मराठी" },
  { code: "gu", loginLabel: "લોગ ઇન", registerLabel: "ખાતું બનાવો", welcome: "સ્વાગત છે", subtitle: "પાક સુરક્ષા અને પ્રમાણિત સલાહ", namePlaceholder: "પૂરું નામ", emailPlaceholder: "ઈમેલ", passwordPlaceholder: "પાસવર્ડ (ઓછામાં ઓછા ૮)", submitting: "કૃપા કરી રાહ જુઓ...", switchToRegister: "નવું ખાતું?", switchToLogin: "ખાતું છે? લોગ ઇન કરો", name: "ગુજરાતી" },
];

export default function AuthView({ onAuthenticated }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLang, setSelectedLang] = useState("hi");

  const t = AUTH_LANGUAGES.find((l) => l.code === selectedLang) || AUTH_LANGUAGES[0];

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
      setError(submitError.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-4 py-8 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 30%, #064e3b 60%, #022c22 100%)" }}
    >
      {/* Animated mirror glow orbs */}
      <div className="absolute top-[-120px] left-[-80px] w-[350px] h-[350px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, rgba(34,197,94,0.45) 0%, transparent 70%)", filter: "blur(60px)", animation: "pulse 6s ease-in-out infinite" }}
      />
      <div className="absolute bottom-[-100px] right-[-60px] w-[300px] h-[300px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)", filter: "blur(50px)", animation: "pulse 8s ease-in-out infinite reverse" }}
      />
      <div className="absolute top-[30%] right-[15%] w-[200px] h-[200px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(74,222,128,0.3) 0%, transparent 70%)", filter: "blur(40px)", animation: "pulse 5s ease-in-out infinite 1s" }}
      />

      {/* Mirror reflection line */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(120deg, transparent, transparent 100px, rgba(255,255,255,0.08) 100px, rgba(255,255,255,0.08) 102px)" }}
      />

      {/* Main glass card */}
      <section className="relative z-10 w-full max-w-md flex flex-col items-center gap-4 sm:gap-5">

        {/* Header */}
        <div className="text-center space-y-1.5 w-full">
          <div className="flex items-center justify-center gap-2.5">
            <img src="/app-logo.png" alt="AgriNexus Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-lg" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">AgriNexus</h1>
          </div>
          <p className="text-green-200/80 text-xs sm:text-sm font-medium">
            {t.subtitle} • Autonomous Agricultural Swarm
          </p>
        </div>

        {/* Language Selector — glass card */}
        <div className="w-full p-3 rounded-2xl flex flex-col gap-2 border border-white/10"
          style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        >
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-green-300">
              <Globe className="w-3.5 h-3.5" /> भाषा चुनें (Select Language)
            </span>
            <span className="text-green-200 font-bold bg-green-800/50 px-2.5 py-0.5 rounded-full border border-green-600/40 text-[10px]">
              {t.name}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none no-scrollbar select-none">
            {AUTH_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLang(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    isSelected
                      ? "bg-green-500 text-green-950 shadow-lg shadow-green-900/50 scale-105 ring-2 ring-green-300/60"
                      : "text-green-200/80 border border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                  style={!isSelected ? { background: "rgba(255,255,255,0.04)" } : {}}
                >
                  <span>{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auth Form — frosted glass card */}
        <div className="w-full p-5 sm:p-6 rounded-2xl flex flex-col gap-4 border border-white/10 shadow-2xl shadow-black/30"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          {/* Welcome */}
          <div className="text-center mb-1">
            <div className="mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-green-900/50 border border-green-500/30"
              style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.25) 0%, rgba(16,185,129,0.15) 100%)", backdropFilter: "blur(8px)" }}
            >
              <Sprout className="h-8 w-8 text-green-400 drop-shadow" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight drop-shadow">
              {t.welcome}, AgriNexus
            </h2>
          </div>

          {/* Tab Switcher — mirror-styled pills */}
          <div className="flex gap-2 w-full p-1 rounded-xl border border-white/10"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                !isRegistering
                  ? "bg-green-500 text-green-950 shadow-lg shadow-green-800/40"
                  : "text-green-300/70 hover:text-green-200 hover:bg-white/5"
              }`}
            >
              {t.loginLabel}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                isRegistering
                  ? "bg-green-500 text-green-950 shadow-lg shadow-green-800/40"
                  : "text-green-300/70 hover:text-green-200 hover:bg-white/5"
              }`}
            >
              {t.registerLabel}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isRegistering && (
              <div>
                <label className="block text-[11px] font-semibold text-green-300/80 mb-1 px-0.5">
                  {t.namePlaceholder}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-green-400/50" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength="2"
                    placeholder={t.namePlaceholder}
                    className="w-full rounded-xl border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white outline-none transition placeholder:text-green-300/30 focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20"
                    style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-green-300/80 mb-1 px-0.5">
                {t.emailPlaceholder}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-green-400/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t.emailPlaceholder}
                  className="w-full rounded-xl border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white outline-none transition placeholder:text-green-300/30 focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-green-300/80 mb-1 px-0.5">
                {t.passwordPlaceholder}
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-green-400/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="8"
                  placeholder={t.passwordPlaceholder}
                  className="w-full rounded-xl border border-white/10 pl-10 pr-11 py-2.5 text-sm text-white outline-none transition placeholder:text-green-300/30 focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-green-400/40 hover:text-green-300 p-0.5 transition"
                  title={showPassword ? "Hide" : "Show"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-red-500/30 text-red-200"
                style={{ background: "rgba(239,68,68,0.12)", backdropFilter: "blur(4px)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 sm:h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-green-900/50 active:scale-[0.98] disabled:opacity-50 text-green-950 font-bold text-sm sm:text-base tracking-wide mt-1"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-green-900/40 border-t-green-900 rounded-full animate-spin" />
                  {t.submitting}
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRegistering ? t.registerLabel : t.loginLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch link */}
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
            className="text-xs text-green-400/80 hover:text-green-300 font-semibold transition text-center"
          >
            {isRegistering ? t.switchToLogin : t.switchToRegister}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1.5 text-[10px] text-green-400/40 font-medium">
          <ShieldCheck className="w-3 h-3 text-green-500/50" />
          <span>Secured by MongoDB Atlas • Data encrypted in transit</span>
        </div>
      </section>

      {/* CSS keyframe for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.15); opacity: 0.4; }
        }
      `}</style>
    </main>
  );
}
