"""
train_stress_model.py
======================
VGG16 Transfer Learning — Autism Student Stress Detector
Trains on 3 datasets combined:
  1. FER-Autism   (autism children faces — Natural/Anger/Fear/Joy/Sadness/Surprise)
  2. WorkStress3D (direct stress/nostress labels)
  3. CK+          (Cohn-Kanade — angry/fear/sad/happy/neutral etc.)

FOLDER STRUCTURE REQUIRED:
  dataset/
    fer_autism/
      train/  → Natural/ Anger/ Fear/ Joy/ Sadness/ Surprise/
      test/   → Natural/ Anger/ Fear/ Joy/ Sadness/ Surprise/
    workstress/
      train/  → stress/ nostress/
      test/   → stress/ nostress/
    ckplus/   (optional)
      angry/ fear/ sadness/ happy/ neutral/ contempt/ disgust/ surprise/

RUN COMMAND:
  python train_stress_model.py

OUTPUT:
  stress_model.h5         (copy this to your laptop)
  stress_class_mapping.json
"""

import os, sys, json, shutil, random
import numpy as np
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# ── Stress / NoStress mapping for each dataset ────────────────────────────────

# FER-Autism emotion → label
FER_STRESS    = ['anger', 'angry', 'fear', 'sadness', 'sad', 'surprise']
FER_NOSTRESS  = ['natural', 'joy', 'happy', 'neutral']

# CK+ emotion → label
CK_STRESS     = ['angry', 'anger', 'fear', 'sadness', 'sad', 'disgust', 'contempt']
CK_NOSTRESS   = ['happy', 'neutral', 'surprise']

IMG_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.bmp', '.gif')

# ── Helper: collect images from a folder ─────────────────────────────────────

def collect_images(folder, label_map):
    """
    Walks subfolders of `folder`.
    label_map: dict of lowercase_subfolder_name -> 'stress' or 'nostress'
    Returns list of (filepath, label)
    """
    collected = []
    if not os.path.exists(folder):
        return collected
    for subfolder in os.listdir(folder):
        sub_path = os.path.join(folder, subfolder)
        if not os.path.isdir(sub_path):
            continue
        key = subfolder.lower().strip()
        label = label_map.get(key)
        if label is None:
            # try partial match
            for k, v in label_map.items():
                if k in key or key in k:
                    label = v
                    break
        if label is None:
            print(f"  SKIP unknown folder: {subfolder}")
            continue
        imgs = [os.path.join(sub_path, f) for f in os.listdir(sub_path)
                if f.lower().endswith(IMG_EXTENSIONS)]
        collected.extend([(p, label) for p in imgs])
        print(f"  {subfolder:15} → {label:8} | {len(imgs)} images")
    return collected

# ── Load all datasets ─────────────────────────────────────────────────────────

def load_all_datasets(base_dataset='../dataset'):
    all_train = []
    all_test  = []

    print("\n" + "="*55)
    print("  LOADING DATASETS")
    print("="*55)

    # ── 1. FER-Autism ─────────────────────────────────────
    fer_path = os.path.join(base_dataset, 'fer_autism')
    if os.path.exists(fer_path):
        print(f"\n[1] FER-Autism: {fer_path}")
        fer_map = {}
        for e in FER_STRESS:   fer_map[e] = 'stress'
        for e in FER_NOSTRESS: fer_map[e] = 'nostress'

        train_path = os.path.join(fer_path, 'train')
        test_path  = os.path.join(fer_path, 'test')

        if os.path.exists(train_path):
            imgs = collect_images(train_path, fer_map)
            all_train.extend(imgs)
            print(f"  → {len(imgs)} training images")
        else:
            # no train/test split — use whole folder, split later
            imgs = collect_images(fer_path, fer_map)
            random.shuffle(imgs)
            split = int(len(imgs) * 0.85)
            all_train.extend(imgs[:split])
            all_test.extend(imgs[split:])
            print(f"  → {len(imgs)} images (auto-split 85/15)")

        if os.path.exists(test_path):
            imgs = collect_images(test_path, fer_map)
            all_test.extend(imgs)
            print(f"  → {len(imgs)} test images")
    else:
        print(f"\n[1] FER-Autism NOT FOUND at {fer_path}")
        print("    Download: https://data.mendeley.com/datasets/b33pf78h62/1")

    # ── 2. WorkStress3D ───────────────────────────────────
    ws_path = os.path.join(base_dataset, 'workstress')
    if os.path.exists(ws_path):
        print(f"\n[2] WorkStress3D: {ws_path}")
        ws_map = {'stress': 'stress', 'nostress': 'nostress',
                  'no_stress': 'nostress', 'no stress': 'nostress',
                  'stressed': 'stress', 'not_stressed': 'nostress'}

        train_path = os.path.join(ws_path, 'train')
        test_path  = os.path.join(ws_path, 'test')

        if os.path.exists(train_path):
            imgs = collect_images(train_path, ws_map)
            all_train.extend(imgs)
            print(f"  → {len(imgs)} training images")
        else:
            imgs = collect_images(ws_path, ws_map)
            random.shuffle(imgs)
            split = int(len(imgs) * 0.85)
            all_train.extend(imgs[:split])
            all_test.extend(imgs[split:])
            print(f"  → {len(imgs)} images (auto-split 85/15)")

        if os.path.exists(test_path):
            imgs = collect_images(test_path, ws_map)
            all_test.extend(imgs)
            print(f"  → {len(imgs)} test images")
    else:
        print(f"\n[2] WorkStress3D NOT FOUND at {ws_path}")
        print("    Download: https://data.mendeley.com/datasets/t93xcwm75r/11")

    # ── 3. CK+ (optional) ────────────────────────────────
    ck_path = os.path.join(base_dataset, 'ckplus')
    if os.path.exists(ck_path):
        print(f"\n[3] CK+: {ck_path}")
        ck_map = {}
        for e in CK_STRESS:   ck_map[e] = 'stress'
        for e in CK_NOSTRESS: ck_map[e] = 'nostress'

        imgs = collect_images(ck_path, ck_map)
        random.shuffle(imgs)
        split = int(len(imgs) * 0.85)
        all_train.extend(imgs[:split])
        all_test.extend(imgs[split:])
        print(f"  → {len(imgs)} images (auto-split 85/15)")
    else:
        print(f"\n[3] CK+ (optional) not found — skipping")

    return all_train, all_test

