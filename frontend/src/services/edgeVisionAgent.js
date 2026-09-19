import { InferenceSession, Tensor, env } from 'onnxruntime-web';

// Configure ONNX Runtime to use local WASM files
env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';

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

const preprocessImage = (imageElement) => {
    const canvas = document.createElement('canvas');
    const width = 380;
    const height = 380;
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height).data;

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

    return new Tensor('float32', float32Data, [1, 3, height, width]);
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
                        const inputTensor = preprocessImage(img);
                        const inputName = session.inputNames[0];
                        const outputMap = await session.run({ [inputName]: inputTensor });
                        const outputData = outputMap[session.outputNames[0]].data;

                        const probabilities = softmax(Array.from(outputData));
                        
                        let maxProb = 0;
                        let maxIdx = 0;
                        for (let i = 0; i < probabilities.length; i++) {
                            if (probabilities[i] > maxProb) {
                                maxProb = probabilities[i];
                                maxIdx = i;
                            }
                        }

                        const diseaseName = EFFICIENTNET_CLASSES[maxIdx];
                        const detectedCrop = diseaseName.split(" ")[0];

                        console.log(`[EDGE AI] REAL Prediction: ${diseaseName} at ${(maxProb * 100).toFixed(2)}%`);

                        resolve({
                            vision_diagnosis: diseaseName,
                            vision_confidence: maxProb,
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
                vision_diagnosis: "Error Loading Model",
                vision_confidence: 0,
                is_crop_supported: false,
                detected_subject: "Error"
            });
        }
    });
};
