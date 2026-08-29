import os
import json
import zipfile
import urllib.request
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import models, transforms, datasets
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc
from sklearn.preprocessing import label_binarize

# ==============================================================================
# AGRINEXUS - COMPLETE 10-EPOCH TRAINING, EVALUATION & GRAPH EXPORT PIPELINE
# ==============================================================================

def download_and_extract_plantvillage(base_dir="./dataset"):
    os.makedirs(base_dir, exist_ok=True)
    url = "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
    zip_path = os.path.join(base_dir, "plantvillage.zip")
    
    if not os.path.exists(zip_path):
        print("📥 Downloading PlantVillage Dataset (50,000+ images)...")
        urllib.request.urlretrieve(url, zip_path)
        print("✅ Download complete.")
    
    extract_path = os.path.join(base_dir, "extracted")
    if not os.path.exists(extract_path):
        print("📦 Extracting dataset...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        print("✅ Extraction complete.")
    
    return os.path.join(extract_path, "PlantVillage-Dataset-master", "raw", "color")

def plot_confusion_matrix(y_true, y_pred, class_names, output_path="confusion_matrix.png"):
    """Generates and saves a high-resolution Confusion Matrix heatmap."""
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(18, 14))
    sns.heatmap(cm, annot=False, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title('AgriNexus EfficientNet-B4: Multi-Class Confusion Matrix (38 Pathology Classes)', fontsize=14, pad=15)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.ylabel('True Label', fontsize=12)
    plt.xticks(rotation=90, fontsize=8)
    plt.yticks(rotation=0, fontsize=8)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"📊 Confusion Matrix saved to: {output_path}")

def plot_roc_curves(y_true, y_probs, n_classes, output_path="roc_auc_curve.png"):
    """Generates and saves Micro/Macro ROC-AUC curves."""
    y_true_bin = label_binarize(y_true, classes=list(range(n_classes)))
    fpr = dict()
    tpr = dict()
    roc_auc = dict()

    for i in range(n_classes):
        fpr[i], tpr[i], _ = roc_curve(y_true_bin[:, i], y_probs[:, i])
        roc_auc[i] = auc(fpr[i], tpr[i])

    # Compute micro-average ROC curve
    fpr["micro"], tpr["micro"], _ = roc_curve(y_true_bin.ravel(), y_probs.ravel())
    roc_auc["micro"] = auc(fpr["micro"], tpr["micro"])

    plt.figure(figsize=(10, 8))
    plt.plot(fpr["micro"], tpr["micro"], label=f'Micro-average ROC curve (AUC = {roc_auc["micro"]:.4f})', color='deeppink', linestyle=':', linewidth=3)
    plt.plot([0, 1], [0, 1], 'k--', lw=1.5)
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate (1 - Specificity)', fontsize=12)
    plt.ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=12)
    plt.title('AgriNexus Receiver Operating Characteristic (ROC-AUC) Curves', fontsize=14, pad=15)
    plt.legend(loc="lower right", fontsize=11)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"📈 ROC-AUC Curves saved to: {output_path}")

def main():
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"🚀 Device selected: {device}")

    # 1. Dataset loading & transforms
    data_dir = download_and_extract_plantvillage()
    transform = transforms.Compose([
        transforms.Resize(400),
        transforms.CenterCrop(380),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    full_dataset = datasets.ImageFolder(data_dir, transform=transform)
    num_classes = len(full_dataset.classes)
    class_names = [cls.replace("_", " ") for cls in full_dataset.classes]

    # Save class mapping
    with open("class_mapping.json", "w") as f:
        json.dump({i: name for i, name in enumerate(class_names)}, f, indent=4)

    # 80/20 Train/Validation Split
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_set, val_set = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_set, batch_size=32, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_set, batch_size=32, shuffle=False, num_workers=2, pin_memory=True)

    # 2. Model: EfficientNet-B4 Transfer Learning
    model = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.DEFAULT)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=0.0003, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=10)

    # 3. 10-Epoch Training Loop
    epochs = 10
    print(f"\n🧠 Starting 10-Epoch Fine-Tuning on {len(train_set)} training samples...")
    for epoch in range(epochs):
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

        scheduler.step()
        print(f"Epoch [{epoch+1}/{epochs}] - Loss: {running_loss / len(train_loader):.4f} - LR: {scheduler.get_last_lr()[0]:.6f}")

    # 4. Rigorous Model Evaluation
    print("\n🔍 Running Comprehensive Evaluation on Validation Split...")
    model.eval()
    all_preds, all_labels, all_probs = [], [], []
    correct_top1, correct_top5, total = 0, 0, 0

    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)

            _, top1 = torch.max(outputs, 1)
            _, top5 = outputs.topk(5, 1, True, True)

            correct_top1 += (top1 == labels).sum().item()
            correct_top5 += top5.eq(labels.view(-1, 1).expand_as(top5)).sum().item()
            total += labels.size(0)

            all_preds.extend(top1.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    top1_acc = (correct_top1 / total) * 100
    top5_acc = (correct_top5 / total) * 100

    print(f"\n🎯 FINAL ACCURACY METRICS:")
    print(f"   ► Top-1 Accuracy: {top1_acc:.2f}%")
    print(f"   ► Top-5 Accuracy: {top5_acc:.2f}%")

    # 5. Generate and save Plots
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs = np.array(all_probs)

    plot_confusion_matrix(all_labels, all_preds, class_names, "confusion_matrix.png")
    plot_roc_curves(all_labels, all_probs, num_classes, "roc_auc_curve.png")

    # 6. Export to ONNX
    print("\n⚡ Exporting Model to ONNX Runtime Engine...")
    dummy_input = torch.randn(1, 3, 380, 380, device=device)
    onnx_path = "agrinexus_vision.onnx"
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"✅ ONNX Model successfully exported to: {onnx_path} ({os.path.getsize(onnx_path) / (1024*1024):.1f} MB)")
    print("\n🎉 ALL ARTIFACTS GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