# ── Build temporary clean dataset folder ─────────────────────────────────────

def build_temp_dataset(train_data, test_data, temp_dir='../dataset/_temp_training'):
    """Copy images into a clean stress/nostress folder for Keras generator."""
    print(f"\nBuilding temp dataset at {temp_dir}...")
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

    for split_name, data in [('train', train_data), ('test', test_data)]:
        for label in ['stress', 'nostress']:
            os.makedirs(os.path.join(temp_dir, split_name, label), exist_ok=True)

    counts = {'train': {'stress': 0, 'nostress': 0},
              'test':  {'stress': 0, 'nostress': 0}}

    for split_name, data in [('train', train_data), ('test', test_data)]:
        for i, (src_path, label) in enumerate(data):
            if not os.path.exists(src_path):
                continue
            ext = os.path.splitext(src_path)[1].lower() or '.jpg'
            dst = os.path.join(temp_dir, split_name, label, f"img_{split_name}_{i:06d}{ext}")
            try:
                shutil.copy2(src_path, dst)
                counts[split_name][label] += 1
            except Exception:
                pass

    print(f"  Train → stress: {counts['train']['stress']}, nostress: {counts['train']['nostress']}")
    print(f"  Test  → stress: {counts['test']['stress']},  nostress: {counts['test']['nostress']}")
    return temp_dir, counts

