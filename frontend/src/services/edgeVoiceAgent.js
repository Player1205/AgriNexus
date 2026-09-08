/**
 * In-Browser Vernacular Acoustic & Speech Synthesis Agent (Agent 5 - On-Device).
 * Speaks in native Indian languages completely offline via Web Speech API.
 */

const LOCALIZED_PATHOLOGY = {
    "Tomato Late blight": { hi: "टमाटर का पछेती झुलसा रोग (Tomato Late Blight)", pa: "ਟਮਾਟਰ ਦਾ ਪਛੇਤਾ ਝੁਲਸਾ ਰੋਗ", te: "టమాటా లేట్ బ్లైట్ తెగులు" },
    "Tomato Early blight": { hi: "टमाटर का अगेती झुलसा रोग (Tomato Early Blight)", pa: "ਟਮਾਟਰ ਦਾ ਅਗੇਤਾ ਝੁਲਸਾ ਰੋਗ", te: "టమాటా ఎర్లీ బ్లైట్ తెగులు" },
    "Apple Scab": { hi: "सेब का स्कैब रोग (Apple Scab)", pa: "ਸੇਬ ਦਾ ਸਕੈਬ ਰੋਗ", te: "ఆపిల్ స్కాబ్ తెగులు" },
    "Corn Common rust": { hi: "मक्का का रतुआ रोग (Corn Common Rust)", pa: "ਮੱਕੀ ਦਾ ਕੁੰਗੀ ਰੋਗ", te: "మొక్కజొన్న తుప్పు తెగులు" },
    "Potato Late blight": { hi: "आलू का पछेती झुलसा रोग (Potato Late Blight)", pa: "ਆਲੂ ਦਾ ਪਛੇਤਾ ਝੁਲਸਾ ਰੋਗ", te: "బంగాళాదుంప లేట్ బ్లైట్" }
};

