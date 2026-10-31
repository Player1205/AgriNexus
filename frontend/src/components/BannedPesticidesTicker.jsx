import { useState, useEffect } from "react";
import { AlertOctagon, ShieldAlert, X, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import bannedPesticidesLocal from "../data/banned_pesticides.json";
import { fetchBannedPesticides } from "../services/api";

export const TICKER_TRANSLATIONS = {
  hi: {
    badge: "प्रतिबंधित कीटनाशक",
    badgeShort: "प्रतिबंधित",
    statusBanned: "कानूनी रूप से प्रतिबंधित",
    gazetteHeader: "वैधानिक प्राधिकरण एवं राजपत्र अधिसूचना",
    hazardHeader: "WHO / CIB&RC खतरा वर्गीकरण",
    alternativeHeader: "सुरक्षित ICAR प्रमाणित जैविक विकल्प",
    statutoryWarning: "⚠️ भारतीय कृषि कानून (कीटनाशक अधिनियम 1968) के तहत इस रसायन का छिड़काव या बिक्री दण्डनीय अपराध है। AgriNexus सुरक्षा कोर इस रसायन वाले किसी भी उपचार को स्वतः ब्लॉक करता है।",
    closeNotice: "सूचना बंद करें",
    prohibitionDetails: "वैधानिक प्रतिबंध विवरण देखें"
  },
  pa: {
    badge: "ਪਾਬੰਦੀਸ਼ੁਦਾ ਕੀਟਨਾਸ਼ਕ",
    badgeShort: "ਪਾਬੰਦੀਸ਼ੁਦਾ",
    statusBanned: "ਕਾਨੂੰਨੀ ਤੌਰ 'ਤੇ ਪਾਬੰਦੀਸ਼ੁਦਾ",
    gazetteHeader: "ਸਰਕਾਰੀ ਅਥਾਰਟੀ ਅਤੇ ਗਜ਼ਟ ਨੋਟੀਫਿਕੇਸ਼ਨ",
    hazardHeader: "WHO / CIB&RC ਖ਼ਤਰਾ ਵਰਗੀਕਰਨ",
    alternativeHeader: "ਸੁਰੱਖਿਅਤ ICAR ਪ੍ਰਮਾਣਿਤ ਜੈਵਿਕ ਬਦਲ",
    statutoryWarning: "⚠️ ਭਾਰਤੀ ਖੇਤੀਬਾੜੀ ਕਾਨੂੰਨ ਅਧੀਨ ਇਸ ਰਸਾਇਣ ਦੀ ਵਰਤੋਂ ਜਾਂ ਵਿਕਰੀ ਗੈਰ-ਕਾਨੂੰਨੀ ਹੈ। AgriNexus ਸੁਰੱਖਿਆ ਕੋਰ ਇਸ ਰਸਾਇਣ ਵਾਲੇ ਕਿਸੇ ਵੀ ਇਲਾਜ ਨੂੰ ਰੋਕਦਾ ਹੈ।",
    closeNotice: "ਸੂਚਨਾ ਬੰਦ ਕਰੋ",
    prohibitionDetails: "ਪਾਬੰਦੀ ਦੇ ਵੇਰਵੇ ਵੇਖੋ"
  },
  te: {
    badge: "నిషేధిత పురుగుమందులు",
    badgeShort: "నిషేధితం",
    statusBanned: "చట్టబద్ధంగా నిషేధించబడింది",
    gazetteHeader: "చట్టబద్ధమైన అధికారం & గెజిట్ నోటిఫికేషన్",
    hazardHeader: "WHO / CIB&RC ప్రమాద వర్గీకరణ",
    alternativeHeader: "సురక్షితమైన ICAR సర్టిఫైడ్ ప్రత్యామ్నాయం",
    statutoryWarning: "⚠️ భారతీయ వ్యవసాయ చట్టం ప్రకారం ఈ రసాయనాన్ని వాడటం లేదా అమ్మడం చట్టవిరుద్ధం. AgriNexus భద్రతా ఇంజిన్ ఈ రసాయనాన్ని పూర్తిగా నిరోధిస్తుంది.",
    closeNotice: "నోటీసు మూసివేయండి",
    prohibitionDetails: "నిషేధ వివరాలు చూడండి"
  },
  ta: {
    badge: "தடைசெய்யப்பட்ட பூச்சிக்கொல்லிகள்",
    badgeShort: "தடைசெய்யப்பட்டது",
    statusBanned: "சட்டப்பூர்வமாக தடைசெய்யப்பட்டது",
    gazetteHeader: "சட்டப்பூர்வ அதிகாரம் மற்றும் அரசிதழ் அறிவிப்பு",
    hazardHeader: "WHO / CIB&RC ஆபத்து வகைப்பாடு",
    alternativeHeader: "பாதுகாப்பான ICAR சான்றளிக்கப்பட்ட மாற்று",
    statutoryWarning: "⚠️ இந்திய வேளாண்மைச் சட்டத்தின்படி இந்த ரசாயனத்தை தெளிப்பது அல்லது விற்பது சட்டவிரோதமானது. AgriNexus பாதுகாப்பு கோர் இதை தானாகவே தடுக்கிறது.",
    closeNotice: "அறிவிப்பை மூடு",
    prohibitionDetails: "தடை விவரங்களைக் காண்க"
  },
  ml: {
    badge: "നിരോധിത കീടനാശിനികൾ",
    badgeShort: "നിരോധിതം",
    statusBanned: "നിയമപരമായി നിരോധിച്ചത്",
    gazetteHeader: "നിയമപരമായ അധികാരവും ഗസറ്റ് വിജ്ഞാപനവും",
    hazardHeader: "WHO / CIB&RC അപകട വർഗ്ഗീകരണം",
    alternativeHeader: "സുരക്ഷിതമായ ICAR അംഗീകൃത ജൈവ ബദൽ",
    statutoryWarning: "⚠️ ഇന്ത്യൻ കാർഷിക നിയമപ്രകാരം ഈ രാസവസ്തു തളിക്കുന്നതോ വിൽക്കുന്നതോ കുറ്റകരമാണ്. AgriNexus സുരക്ഷാ കോർ ഇതിനെ തടയുന്നു.",
    closeNotice: "അടയ്ക്കുക",
    prohibitionDetails: "നിരോധന വിവരങ്ങൾ കാണുക"
  },
  kn: {
    badge: "ನಿಷೇಧಿತ ಕೀಟನಾಶಕಗಳು",
    badgeShort: "ನಿಷೇಧಿತ",
    statusBanned: "ಕಾನೂನುಬದ್ಧವಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ",
    gazetteHeader: "ಶಾಸನಬದ್ಧ ಪ್ರಾಧಿಕಾರ ಮತ್ತು ಗೆಜೆಟ್ ಅಧಿಸೂಚನೆ",
    hazardHeader: "WHO / CIB&RC ಅಪಾಯದ ವರ್ಗೀಕರಣ",
    alternativeHeader: "ಸುರಕ್ಷಿತ ICAR ಪ್ರಮಾಣೀಕೃತ ಜೈವಿಕ ಪರ್ಯಾಯ",
    statutoryWarning: "⚠️ ಭಾರತೀಯ ಕೃಷಿ ಕಾನೂನಿನ ಅಡಿಯಲ್ಲಿ ಈ ರಾಸಾಯನಿಕದ ಬಳಕೆಯನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ. AgriNexus ಸುರಕ್ಷತಾ ಕೋರ್ ಇದನ್ನು ನಿರ್ಬಂಧಿಸುತ್ತದೆ.",
    closeNotice: "ಮುಚ್ಚಿ",
    prohibitionDetails: "ನಿಷೇಧದ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ"
  },
  bn: {
    badge: "নিষিদ্ধ কীটনাশক তালিকা",
    badgeShort: "নিষিদ্ধ",
    statusBanned: "আইনত সম্পূর্ণ নিষিদ্ধ",
    gazetteHeader: "বিধিবদ্ধ কর্তৃপক্ষ ও গেজেট বিজ্ঞপ্তি",
    hazardHeader: "WHO / CIB&RC বিপদ শ্রেণীবিভাগ",
    alternativeHeader: "নিরাপদ ICAR প্রত্যয়িত জৈব বিকল্প",
    statutoryWarning: "⚠️ ভারতীয় কৃষি আইন অনুসারে এই রাসায়নিক প্রয়োগ বা বিক্রয় দণ্ডনীয় অপরাধ। AgriNexus নিরাপত্তা ইঞ্জিন এটি স্বয়ংক্রিয়ভাবে ব্লক করে।",
    closeNotice: "বিজ্ঞপ্তি বন্ধ করুন",
    prohibitionDetails: "নিষেধাজ্ঞার বিবরণ দেখুন"
  },
  mr: {
    badge: "प्रतिबंधित कीटकनाशके",
    badgeShort: "प्रतिबंधित",
    statusBanned: "कायदेशीररित्या प्रतिबंधित",
    gazetteHeader: "वैधानिक प्राधिकरण आणि राजपत्र अधिसूचना",
    hazardHeader: "WHO / CIB&RC धोका वर्गीकरण",
    alternativeHeader: "सुरक्षित ICAR प्रमाणित जैविक पर्याय",
    statutoryWarning: "⚠️ भारतीय कृषी कायद्यांतर्गत या रसायनाची फवारणी किंवा विक्री बेकायदेशीर आहे. AgriNexus सुरक्षा प्रणाली या रसायनास पूर्णपणे रोखते.",
    closeNotice: "सूचना बंद करा",
    prohibitionDetails: "प्रतिबंधात्मक तपशील पहा"
  },
  gu: {
    badge: "પ્રતિબંધિત જંતુનાશકો",
    badgeShort: "પ્રતિબંધિત",
    statusBanned: "કાયદેસર રીતે પ્રતિબંધિત",
    gazetteHeader: "વૈધાનિક સત્તામંડળ અને ગેઝેટ સૂચના",
    hazardHeader: "WHO / CIB&RC જોખમ વર્ગીકરણ",
    alternativeHeader: "સુરક્ષિત ICAR પ્રમાણિત જૈવિક વિકલ્પ",
    statutoryWarning: "⚠️ ભારતીય કૃષિ કાયદા હેઠળ આ રસાયણનો ઉપયોગ કે વેચાણ ગેરકાયદેસર છે. AgriNexus સુરક્ષા કોર આ રસાયણને આપમેળે બ્લોક કરે છે.",
    closeNotice: "સૂચના બંધ કરો",
    prohibitionDetails: "પ્રતિબંધ વિગતો જુઓ"
  },
  od: {
    badge: "ନିଷିଦ୍ଧ କୀଟନାଶକ ତାଲିକା",
    badgeShort: "ନିଷିଦ୍ଧ",
    statusBanned: "ଆଇନଗତ ଭାବେ ନିଷିଦ୍ଧ",
    gazetteHeader: "ବିଧିବଦ୍ଧ ପ୍ରାଧିକରଣ ଏବଂ ଗେଜେଟ୍ ବିଜ୍ଞପ୍ତି",
    hazardHeader: "WHO / CIB&RC ବିପଦ ବର୍ଗୀକରଣ",
    alternativeHeader: "ନିରାପଦ ICAR ପ୍ରମାଣିତ ଜୈବିକ ବିକଳ୍ପ",
    statutoryWarning: "⚠️ ଭାରତୀୟ କୃଷି ଆଇନ ଅନୁଯାୟୀ ଏହି ରାସାୟନିକ ବ୍ୟବହାର କିମ୍ବା ବିକ୍ରୟ ବେଆଇନ। AgriNexus ସୁରକ୍ଷା କୋର୍ ଏହାକୁ ସ୍ୱୟଂଚାଳିତ ଭାବେ ଅବରୋଧ କରେ।",
    closeNotice: "ସୂଚନା ବନ୍ଦ କରନ୍ତୁ",
    prohibitionDetails: "ନିଷେଧ ବିବରଣୀ ଦେଖନ୍ତୁ"
  },
  en: {
    badge: "CIB&RC BANNED PESTICIDES",
    badgeShort: "BANNED",
    statusBanned: "STATUTORY BANNED",
    gazetteHeader: "Statutory Authority & Gazette Notification",
    hazardHeader: "WHO / CIB&RC Hazard Classification",
    alternativeHeader: "Safe ICAR Certified Bio-Alternative",
    statutoryWarning: "⚠️ Field spraying or sale of this substance is an offence under Indian agricultural law (Insecticides Act, 1968). AgriNexus C++ Safety Core automatically blocks any treatment containing this chemical.",
    closeNotice: "Close Notice",
    prohibitionDetails: "Click to view statutory prohibition details"
  }
};

export default function BannedPesticidesTicker({ selectedLang = "hi" }) {
  const [pesticides, setPesticides] = useState(bannedPesticidesLocal);
  const [selectedPesticide, setSelectedPesticide] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchBannedPesticides()
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setPesticides(data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const t = TICKER_TRANSLATIONS[selectedLang] || TICKER_TRANSLATIONS.en;

  const getLocalizedChemicalName = (item) => {
    if (item.names && item.names[selectedLang]) {
      return item.names[selectedLang];
    }
    if (selectedLang === "hi" && item.hi_name) {
      return item.hi_name;
    }
    return item.display_name || item.chemical_name;
  };

  // Duplicate items array once to achieve infinite seamless loop with translate-x: -50%
  const tickerItems = [...pesticides, ...pesticides];

  return (
    <>
      {/* Statutory Alert Marquee Container */}
      <div 
        className="shrink-0 relative w-full h-8 sm:h-9 bg-gradient-to-r from-[#1c0407] via-[#0f0204] to-[#1c0407] border-b border-rose-900/50 flex items-center overflow-hidden z-40 select-none shadow-inner"
        role="region"
        aria-label="Statutory Banned Pesticides Marquee"
      >
        {/* Pinned Left Statutory Badge */}
        <div className="shrink-0 z-10 flex items-center gap-1.5 h-full px-2 sm:px-3 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-r border-rose-700/60 shadow-lg text-[10px] sm:text-[11px] font-black text-rose-100 tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-300 stroke-[2.5]" />
          <span className="hidden xs:inline uppercase">
            {t.badge}
          </span>
          <span className="xs:hidden uppercase">
            {t.badgeShort}
          </span>
        </div>

        {/* Scrolling News Ticker Track */}
        <div className="flex-1 overflow-hidden relative flex items-center h-full">
          <div className="animate-ticker-marquee flex items-center gap-6 sm:gap-8 cursor-pointer py-1">
            {tickerItems.map((item, idx) => {
              const localizedName = getLocalizedChemicalName(item);
              const showLatinSubtext = selectedLang !== "en" && item.display_name && item.display_name !== localizedName;
              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => setSelectedPesticide(item)}
                  className="group inline-flex items-center gap-2 text-rose-200/90 hover:text-white transition-colors duration-150 text-[11px] sm:text-xs font-semibold whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-rose-500 rounded px-1"
                  title={t.prohibitionDetails}
                >
                  <span className="px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-700/60 text-rose-300 font-bold text-[9px] sm:text-[10px] tracking-wide group-hover:border-rose-400 group-hover:bg-rose-900 transition flex items-center gap-1">
                    <span>{localizedName}</span>
                    {showLatinSubtext && (
                      <span className="text-[9px] text-rose-400/80 font-normal hidden md:inline">
                        ({item.display_name})
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-rose-300/80 group-hover:text-rose-100">
                    {item.hazard_class ? item.hazard_class.split("(")[0].trim() : "BANNED"}
                  </span>
                  <span className="text-rose-600/60 font-black text-xs select-none">✦</span>
                </button>
              );
            })}
          </div>

          {/* Right Gradient Vignette for Smooth Fade */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#1c0407] to-transparent z-10" />
        </div>
      </div>

      {/* Statutory Detail Modal */}
      {selectedPesticide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedPesticide(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-[#0a0507] border border-rose-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl text-left text-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-52 h-52 bg-rose-600/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-52 h-52 bg-rose-900/15 rounded-full blur-3xl" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-rose-900/50 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950 border border-rose-700/80 text-rose-400 shadow-md">
                  <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-rose-100 tracking-tight">
                      {getLocalizedChemicalName(selectedPesticide)}
                    </h3>
                    {selectedLang !== "en" && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-800 text-rose-300 font-semibold">
                        {selectedPesticide.display_name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                    {t.statusBanned}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPesticide(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-3.5 text-xs sm:text-sm">
              {/* Gazette / Act Notice */}
              <div className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-3">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.gazetteHeader}</span>
                </div>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {selectedPesticide.gazette_ref} under the <strong className="text-rose-200">Insecticides Act, 1968</strong> (CIB&RC, Govt. of India).
                </p>
              </div>

              {/* Hazard Classification */}
              <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.hazardHeader}</span>
                </div>
                <p className="text-slate-200 font-semibold">
                  {selectedPesticide.hazard_class}
                </p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {selectedPesticide.reason}
                </p>
              </div>

              {/* Safe ICAR Certified Alternative */}
              <div className="rounded-xl bg-emerald-950/30 border border-emerald-700/40 p-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.alternativeHeader}</span>
                </div>
                <p className="text-emerald-200 font-bold">
                  {selectedPesticide.safe_alternative}
                </p>
              </div>

              {/* Statutory Warning Box */}
              <div className="text-[11px] text-rose-300/90 bg-rose-950/20 border border-rose-900/30 rounded-lg p-2.5 text-center font-medium leading-relaxed">
                {t.statutoryWarning}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
              <button
                onClick={() => setSelectedPesticide(null)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/50 transition active:scale-95"
              >
                {t.closeNotice}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