# ── Main training ─────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("  VGG16 STRESS MODEL TRAINING")
    print("  Autism Student Stress Monitor")
    print("=" * 55)

    # Check Python packages
    try:
        import tensorflow as tf
        print(f"\nTensorFlow: {tf.__version__}")
        gpu = tf.config.list_physical_devices('GPU')
        if gpu:
            print(f"GPU found: {gpu[0].name} — training will be FAST!")
        else:
            print("No GPU — using CPU (will take longer but works fine)")
    except ImportError:
        print("\nERROR: TensorFlow not installed!")
        print("Run: pip install tensorflow")
        sys.exit(1)

    # Load all datasets
    random.seed(42)
    train_data, test_data = load_all_datasets('../dataset')

    if len(train_data) == 0:
        print("\n" + "="*55)
        print("ERROR: No training images found!")
        print("\nPlease download datasets and place them here:")
        print("  dataset/fer_autism/   from https://data.mendeley.com/datasets/b33pf78h62/1")
        print("  dataset/workstress/   from https://data.mendeley.com/datasets/t93xcwm75r/11")
        print("  dataset/ckplus/       from https://www.kaggle.com/datasets/shawon10/ckplus")
        print("="*55)
        sys.exit(1)

    # Shuffle
    random.shuffle(train_data)
    random.shuffle(test_data)

    # If no test data, split from train
    if len(test_data) == 0:
        split = int(len(train_data) * 0.85)
        test_data  = train_data[split:]
        train_data = train_data[:split]

    print(f"\nTotal training images : {len(train_data)}")
    print(f"Total testing images  : {len(test_data)}")

    stress_count   = sum(1 for _, l in train_data if l == 'stress')
    nostress_count = sum(1 for _, l in train_data if l == 'nostress')
    print(f"  Train stress        : {stress_count}")
    print(f"  Train nostress      : {nostress_count}")

    # Build temp dataset folder
    temp_dir, counts = build_temp_dataset(train_data, test_data)

    # Keras imports
    from tensorflow import keras
    from tensorflow.keras import layers
    from tensorflow.keras.applications import VGG16
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

    IMG_SIZE  = (224, 224)   # VGG16 requires 224x224
    BATCH     = 16
    EPOCHS_1  = 15           # Phase 1: frozen VGG16
    EPOCHS_2  = 15           # Phase 2: fine-tune top layers

    # Data generators with augmentation
    train_gen_raw = ImageDataGenerator(
        rescale=1./255,
        rotation_range=15,
        width_shift_range=0.15,
        height_shift_range=0.15,
        horizontal_flip=True,
        zoom_range=0.15,
        brightness_range=[0.75, 1.25],
        shear_range=0.1,
        fill_mode='nearest'
    )
    val_gen_raw = ImageDataGenerator(rescale=1./255)

    print("\nCreating data generators...")
    train_gen = train_gen_raw.flow_from_directory(
        os.path.join(temp_dir, 'train'),
        target_size=IMG_SIZE, batch_size=BATCH,
        class_mode='categorical', shuffle=True
    )
    val_gen = val_gen_raw.flow_from_directory(
        os.path.join(temp_dir, 'test'),
        target_size=IMG_SIZE, batch_size=BATCH,
        class_mode='categorical', shuffle=False
    )

    print(f"Classes: {train_gen.class_indices}")
    num_classes = len(train_gen.class_indices)

    # ── Build VGG16 model ────────────────────────────────────────────────────
    print("\nLoading VGG16 base model (downloading ~550MB if first time)...")
    base_model = VGG16(weights='imagenet', include_top=False,
                       input_shape=(224, 224, 3))
    base_model.trainable = False  # Phase 1: freeze all VGG16 layers
    print("VGG16 loaded OK")

    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ], name='VGG16_StressDetector')

    model.summary()

    # ── Phase 1: Train top layers only ───────────────────────────────────────
    print(f"\n{'='*55}")
    print(f"  PHASE 1: Training top layers ({EPOCHS_1} epochs)")
    print(f"  VGG16 base is FROZEN")
    print(f"{'='*55}\n")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    callbacks_1 = [
        ModelCheckpoint('stress_model.h5', monitor='val_accuracy',
                        save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_accuracy', patience=5,
                      restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                          patience=3, min_lr=1e-7, verbose=1)
    ]

    history1 = model.fit(
        train_gen, epochs=EPOCHS_1,
        validation_data=val_gen,
        callbacks=callbacks_1
    )

    best_phase1 = max(history1.history['val_accuracy'])
    print(f"\nPhase 1 best accuracy: {best_phase1*100:.2f}%")

    # ── Phase 2: Fine-tune top VGG16 layers ──────────────────────────────────
    print(f"\n{'='*55}")
    print(f"  PHASE 2: Fine-tuning top VGG16 layers ({EPOCHS_2} epochs)")
    print(f"  Unfreezing last 4 VGG16 layers")
    print(f"{'='*55}\n")

    # Unfreeze last 4 layers of VGG16
    base_model.trainable = True
    for layer in base_model.layers[:-4]:
        layer.trainable = False

    # Recompile with lower learning rate
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    callbacks_2 = [
        ModelCheckpoint('stress_model.h5', monitor='val_accuracy',
                        save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_accuracy', patience=6,
                      restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                          patience=3, min_lr=1e-8, verbose=1)
    ]

    history2 = model.fit(
        train_gen, epochs=EPOCHS_2,
        validation_data=val_gen,
        callbacks=callbacks_2
    )

    best_phase2 = max(history2.history['val_accuracy'])

    # ── Save class mapping ────────────────────────────────────────────────────
    # class_indices: {'nostress': 0, 'stress': 1}  (alphabetical)
    mapping = {}
    for name, idx in train_gen.class_indices.items():
        if 'nostress' in name or 'no' in name:
            mapping[str(idx)] = 'Low'
        else:
            mapping[str(idx)] = 'High'

    with open('stress_class_mapping.json', 'w') as f:
        json.dump({
            'classes':    mapping,
            'type':       'stress',
            'model':      'VGG16',
            'input_size': 224
        }, f, indent=2)

    print(f"\n{'='*55}")
    print(f"  TRAINING COMPLETE!")
    print(f"{'='*55}")
    print(f"  Phase 1 best accuracy : {best_phase1*100:.2f}%")
    print(f"  Phase 2 best accuracy : {best_phase2*100:.2f}%")
    print(f"  Final best accuracy   : {max(best_phase1,best_phase2)*100:.2f}%")
    print(f"{'='*55}")
    print(f"\n  Model saved : stress_model.h5")
    print(f"  Mapping     : {mapping}")
    print(f"\n  NOW COPY stress_model.h5 TO YOUR LAPTOP!")
    print(f"  Paste it in: ai_module/stress_model.h5")
    print(f"{'='*55}\n")

    # Cleanup temp folder
    try:
        shutil.rmtree(temp_dir)
        print("Temp files cleaned up.")
    except Exception:
        pass

if __name__ == '__main__':
    main()