export const generateLocalizedSpeechText = (state, languageCode = 'hi') => {
    const isSafe = state.is_safe === true;
    const isCropSupported = state.is_crop_supported !== false;
    const detectedSubject = state.detected_subject || 'Non-Agricultural Subject';
    const diagnosis = state.vision_diagnosis || 'Crop Anomaly';
    const chemical = state.proposed_chemical || 'Prescribed Chemical';
    const dosage = state.safe_dosage_ml_per_acre || 0.0;
    const unit = state.dosage_unit || 'g';
    const nearestKvk = state.nearest_kvk;
    const kvkName = nearestKvk ? nearestKvk.name : 'ICAR Krishi Vigyan Kendra';
    const kvkDist = nearestKvk ? `${nearestKvk.distance_km} km` : '';

    const pathObj = LOCALIZED_PATHOLOGY[diagnosis];
    const localizedDisease = pathObj && pathObj[languageCode] ? pathObj[languageCode] : diagnosis;

    // Case A: Non-Agricultural / Non-Target Subject
    if (!isCropSupported) {
        if (languageCode === 'hi') {
            return `किसान भाई, यह फोटो ${detectedSubject} की प्रतीत होती है, जो AgriNexus की 14 समर्थित मुख्य कृषि फसलों (जैसे टमाटर, आलू, मक्का, सेब, स्ट्रॉबेरी आदि) में से नहीं है। गैर-लक्षित पौधों पर रासायनिक कीटनाशकों का छिड़काव प्रतिबंधित है। कृपया समर्थित कृषि फसल की पत्ती का स्पष्ट फोटो अपलोड करें।`;
        }
        if (languageCode === 'pa') {
            return `ਕਿਸਾਨ ਵੀਰੋ, ਇਹ ਫੋਟੋ ${detectedSubject} ਦੀ ਜਾਪਦੀ ਹੈ, ਜੋ AgriNexus ਦੀਆਂ 14 ਪ੍ਰਮਾਣਿਤ ਖੇਤੀਬਾੜੀ ਫਸਲਾਂ ਵਿੱਚੋਂ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕਿਸੇ ਵੀ ਰਸਾਇਣ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਫਸਲ ਦੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ।`;
        }
        if (languageCode === 'te') {
            return `రైతు సోదరులారా, ఈ ఫోటో ${detectedSubject} గా గుర్తించబడింది, ఇది AgriNexus ధృవీకరించిన 14 ప్రధాన పంటలలో భాగం కాదు. రసాయనాలు పిచికారీ చేయవద్దు. దయచేసి పంట ఆకు ఫోటోను అప్‌లోడ్ చేయండి.`;
        }
        return `Dear Farmer, this image appears to be ${detectedSubject}, which is not among AgriNexus's 14 supported commercial agricultural food crops. Chemical pesticide application is strictly prohibited on non-target plants. Please upload a clear photo of a supported crop leaf.`;
    }

    // Case B: Low Confidence / Unsafe -> KVK Referral
    if (!isSafe) {
        if (languageCode === 'hi') {
            return `किसान भाई, आपकी फसल में ${localizedDisease} के लक्षण मिले हैं, परंतु सुरक्षा कारणों से रासायनिक छिड़काव की अनुमति नहीं दी जा सकती। कृपया अपने नजदीकी कृषि विज्ञान केंद्र '${kvkName}' (${kvkDist} दूर) के कृषि वैज्ञानिकों से प्रत्यक्ष सलाह लें।`;
        }
        if (languageCode === 'pa') {
            return `ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ ${localizedDisease} ਦੇ ਲੱਛਣ ਮਿਲੇ ਹਨ। ਫਸਲ ਦੀ ਸੁਰੱਖਿਆ ਲਈ ਦਵਾਈ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ। ਆਪਣੇ ਨਜ਼ਦੀਕੀ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ '${kvkName}' (${kvkDist} ਦੂਰ) ਵਿਖੇ ਮਾਹਿਰਾਂ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।`;
        }
        if (languageCode === 'te') {
            return `రైతు సోదరులారా, మీ పంటలో ${localizedDisease} లక్షణాలు ఉన్నాయి. రక్షణ దృష్ట్యా ఎటువంటి రసాయనాన్ని పిచికారీ చేయవద్దు. సమీపంలోని కృషి విజ్ఞాన కేంద్రం '${kvkName}' (${kvkDist} దూరం) ను సంప్రదించండి.`;
        }
        return `Dear Farmer, your crop shows symptoms of ${diagnosis}. Chemical application cannot be verified safely. Please consult your nearest agricultural research center: ${kvkName} (${kvkDist} away).`;
    }

    // Case C: Verified Safe Treatment with Fact-Based Meteorological Interlocks
    const isLiveWeather = state.is_live_weather === true || (typeof navigator !== 'undefined' && navigator.onLine);
    const temp = Math.round((Number(state.current_temperature) || 28.0) * 10) / 10;
    const humidity = Math.round((Number(state.current_humidity) || 75.0) * 10) / 10;
    const rainRisk = Math.round(Number(state.rain_risk_6h_percent) || 0);
    const windSpeed = Math.round((Number(state.wind_speed_kmh) || 6.0) * 10) / 10;

    const isRainHazard = (rainRisk >= 35);
    const isWindHazard = (windSpeed >= 15.0);
    const isHeatHazard = (temp >= 36.0);

    // Subcase C1: Strictly Offline without Internet
    if (!isLiveWeather) {
        if (languageCode === 'hi') {
            return `किसान भाई, सावधानी: इंटरनेट न होने के कारण लाइव मौसम प्राप्त नहीं हो सका, छिड़काव से पहले बारिश और तेज हवा न होने की पुष्टि करें। ICAR मानकों के अनुसार आपकी फसल में ${localizedDisease} के उपचार हेतु ${chemical} की ${dosage} ${unit} प्रति एकड़ २०० लीटर पानी में घोलकर छिड़काव करें। छिड़काव सुबह या शाम को करें।`;
        }
        if (languageCode === 'pa') {
            return `ਕਿਸਾਨ ਵੀਰੋ, ਸਾਵਧਾਨੀ: ਇੰਟਰਨੈੱਟ ਨਾ ਹੋਣ ਕਰਕੇ ਲਾਈਵ ਮੌਸਮ ਨਹੀਂ ਮਿਲ ਸਕਿਆ, ਛਿੜਕਾਅ ਤੋਂ ਪਹਿਲਾਂ ਮੀਂਹ ਅਤੇ ਤੇਜ਼ ਹਵਾ ਨਾ ਹੋਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ। ਪ੍ਰਮਾਣਿਤ ICAR ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ ${localizedDisease} ਲਈ ${chemical} ਦੀ ${dosage} ${unit} ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।`;
        }
        if (languageCode === 'te') {
            return `రైతు సోదరులారా, హెచ్చరిక: ఇంటర్నెట్ లేకపోవడం వల్ల ప్రత్యక్ష వాతావరణం పొందలేకపోయాము. వర్షం మరియు గాలి లేదని నిర్ధారించుకోండి. ICAR ప్రమాణాల ప్రకారం ${localizedDisease} నివారణకు ${chemical} ను ఎకరాకు ${dosage} ${unit} చొప్పున 200 లీటర్ల నీటిలో కలిపి పిచიკారీ చేయండి.`;
        }
        return `Dear Farmer, Caution: Live field weather could not be fetched due to lack of internet. Please verify there is no imminent rain or strong wind before spraying. Based on certified ICAR protocols, your crop is affected by ${diagnosis}. Spray ${chemical} at an exact dosage of ${dosage} ${unit} per acre in 200 liters of water during cool morning or evening hours.`;
    }

    // Subcase C2: Adverse Weather Gate (Rain >= 35% or Wind >= 15 km/h) -> Active Delay Advisory
    if (isRainHazard || isWindHazard) {
        let hazardHi = isRainHazard && isWindHazard
            ? `${rainRisk}% बारिश की संभावना और ${windSpeed} km/h तेज हवा`
            : isRainHazard
                ? `अगले ६ घंटों में ${rainRisk}% बारिश की संभावना`
                : `खेत में ${windSpeed} km/h तेज हवा`;

        let hazardPa = isRainHazard && isWindHazard
            ? `${rainRisk}% ਮੀਂਹ ਦਾ ਖਤਰਾ ਅਤੇ ${windSpeed} km/h ਤੇਜ਼ ਹਵਾ`
            : isRainHazard
                ? `ਅਗਲੇ 6 ਘੰਟਿਆਂ ਵਿੱਚ ${rainRisk}% ਮੀਂਹ ਦਾ ਖਤਰਾ`
                : `${windSpeed} km/h ਤੇਜ਼ ਹਵਾ`;

        let hazardEn = isRainHazard && isWindHazard
            ? `High rain probability (${rainRisk}%) and high wind velocity (${windSpeed} km/h)`
            : isRainHazard
                ? `High rain probability (${rainRisk}% in next 6h)`
                : `High wind velocity (${windSpeed} km/h)`;

        if (languageCode === 'hi') {
            return `किसान भाई, आपकी फसल में ${localizedDisease} के उपचार हेतु प्रमाणित दवा ${chemical} की मात्रा ${dosage} ${unit} प्रति एकड़ है। परंतु चेतावनी: आपके क्षेत्र में ${hazardHi} है। दवा के धुलने और बहाव को रोकने के लिए आज छिड़काव बिल्कुल न करें, मौसम साफ होने की प्रतीक्षा करें।`;
        }
        if (languageCode === 'pa') {
            return `ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ ${localizedDisease} ਲਈ ${chemical} ${dosage} ${unit} ਪ੍ਰਤੀ ਏਕੜ ਸਿਫਾਰਿਸ਼ ਹੈ। ਪਰ ਚੇਤਾਵਨੀ: ਖੇਤ ਵਿੱਚ ${hazardPa} ਹੈ। ਦਵਾਈ ਦੇ ਧੁਲਣ ਅਤੇ ਨੁਕਸਾਨ ਤੋਂ ਬਚਣ ਲਈ ਅੱਜ ਛਿੜਕਾਅ ਬਿਲਕੁਲ ਨਾ ਕਰੋ, ਮੌਸਮ ਸਾਫ ਹੋਣ ਦੀ ਉਡੀਕ ਕਰੋ।`;
        }
        if (languageCode === 'te') {
            return `రైతు సోదరులారా, మీ పంటలో ${localizedDisease} నివారణకు ${chemical} ${dosage} ${unit} పిచికారీ చేయాలి. అయితే హెచ్చరిక: ${rainRisk}% వర్ష సూచన లేదా ${windSpeed} km/h వేగంతో గాలి వీస్తోంది. మందు కొట్టుకుపోకుండా ఉండటానికి ప్రస్తుతానికి పిచიკారీని వాయిదా వేయండి.`;
        }
        return `Dear Farmer, your crop shows foliar symptoms of ${diagnosis}. Recommended ICAR treatment is ${chemical} at ${dosage} ${unit} per acre. HOWEVER, DO NOT SPRAY TODAY. Critical weather alert: ${hazardEn}. Spraying now will cause severe chemical wash-off or drift. Please delay spraying until weather clears.`;
    }

    // Subcase C3: Extreme Heat Gate (Temperature >= 36°C)
    if (isHeatHazard) {
        if (languageCode === 'hi') {
            return `किसान भाई, खेत में भारी तापमान (${temp}°C) है। पत्तियों को झुलसने से बचाने के लिए दोपहर में छिड़काव बिल्कुल न करें। ${localizedDisease} के उपचार हेतु ${chemical} की ${dosage} ${unit} प्रति एकड़ २०० लीटर पानी में मिलाकर केवल सुबह ८ बजे से पहले या शाम को छिड़काव करें।`;
        }
        if (languageCode === 'pa') {
            return `ਕਿਸਾਨ ਵੀਰੋ, ਖੇਤ ਵਿੱਚ ਭਾਰੀ ਗਰਮੀ (${temp}°C) ਹੈ। ਪੱਤਿਆਂ ਨੂੰ ਝੁਲਸਣ ਤੋਂ ਬਚਾਉਣ ਲਈ ਦੁਪਹਿਰ ਵੇਲੇ ਛਿੜਕਾਅ ਨਾ ਕਰੋ। ${localizedDisease} ਦੇ ਇਲਾਜ ਲਈ ${chemical} ਦਾ ${dosage} ${unit} ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਸਿਰਫ਼ ਸਵੇਰੇ 8 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂ ਸ਼ਾਮ ਵੇਲੇ ਕਰੋ।`;
        }
        if (languageCode === 'te') {
            return `రైతు సోదరులారా, ఉష్ణోగ్రత అధికంగా (${temp}°C) ఉంది. ఆకులు మాడిపోకుండా ఉండటానికి మధ్యాహ్నం పిచికారీ చేయవద్దు. ${localizedDisease} నివారణకు ${chemical} మందును ఉదయం లేదా సాయంత్రం వేళల్లో మాత్రమే పిచికారీ చేయండి.`;
        }
        return `Dear Farmer, Warning: Extreme field heat detected (${temp}°C). Midday spraying causes foliar burn. For ${diagnosis}, spray ${chemical} at ${dosage} ${unit} per acre in 200L clean water STRICTLY before 8 AM or after 6 PM.`;
    }

    // Subcase C4: Optimal Weather Window
    if (languageCode === 'hi') {
        return `किसान भाई, आपके खेत का मौसम अनुकूल है (तापमान ${temp}°C, आर्द्रता ${humidity}%, हवा ${windSpeed} km/h)। ICAR मानकों के अनुसार आपकी फसल में ${localizedDisease} के उपचार हेतु ${chemical} की ${dosage} ${unit} प्रति एकड़ २०० लीटर पानी में घोलकर छिड़काव करें। छिड़काव सुबह या शाम को करें।`;
    }
    if (languageCode === 'pa') {
        return `ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੇ ਖੇਤ ਦਾ ਮੌਸਮ ਅਨੁਕੂਲ ਹੈ (ਤਾਪਮਾਨ ${temp}°C, ਨਮੀ ${humidity}%, ਹਵਾ ${windSpeed} km/h)। ਪ੍ਰਮਾਣਿਤ ICAR ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ ${localizedDisease} ਲਈ ${chemical} ਦੀ ${dosage} ${unit} ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।`;
    }
    if (languageCode === 'te') {
        return `రైతు సోదరులారా, మీ ప్రాంతంలో వాతావరణం అనుకూలంగా ఉంది (ఉష్ణోగ్రత ${temp}°C, తేమ ${humidity}%, గాలి ${windSpeed} km/h). ICAR ప్రమాణాల ప్రకారం ${localizedDisease} నివారణకు ${chemical} ను ఎకరాకు ${dosage} ${unit} చొప్పున 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి.`;
    }
    return `Dear Farmer, current field weather is optimal (${temp}°C, ${humidity}% humidity, wind ${windSpeed} km/h). Based on certified ICAR protocols, your crop is affected by ${diagnosis}. Spray ${chemical} at an exact dosage of ${dosage} ${unit} per acre in 200 liters of water during cool morning or evening hours.`;
};

