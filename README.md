# Autism Student Stress Monitor
Real-time stress level monitoring for autism students using VGG16 deep learning.

> This system monitors STRESS LEVELS only (Low / Moderate / High).
> It does NOT detect or diagnose autism.

---

## QUICK START — 2 Situations

### Situation A: You Already Have stress_model.h5 (trained on high PC)
1. Paste `stress_model.h5` into `ai_module/` folder
2. Double-click `START_PROJECT.bat`
3. Double-click `START_AI_SERVER.bat`
4. Open http://localhost:3000
5. Login: admin / admin123

### Situation B: You Need to Train First
Follow the TRAINING GUIDE below.

---

## TRAINING GUIDE (Do This on High PC)

### Step 1 — Download 3 Datasets (All Free)

**Dataset 1 — FER-Autism (REQUIRED)**
```
https://data.mendeley.com/datasets/b33pf78h62/1
```
- Click Download All
- Extract zip file
- You will see folders: Natural, Anger, Fear, Joy, Sadness, Surprise

**Dataset 2 — WorkStress3D (REQUIRED)**
```
https://data.mendeley.com/datasets/t93xcwm75r/11
```
- Click Download All
- Extract zip file
- You will see folders: stress, nostress

**Dataset 3 — CK+ (OPTIONAL but recommended)**
```
https://www.kaggle.com/datasets/shawon10/ckplus
```
- Free Kaggle account needed
- Extract zip file
- You will see folders: angry, fear, happy, neutral, sadness, disgust etc.

---

### Step 2 — Place Datasets in This Exact Structure

```
autism-stress-monitor/
└── dataset/
    │
    ├── fer_autism/              ← FER-Autism dataset here
    │   ├── train/
    │   │   ├── Natural/         ← paste Natural face images here
    │   │   ├── Anger/           ← paste Anger face images here
    │   │   ├── Fear/            ← paste Fear face images here
    │   │   ├── Joy/             ← paste Joy face images here
    │   │   ├── Sadness/         ← paste Sadness face images here
    │   │   └── Surprise/        ← paste Surprise face images here
    │   └── test/
    │       ├── Natural/
    │       ├── Anger/
    │       ├── Fear/
    │       ├── Joy/
    │       ├── Sadness/
    │       └── Surprise/
    │
    ├── workstress/              ← WorkStress3D dataset here
    │   ├── train/
    │   │   ├── stress/          ← paste stress images here
    │   │   └── nostress/        ← paste nostress images here
    │   └── test/
    │       ├── stress/
    │       └── nostress/
    │
    └── ckplus/                  ← CK+ dataset here (optional)
        ├── angry/
        ├── fear/
        ├── happy/
        ├── neutral/
        ├── sadness/
        ├── disgust/
        ├── contempt/
        └── surprise/
```

---

### Step 3 — Run Training

Double-click: `TRAIN_MODELS.bat`

OR in Command Prompt:
```bash
cd ai_module
python train_stress_model.py
```

---

### Step 4 — Watch Training Progress

You will see:
```
[1] FER-Autism loaded
  Natural   → nostress | 240 images
  Anger     → stress   | 180 images
  ...

[2] WorkStress3D loaded
  stress    → stress   | 250 images
  nostress  → nostress | 270 images

Total training images: 1850

Phase 1: Training top layers (15 epochs)
Epoch 1/15 ... accuracy: 0.65
Epoch 2/15 ... accuracy: 0.72
...

Phase 2: Fine-tuning VGG16 (15 epochs)
Epoch 1/15 ... accuracy: 0.81
...

TRAINING COMPLETE!
Best accuracy: 85.3%
Model saved: stress_model.h5
```

Training time:
- With GPU  = 20-40 minutes
- CPU only  = 1-2 hours

---

### Step 5 — Copy to Your Laptop

Copy ONLY this 1 file:
```
ai_module/stress_model.h5    (~100-150 MB)
```

Via USB, WhatsApp, Google Drive, or any method.

Paste on your laptop:
```
autism-stress-monitor/
└── ai_module/
    └── stress_model.h5    ← paste here (replaces old one)
```

---

## RUNNING THE PROJECT (On Your Laptop)

### Open 3 separate Command Prompt windows:

**Window 1 — Backend Server:**
```bash
cd server
npm install
node server.js
```

**Window 2 — Frontend:**
```bash
cd client
npm install
npm start
```

**Window 3 — AI Server:**
```bash
cd ai_module
python ai_server.py
```

OR just double-click `START_PROJECT.bat` and `START_AI_SERVER.bat`

Then open: **http://localhost:3000**
Login: **admin / admin123**

---

## HOW STRESS IS DETECTED

```
Webcam frame
     ↓
Face detection (Haar Cascade)
     ↓
Single face selected (largest, most central)
     ↓
Face image resized to 224x224
     ↓
VGG16 model predicts: stress or nostress
     ↓
Confidence score used to determine:
  nostress + high confidence  = Low stress
  nostress + low confidence   = Moderate stress
  stress + low confidence     = Moderate stress
  stress + high confidence    = High stress
     ↓
Result shown on screen + saved to database
```

---

## REQUIREMENTS

**Python packages:**
```
tensorflow
opencv-python
flask
flask-cors
numpy
pillow
scikit-learn
matplotlib
```

**Node.js packages** (auto-installed by npm install):
- express, mongoose, cors, jsonwebtoken, bcryptjs

**Other:**
- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)
- Webcam

---

## EMOTION TO STRESS MAPPING

| Emotion | Mapped To |
|---------|-----------|
| Natural / Joy / Happy / Neutral | nostress → Low |
| Anger / Fear / Sadness / Disgust | stress → High/Moderate |

