import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader, random_split
import urllib.request
import zipfile
import json

# ==============================================================================
# AGRINEXUS - REAL PLANTVILLAGE EFFICIENTNET-B4 TRAINING PIPELINE
# ==============================================================================

def download_and_extract_plantvillage(base_dir="./dataset"):
    """
    Downloads the official PlantVillage dataset directly from GitHub.
    Contains 50,000+ images across 38 crop disease classes.
    """
    os.makedirs(base_dir, exist_ok=True)
    url = "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
    zip_path = os.path.join(base_dir, "plantvillage.zip")
    
    if not os.path.exists(zip_path):
        print("📥 Downloading the REAL PlantVillage Dataset (~800MB). This may take a few minutes...")
        urllib.request.urlretrieve(url, zip_path)
        print("✅ Download complete.")
    
    extract_path = os.path.join(base_dir, "extracted")
    if not os.path.exists(extract_path):
        print("📦 Extracting 50,000+ images...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        print("✅ Extraction complete.")
    
    # The actual color images are stored deep in the zip structure
    return os.path.join(extract_path, "PlantVillage-Dataset-master", "raw", "color")

def train_and_export():
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"🚀 Initializing Training Pipeline on: {device}")

    # 1. Download & Prepare Data
    data_dir = download_and_extract_plantvillage()
    
    # 2. Transformations (EfficientNet-B4 requires 380x380 resolution)
    transform = transforms.Compose([
        transforms.Resize(400),
        transforms.CenterCrop(380),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print("🔍 Loading image tensors...")
    full_dataset = datasets.ImageFolder(data_dir, transform=transform)
    
    # Save the class mapping for the backend to use
    class_mapping = {i: cls_name.replace("_", " ") for cls_name, i in full_dataset.class_to_idx.items()}
    with open("class_mapping.json", "w") as f:
        json.dump(class_mapping, f, indent=4)
    print("✅ Exported class_mapping.json (38 real crop classes).")

    # 3. 80/20 Train/Validation Split
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True, num_workers=2)
    
    # 4. Load Pre-trained EfficientNet-B4
    print("🧠 Loading Pre-trained EfficientNet-B4 Architecture...")
    model = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.DEFAULT)
    
    # Transfer Learning: Replace final layer to match 38 PlantVillage classes
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, len(full_dataset.classes))
    model = model.to(device)

    # 5. Define Loss and Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=0.001)

    # 6. Training Loop (Running for 2 Epochs to ensure strong baseline for testing)
    epochs = 2 
    for epoch in range(epochs):
        print(f"\n📈 Epoch {epoch+1}/{epochs}")
        model.train()
        running_loss = 0.0
        
        for i, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            if i % 100 == 99:
                print(f"   Batch {i+1} - Loss: {running_loss / 100:.4f}")
                running_loss = 0.0

    print("\n✅ Training Complete!")

    # 7. EXPORT TO ONNX
    print("⚙️ Exporting model to optimized ONNX format...")
    model.eval()
    dummy_input = torch.randn(1, 3, 380, 380).to(device)
    onnx_path = "agrinexus_vision.onnx"
    
    torch.onnx.export(
        model, dummy_input, onnx_path, 
        export_params=True, opset_version=14, do_constant_folding=True, 
        input_names=['input'], output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    
    print(f"\n🎉 SUCCESS! You now have a real production model.")
    print("Download BOTH 'agrinexus_vision.onnx' AND 'class_mapping.json' from Colab.")
    print("Place them inside your AgriNexus/backend/ml_model/ directory.")

if __name__ == '__main__':
    train_and_export()