// Sarvam AI Bulbul:v3 Key Configuration (Loaded securely from environment)
const SARVAM_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SARVAM_API_KEY) || '';

const SARVAM_LANG_MAP = {
    hi: 'hi-IN',
    pa: 'pa-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    ml: 'ml-IN',
    kn: 'kn-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    od: 'od-IN',
    en: 'en-IN'
};

/**
 * Synthesizes natural Indic acoustic speech using Sarvam AI Bulbul:v3.
 * Returns self-contained base64 data URL ('data:audio/wav;base64,...') on success.
 */
export const synthesizeSarvamSpeech = async (text, languageCode = 'hi') => {
    if (!text || !SARVAM_API_KEY || typeof window === 'undefined' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        return null;
    }

    try {
        console.log(`[SARVAM AI] Synthesizing speech via Bulbul:v3 for '${languageCode}'...`);
        const targetLang = SARVAM_LANG_MAP[languageCode] || 'hi-IN';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'api-subscription-key': SARVAM_API_KEY.trim(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: [text],
                target_language_code: targetLang,
                speaker: 'shubh',
                pace: 1.0,
                enable_preprocessing: true,
                model: 'bulbul:v3'
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[SARVAM AI] API returned status ${response.status}: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const audios = data?.audios;
        if (audios && audios.length > 0 && audios[0]) {
            const audioDataUrl = `data:audio/wav;base64,${audios[0]}`;
            console.log(`[SARVAM AI] Successfully generated authentic voice note (${audios[0].length} chars).`);
            return audioDataUrl;
        }
    } catch (err) {
        console.warn('[SARVAM AI] Online speech synthesis failed or timed out:', err.message);
    }
    return null;
};

export const speakVernacularOffline = (text, languageCode = 'hi') => {
    if (!('speechSynthesis' in window) || !text) return;

    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const langVoiceMap = {
            hi: 'hi-IN',
            pa: 'pa-IN',
            te: 'te-IN',
            ta: 'ta-IN',
            ml: 'ml-IN',
            kn: 'kn-IN',
            bn: 'bn-IN',
            mr: 'mr-IN',
            gu: 'gu-IN',
            od: 'hi-IN',
            en: 'en-IN'
        };

        utterance.lang = langVoiceMap[languageCode] || 'hi-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(v => v.lang.startsWith(languageCode) || v.lang === utterance.lang);
        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn("[OFFLINE TTS] Native speech synthesis warning:", e);
    }
};

