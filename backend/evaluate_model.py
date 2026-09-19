import os
import urllib.request
import numpy as np
import onnxruntime as ort
from PIL import Image
from sklearn.metrics import classification_report, accuracy_score

# 1. Configuration
MODEL_PATH = "../frontend/public/models/agrinexus_vision.onnx"
TEST_DATASET_DIR = "./test_dataset"

CLASSES = ["Tomato_Early_blight", "Tomato_Healthy", "Tomato_Late_blight", "Tomato_Leaf_Mold"]

# Sample images to auto-download for the judge demo
SAMPLE_IMAGES = {
    "Tomato_Early_blight": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Early_blight/0012b9d2-2130-4a06-a834-b1f3af34f57e___RS_Erly.B_8389.JPG",
    "Tomato_Healthy": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___healthy/000146ff-92a4-4db6-90ad-8fce2ae4fddd___GH_Hlth_a_9241.JPG",
    "Tomato_Late_blight": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Late_blight/0003faa8-4b27-4c65-bf42-6d9e352ca1a5___RS_Late.B_6208.JPG",
    "Tomato_Leaf_Mold": "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Leaf_Mold/000c0fbc-c006-44c1-9257-23030ca0297d___Crnl_L.Mold_7153.JPG"
}

def setup_test_dataset():
    """Creates folders and downloads 1 sample image per class for instant testing."""
    os.makedirs(TEST_DATASET_DIR, exist_ok=True)
    print("Setting up test dataset...")
    for class_name, url in SAMPLE_IMAGES.items():
        folder_path = os.path.join(TEST_DATASET_DIR, class_name)
        os.makedirs(folder_path, exist_ok=True)
        img_path = os.path.join(folder_path, "sample.jpg")
        if not os.path.exists(img_path):
            try:
                urllib.request.urlretrieve(url, img_path)
            except Exception as e:
                print(f"Failed to download {class_name}: {e}")

def preprocess_image(image_path):
    """Replicates the exact PyTorch transforms used during training."""
    img = Image.open(image_path).convert('RGB')
    img = img.resize((380, 380))
    img_data = np.array(img).astype(np.float32) / 255.0
    
    # Normalize (ImageNet stats)
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_data = (img_data - mean) / std
    
    # ONNX expects channels first: (Batch, Channels, Height, Width)
    img_data = np.transpose(img_data, (2, 0, 1))
    return np.expand_dims(img_data, axis=0)

def evaluate():
    setup_test_dataset()
    
    print(f"\nLoading ONNX Model from {MODEL_PATH}...")
    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model not found at {MODEL_PATH}")
        return
        
    session = ort.InferenceSession(MODEL_PATH)
    input_name = session.get_inputs()[0].name
    
    y_true = []
    y_pred = []
    
    print("Running Batch Inference on Test Dataset...\n")
    for class_idx, class_name in enumerate(CLASSES):
        folder_path = os.path.join(TEST_DATASET_DIR, class_name)
        if not os.path.exists(folder_path):
            continue
            
        for img_name in os.listdir(folder_path):
            img_path = os.path.join(folder_path, img_name)
            try:
                input_tensor = preprocess_image(img_path)
                outputs = session.run(None, {input_name: input_tensor})
                predicted_idx = np.argmax(outputs[0][0])
                
                y_true.append(class_idx)
                y_pred.append(predicted_idx)
                print(f"[{class_name}] -> Predicted: {CLASSES[predicted_idx]}")
            except Exception as e:
                print(f"Error processing {img_name}: {e}")

    if len(y_true) == 0:
        print("No test images found!")
        return

    # Print a professional grade report for the judges
    print("\n" + "="*50)
    print("🚀 AGRINEXUS VISION MODEL EVALUATION REPORT")
    print("="*50)
    print(f"Total Images Evaluated: {len(y_true)}")
    print(f"Overall Accuracy:  {accuracy_score(y_true, y_pred) * 100:.2f}%\n")
    print("Detailed Metrics (Precision, Recall, F1-Score):")
    
    # Suppress warnings for classes with 0 samples in a tiny test set
    import warnings
    from sklearn.exceptions import UndefinedMetricWarning
    warnings.filterwarnings("ignore", category=UndefinedMetricWarning)
    
    print(classification_report(y_true, y_pred, target_names=CLASSES, labels=[0, 1, 2, 3]))

if __name__ == "__main__":
    evaluate()
