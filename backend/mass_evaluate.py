import os
import shutil
import random
import numpy as np
import onnxruntime as ort
from PIL import Image
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import time

# 1. Configuration
MODEL_PATH = "../frontend/public/models/agrinexus_vision.onnx"
TEMP_DIR = "./temp_pv/raw/color"
TEST_DATASET_DIR = "./test_dataset_1000"

CLASSES = ["Tomato_Early_blight", "Tomato_Healthy", "Tomato_Late_blight", "Tomato_Leaf_Mold"]
DIR_MAPPING = {
    "Tomato_Early_blight": "Tomato___Early_blight",
    "Tomato_Healthy": "Tomato___healthy",
    "Tomato_Late_blight": "Tomato___Late_blight",
    "Tomato_Leaf_Mold": "Tomato___Leaf_Mold"
}

IMAGES_PER_CLASS = 250

def setup_1000_images():
    """Copies exactly 250 random images per class from the sparsely cloned temp_pv folder."""
    if not os.path.exists(TEMP_DIR):
        print("ERROR: temp_pv directory not found. Please wait for the Git sparse checkout to finish.")
        return False

    os.makedirs(TEST_DATASET_DIR, exist_ok=True)
    print(f"Sampling {IMAGES_PER_CLASS} images per class (Total: {IMAGES_PER_CLASS * len(CLASSES)} images)...")
    
    total_copied = 0
    for class_name in CLASSES:
        source_dir = os.path.join(TEMP_DIR, DIR_MAPPING[class_name])
        dest_dir = os.path.join(TEST_DATASET_DIR, class_name)
        os.makedirs(dest_dir, exist_ok=True)
        
        if not os.path.exists(source_dir):
            print(f"Warning: Source folder {source_dir} not found!")
            continue
            
        all_images = [f for f in os.listdir(source_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if len(all_images) == 0:
            print(f"Warning: No images found in {source_dir}")
            continue
            
        # Sample randomly
        sampled_images = random.sample(all_images, min(IMAGES_PER_CLASS, len(all_images)))
        
        for img in sampled_images:
            shutil.copy2(os.path.join(source_dir, img), os.path.join(dest_dir, img))
            total_copied += 1
            
    print(f"Successfully staged {total_copied} images in {TEST_DATASET_DIR}/")
    return True

def preprocess_image(image_path):
    """Replicates PyTorch inference transforms."""
    img = Image.open(image_path).convert('RGB')
    img = img.resize((380, 380))
    img_data = np.array(img).astype(np.float32) / 255.0
    
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_data = (img_data - mean) / std
    
    img_data = np.transpose(img_data, (2, 0, 1))
    return np.expand_dims(img_data, axis=0)

def evaluate():
    if not setup_1000_images():
        return
    
    print(f"\nLoading ONNX Model into RAM...")
    session = ort.InferenceSession(MODEL_PATH, providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    
    y_true = []
    y_pred = []
    
    print("\nStarting Batch Inference Engine (This will take 1-2 minutes)...")
    start_time = time.time()
    
    total_processed = 0
    for class_idx, class_name in enumerate(CLASSES):
        folder_path = os.path.join(TEST_DATASET_DIR, class_name)
        if not os.path.exists(folder_path):
            continue
            
        images = os.listdir(folder_path)
        for img_name in images:
            img_path = os.path.join(folder_path, img_name)
            try:
                input_tensor = preprocess_image(img_path)
                outputs = session.run(None, {input_name: input_tensor})
                predicted_idx = np.argmax(outputs[0][0])
                
                y_true.append(class_idx)
                y_pred.append(predicted_idx)
                
                total_processed += 1
                if total_processed % 100 == 0:
                    print(f"Processed {total_processed}/1000 images...")
                    
            except Exception as e:
                pass

    end_time = time.time()
    duration = end_time - start_time

    # Print a professional grade report for the judges
    print("\n" + "="*60)
    print("🚀 AGRINEXUS 1,000-IMAGE BATCH EVALUATION REPORT")
    print("="*60)
    print(f"Total Images Evaluated: {len(y_true)}")
    print(f"Total Inference Time:   {duration:.2f} seconds")
    print(f"Speed per Image:        {(duration/len(y_true))*1000:.2f} ms")
    print(f"\n🔥 OVERALL ACCURACY:    {accuracy_score(y_true, y_pred) * 100:.2f}%\n")
    print("Detailed Classification Metrics:")
    print(classification_report(y_true, y_pred, target_names=CLASSES))
    
    print("Confusion Matrix:")
    cm = confusion_matrix(y_true, y_pred)
    print(cm)
    print("="*60)

if __name__ == "__main__":
    evaluate()
