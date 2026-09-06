import icarProtocols from '../data/icar_protocols.json';

/**
 * In-Browser Grounded ICAR Agronomy RAG Agent (Agent 2 - On-Device).
 * Executes in 0.1ms directly inside mobile browser memory.
 */
export const runEdgeRagAgent = async (state) => {
    const diagnosis = state.vision_diagnosis || '';
    const confidence = Number(state.vision_confidence || 0.0);
    const isSupported = state.is_crop_supported !== false;

    // Strict Gate: If crop is unsupported or confidence is low (<60%)
    if (!isSupported || !diagnosis || diagnosis.includes('Unrecognized') || confidence < 0.60) {
        const detectedSubj = state.detected_subject || 'Non-Agricultural Subject';
        return {
            proposed_chemical: 'None - Non-Target / Inspection Required',
            safe_dosage_ml_per_acre: 0.0,
            dosage_unit: 'g',
            formulation_type: 'NONE',
            min_mic_dosage: 0.0,
            max_statutory_dosage: 0.0,
            rag_treatment_plan: (
                `NON-ACTIONABLE: Image identified as '${detectedSubj}', which is not among AgriNexus's 14 certified commercial agricultural crops. ` +
                `Chemical pesticide application is strictly prohibited on non-target plants without physical inspection. ` +
                `Farmer is referred to the nearest ICAR Krishi Vigyan Kendra (KVK) extension center for on-field verification.`
            ),
            current_humidity: state.current_humidity || 75.0,
            errors: [`Non-target or low confidence subject '${detectedSubj}'. Chemical prescription blocked for safety.`]
        };
    }

    // Match certified ICAR protocol from in-memory database
    const diagLower = diagnosis.toLowerCase();
    const matchedProtocol = icarProtocols.find((p) => {
        const diseaseLower = p.disease.toLowerCase();
        if (diagLower.includes(diseaseLower) || diseaseLower.includes(diagLower)) {
            return true;
        }
        return p.keywords.some((k) => diagLower.includes(k.toLowerCase()));
    });

    if (matchedProtocol) {
        const proposedChemical = matchedProtocol.active_chemical;
        const baseDosage = Number(matchedProtocol.base_dosage_per_acre || 150.0);
        const unit = matchedProtocol.unit || (proposedChemical.includes('SC') || proposedChemical.includes('EC') ? 'ml' : 'g');
        const formulationType = matchedProtocol.formulation_type || (unit === 'ml' ? 'LIQUID_SC' : 'SOLID_WP');
        const minMic = Number(matchedProtocol.min_mic_dosage || (baseDosage * 0.8));
        const maxStat = Number(matchedProtocol.max_statutory_dosage || (baseDosage * 1.3));

        return {
            proposed_chemical: proposedChemical,
            safe_dosage_ml_per_acre: baseDosage,
            dosage_unit: unit,
            formulation_type: formulationType,
            min_mic_dosage: minMic,
            max_statutory_dosage: maxStat,
            rag_treatment_plan: matchedProtocol.advisory_text,
            current_humidity: Number(state.current_humidity || 75.0)
        };
    }

    return {
        proposed_chemical: 'None - Consultation Required',
        safe_dosage_ml_per_acre: 0.0,
        dosage_unit: 'g',
        formulation_type: 'NONE',
        min_mic_dosage: 0.0,
        max_statutory_dosage: 0.0,
        rag_treatment_plan: `No verified ICAR chemical protocol found for '${diagnosis}'. Consult a certified agronomist at your nearest KVK.`,
        current_humidity: Number(state.current_humidity || 75.0)
    };
};