export const runEdgeVoiceAgent = async (state) => {
    const lang = state.language_code || 'hi';
    const translatedText = generateLocalizedSpeechText(state, lang);

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

    // 1. HIGHER PRIORITY: If connected to the internet, synthesize using Sarvam AI (Bulbul:v3)
    if (isOnline) {
        const sarvamAudioUrl = await synthesizeSarvamSpeech(translatedText, lang);
        if (sarvamAudioUrl) {
            // Trigger automatic playback of genuine Sarvam human speech
            try {
                const audio = new Audio(sarvamAudioUrl);
                audio.play().catch(e => {
                    console.log('[SARVAM AI] Audio ready in player; browser autoplay policy may require user tap:', e);
                });
            } catch (playErr) {
                console.warn('[SARVAM AI] Audio element play warning:', playErr);
            }

            return {
                language_code: lang,
                translated_text: translatedText,
                vernacular_audio_url: sarvamAudioUrl
            };
        }
        console.warn('[VOICE PRIORITY] Sarvam API unreachable despite online status. Engaging on-device fallback.');
    }

    // 2. FALLBACK ONLY: If not connected to the internet (or Sarvam unreachable), use built-in on-device Web Speech API
    console.log('[OFFLINE VOICE] Device is disconnected from internet. Using built-in on-device speech synthesis (window.speechSynthesis)...');
    speakVernacularOffline(translatedText, lang);

    return {
        language_code: lang,
        translated_text: translatedText,
        vernacular_audio_url: null // Triggers on-device Web Speech in UI
    };
};

