import { InferenceSession, Tensor, env } from 'onnxruntime-web';

// Configure ONNX Runtime to use CDN WASM files to prevent local SPA routing from returning index.html (404)
env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
// Disable multithreading to prevent SharedArrayBuffer crashes without COOP/COEP headers
env.wasm.numThreads = 1;

export const CERTIFIED_CROPS = [
    "Tomato", "Potato", "Corn", "Apple", "Grape", "Strawberry",
    "Pepper", "Orange", "Soybean", "Peach", "Cherry", "Squash",
    "Raspberry", "Blueberry"
];

const EFFICIENTNET_CLASSES = [
    "Apple Apple scab",
    "Apple Black rot",
    "Apple Cedar apple rust",
    "Apple healthy",
    "Blueberry healthy",
    "Cherry Powdery mildew",
    "Cherry healthy",
    "Corn Cercospora leaf spot",
    "Corn Common rust",
    "Corn Northern Leaf Blight",
    "Corn healthy",
    "Grape Black rot",
    "Grape Esca",
    "Grape Leaf blight",
    "Grape healthy",
    "Orange Haunglongbing",
    "Peach Bacterial spot",
    "Peach healthy",
    "Pepper Bacterial spot",
    "Pepper healthy",
    "Potato Early blight",
    "Potato Late blight",
    "Potato healthy",
    "Raspberry healthy",
    "Soybean healthy",
    "Squash Powdery mildew",
    "Strawberry Leaf scorch",
    "Strawberry healthy",
    "Tomato Bacterial spot",
    "Tomato Early blight",
    "Tomato Late blight",
    "Tomato Leaf Mold",
    "Tomato Septoria leaf spot",
    "Tomato Spider mites",
    "Tomato Target Spot",
    "Tomato Yellow Leaf Curl Virus",
    "Tomato mosaic virus",
    "Tomato healthy"
];

let cachedSession = null;

const initSession = async () => {
    if (!cachedSession) {
        // Loads your REAL 71MB ONNX model from the frontend public folder
        cachedSession = await InferenceSession.create('/models/agrinexus_vision.onnx', {
            executionProviders: ['wasm']
        });
    }
    return cachedSession;
};

const checkOrganicChlorophyllContent = (imgData) => {
    let organicPixels = 0;
    let totalSampled = 0;

    // Sample every 4th pixel (step by 16 in RGBA array) for sub-1ms speed
    for (let i = 0; i < imgData.length; i += 16) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        totalSampled++;

        // 1. Dominant green foliar chlorophyll
        const isGreen = (g > r * 1.02 && g > b * 1.02 && g > 30);
        // 2. Agricultural foliar necrosis / lesion / chlorosis tones (yellow/brown/rust/tan)
        const isFoliarNecrotic = (r > 45 && g > 30 && b < 130 && (r + g) > (b * 1.6));

        if (isGreen || isFoliarNecrotic) {
            organicPixels++;
        }
    }

    return totalSampled > 0 ? (organicPixels / totalSampled) : 0;
};

const preprocessImage = (imageElement) => {
    const canvas = document.createElement('canvas');
    const width = 380;
    const height = 380;
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height).data;

    const organicRatio = checkOrganicChlorophyllContent(imgData);

    const float32Data = new Float32Array(3 * width * height);
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    // CHW Format for EfficientNet
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = imgData[i] / 255.0;
            const g = imgData[i + 1] / 255.0;
            const b = imgData[i + 2] / 255.0;

            float32Data[y * width + x] = (r - mean[0]) / std[0]; // R
            float32Data[width * height + y * width + x] = (g - mean[1]) / std[1]; // G
            float32Data[2 * width * height + y * width + x] = (b - mean[2]) / std[2]; // B
        }
    }

    return {
        tensor: new Tensor('float32', float32Data, [1, 3, height, width]),
        organicRatio
    };
};

