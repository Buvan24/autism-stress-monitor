import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import VGG16
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, Flatten, Dropout
from tensorflow.keras.optimizers import Adam

# =========================
# PATHS
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FER_TRAIN = os.path.join(BASE_DIR, "..", "dataset", "fer_autism", "train")
FER_TEST  = os.path.join(BASE_DIR, "..", "dataset", "fer_autism", "test")

CK_DIR = os.path.join(BASE_DIR, "..", "dataset", "ckplus", "CK+48")

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

# =========================
# DATA GENERATORS
# =========================
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    zoom_range=0.2,
    horizontal_flip=True
)

test_datagen = ImageDataGenerator(rescale=1./255)

print("Loading FER Autism dataset...")

train_data = train_datagen.flow_from_directory(
    FER_TRAIN,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

test_data = test_datagen.flow_from_directory(
    FER_TEST,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

NUM_CLASSES = train_data.num_classes
print("Classes:", train_data.class_indices)

# =========================
# MODEL (VGG16)
# =========================
base_model = VGG16(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)

# Freeze base layers
for layer in base_model.layers:
    layer.trainable = False

x = base_model.output
x = Flatten()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.5)(x)
output = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)

model.compile(
    optimizer=Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# =========================
# TRAIN PHASE 1
# =========================
print("\nPhase 1: Training top layers...")
model.fit(
    train_data,
    validation_data=test_data,
    epochs=10
)

# =========================
# FINE-TUNE LAST 4 LAYERS
# =========================
print("\nPhase 2: Fine-tuning...")

for layer in base_model.layers[-4:]:
    layer.trainable = True

model.compile(
    optimizer=Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(
    train_data,
    validation_data=test_data,
    epochs=10
)

# =========================
# SAVE MODEL
# =========================
SAVE_PATH = os.path.join(BASE_DIR, "stress_model.h5")
model.save(SAVE_PATH)

print("\n✅ Model saved at:", SAVE_PATH)