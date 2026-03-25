"""
train_autism_model.py
=====================
Trains CNN on YOUR AutismDataset:
  AutismDataset/train/Autistic/
  AutismDataset/train/Non_Autistic/
  AutismDataset/valid/Autistic/
  AutismDataset/valid/Non_Autistic/

Usage:
  python train_autism_model.py
  python train_autism_model.py --dataset ../dataset/AutismDataset --epochs 25
"""

import os, sys, json, argparse
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--dataset', default='../dataset/AutismDataset')
    p.add_argument('--epochs', type=int, default=25)
    p.add_argument('--batch', type=int, default=32)
    p.add_argument('--model_out', default='autism_model.h5')
    return p.parse_args()

def main():
    args = parse_args()
    print("="*55)
    print("  AUTISM MODEL TRAINING (AutismDataset)")
    print("="*55)
    print(f"Dataset : {args.dataset}")
    print(f"Epochs  : {args.epochs}")
    print(f"Output  : {args.model_out}")
    print("="*55)

    train_path = os.path.join(args.dataset, 'train')
    valid_path = os.path.join(args.dataset, 'valid')

    if not os.path.exists(train_path):
        print(f"\n❌ Dataset not found: {train_path}")
        print("""
📂 Expected structure:
  dataset/
    AutismDataset/
      train/
        Autistic/       <- paste autistic face images here
        Non_Autistic/   <- paste non-autistic images here
      valid/
        Autistic/
        Non_Autistic/
      test/
        Autistic/
        Non_Autistic/
""")
        sys.exit(1)

    # Count images
    for split in ['train', 'valid', 'test']:
        for cls in ['Autistic', 'Non_Autistic']:
            path = os.path.join(args.dataset, split, cls)
            if os.path.exists(path):
                count = len([f for f in os.listdir(path)
                             if f.lower().endswith(('.jpg','.jpeg','.png','.bmp'))])
                print(f"  {split}/{cls}: {count} images")

    print("\n📦 Loading TensorFlow...")
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

    IMG_SIZE = (64, 64)

    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.15,
        brightness_range=[0.8, 1.2]
    )
    val_datagen = ImageDataGenerator(rescale=1./255)

    print("\n🔄 Creating data generators...")
    train_gen = train_datagen.flow_from_directory(
        train_path, target_size=IMG_SIZE, batch_size=args.batch,
        class_mode='categorical', shuffle=True
    )
    val_gen = val_datagen.flow_from_directory(
        valid_path, target_size=IMG_SIZE, batch_size=args.batch,
        class_mode='categorical', shuffle=False
    )

    print(f"\n✅ Classes found: {train_gen.class_indices}")
    num_classes = len(train_gen.class_indices)

    print("\n🏗️  Building CNN model...")
    model = keras.Sequential([
        layers.Conv2D(32, (3,3), padding='same', activation='relu', input_shape=(64,64,3)),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3,3), padding='same', activation='relu'),
        layers.MaxPooling2D((2,2)), layers.Dropout(0.25),

        layers.Conv2D(64, (3,3), padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3,3), padding='same', activation='relu'),
        layers.MaxPooling2D((2,2)), layers.Dropout(0.25),

        layers.Conv2D(128, (3,3), padding='same', activation='relu'),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling2D(),

        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(), layers.Dropout(0.5),
        layers.Dense(128, activation='relu'), layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ], name='AutismCNN')

    model.summary()
    model.compile(
        optimizer=keras.optimizers.Adam(0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    callbacks = [
        ModelCheckpoint(args.model_out, monitor='val_accuracy', save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_accuracy', patience=8, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4, min_lr=1e-7)
    ]

    print(f"\n🚀 Training for {args.epochs} epochs...\n")
    history = model.fit(
        train_gen, epochs=args.epochs,
        validation_data=val_gen,
        callbacks=callbacks
    )

    # Save class mapping
    # Autistic -> True, Non_Autistic -> False
    mapping = {}
    for name, idx in train_gen.class_indices.items():
        mapping[str(idx)] = name  # 'Autistic' or 'Non_Autistic'

    with open('autism_class_mapping.json', 'w') as f:
        json.dump({'classes': mapping, 'type': 'autism'}, f, indent=2)

    best_acc = max(history.history['val_accuracy'])
    print("\n" + "="*55)
    print(f"✅ AUTISM TRAINING DONE!")
    print(f"💾 Model saved: {args.model_out}")
    print(f"🏆 Best val accuracy: {best_acc*100:.2f}%")
    print("="*55)

if __name__ == '__main__':
    main()