function softmax(arr) {
    const max = Math.max(...arr);
    const exps = arr.map(x => Math.exp(x - max));
    const sumExps = exps.reduce((acc, val) => acc + val, 0);
    return exps.map(x => x / sumExps);
}

export const runEdgeVisionAgent = async (file) => {
    return new Promise(async (resolve) => {
        try {
            console.log("[EDGE AI] Booting Real EfficientNet ONNX Engine...");
            const session = await initSession();

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        const { tensor: inputTensor, organicRatio } = preprocessImage(img);
                        console.log(`[EDGE AI] Foliar Organic Ratio: ${(organicRatio * 100).toFixed(1)}%`);

                        // Gate 1: Non-agricultural image check (Document / Screenshot / White screen bouncer)
                        if (organicRatio < 0.04) {
                            console.warn(`[EDGE AI] Non-agricultural image detected: only ${(organicRatio*100).toFixed(1)}% organic foliar pigment (minimum 4% required).`);
                            resolve({
                                vision_diagnosis: "Non-Agricultural Image (Low Foliar Pigment)",
                                vision_confidence: 0.0,
                                is_crop_supported: false,
                                detected_subject: "Text Document / Screen / Non-Plant"
                            });
                            return;
                        }

                        const inputName = session.inputNames[0];
                        const outputMap = await session.run({ [inputName]: inputTensor });
                        const outputData = outputMap[session.outputNames[0]].data;

                        const probabilities = softmax(Array.from(outputData));
                        
                        const sortedProbs = probabilities
                            .map((prob, idx) => ({ prob, idx }))
                            .sort((a, b) => b.prob - a.prob);

                        const top1 = sortedProbs[0];
                        const top2 = sortedProbs[1];
                        const margin = top1.prob - (top2 ? top2.prob : 0);

                        console.log(`[EDGE AI] Top-1: ${EFFICIENTNET_CLASSES[top1.idx]} (${(top1.prob * 100).toFixed(1)}%), Margin: ${(margin * 100).toFixed(1)}%`);

                        // Gate 2: Edge AI Validation (Confidence & Margin Floor)
                        // Across 38 classes (random chance = 2.63%), top-1 confidence >= 55% with margin >= 12%
                        // represents statistically sound crop disease identification on edge mobile devices.
                        if (top1.prob < 0.55 || margin < 0.12) {
                            console.warn(`[EDGE AI] Low Confidence (${(top1.prob * 100).toFixed(1)}%) or Low Margin (${(margin * 100).toFixed(1)}%). Rejecting as Unsupported.`);
                            resolve({
                                vision_diagnosis: "Unrecognized / Unsupported Plant",
                                vision_confidence: top1.prob,
                                is_crop_supported: false,
                                detected_subject: "Unsupported Plant / Non-Crop"
                            });
                            return;
                        }

                        const diseaseName = EFFICIENTNET_CLASSES[top1.idx];
                        const detectedCrop = diseaseName.split(" ")[0];

                        console.log(`[EDGE AI] REAL Prediction: ${diseaseName} at ${(top1.prob * 100).toFixed(2)}%`);

                        resolve({
                            vision_diagnosis: diseaseName,
                            vision_confidence: top1.prob,
                            is_crop_supported: CERTIFIED_CROPS.includes(detectedCrop),
                            detected_subject: `${detectedCrop} Leaf`
                        });

                    } catch (err) {
                        console.error("[EDGE AI] Inference Error:", err);
                        resolve({
                            vision_diagnosis: "Unknown",
                            vision_confidence: 0,
                            is_crop_supported: false,
                            detected_subject: "Unknown Subject"
                        });
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("[EDGE AI] Initialization Error:", error);
            resolve({
                vision_diagnosis: "Unverified Foliar Sample",
                vision_confidence: 0,
                is_crop_supported: false,
                detected_subject: "Unverified Foliar Sample"
            });
        }
    });
};
