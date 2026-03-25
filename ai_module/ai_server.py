"""
ai_server.py - Stress Monitor AI Bridge Server
================================================
Auto-detects model type:
  - Old model (stress_model.h5 with input 64x64)   → uses 64x64
  - New VGG16 model (stress_model.h5 with 224x224) → uses 224x224
"""
import os, sys, json, base64, argparse
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

app   = Flask(__name__)
CORS(app)

stress_model   = None
stress_mapping = {'0': 'Low', '1': 'High'}
MODEL_INPUT    = 64    # default, auto-detected on load

face_cascade = None
eye_cascade  = None

def load_cascades():
    global face_cascade, eye_cascade
    import cv2
    base = cv2.data.haarcascades
    face_cascade = cv2.CascadeClassifier(base + 'haarcascade_frontalface_default.xml')
    eye_cascade  = cv2.CascadeClassifier(base + 'haarcascade_eye.xml')
    print("OK Face cascades loaded")

def load_models():
    global stress_model, stress_mapping, MODEL_INPUT
    import tensorflow as tf
    print("\nLoading model...")
    if os.path.exists('stress_model.h5'):
        stress_model = tf.keras.models.load_model('stress_model.h5')
        # Auto-detect input size from model
        try:
            input_shape = stress_model.input_shape
            MODEL_INPUT = input_shape[1]  # (None, H, W, C) → H
            print(f"OK Stress model loaded | Input size: {MODEL_INPUT}x{MODEL_INPUT}")
        except Exception:
            MODEL_INPUT = 64
            print("OK Stress model loaded | Input size: 64x64 (default)")

        if os.path.exists('stress_class_mapping.json'):
            data = json.load(open('stress_class_mapping.json'))
            stress_mapping = data['classes']
            model_type = data.get('model', 'CNN')
            print(f"OK Mapping loaded | Model type: {model_type}")
    else:
        print("WARN stress_model.h5 not found - fallback mode active")
        print("     Run TRAIN_MODELS.bat to train a proper model")

def preprocess(face_img):
    import cv2
    img = cv2.resize(face_img, (MODEL_INPUT, MODEL_INPUT))
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2RGB)
    else:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return np.expand_dims(img.astype('float32') / 255.0, axis=0)

def decode_image(b64str):
    import cv2
    if ',' in b64str:
        b64str = b64str.split(',')[1]
    arr = np.frombuffer(base64.b64decode(b64str), dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

def pick_best_face(faces, frame_w, frame_h):
    if len(faces) == 0:
        return None
    cx, cy = frame_w / 2, frame_h / 2
    best, best_score = None, -1
    for (x, y, fw, fh) in faces:
        if fw < 70 or fh < 70:
            continue
        score = fw * fh - ((x+fw/2-cx)**2 + (y+fh/2-cy)**2)**0.5 * 4
        if score > best_score:
            best_score, best = score, (x, y, fw, fh)
    return best

def face_is_live(face_img, face_gray):
    if min(face_gray.shape) < 50:
        return False
    if float(np.std(face_img.astype(float))) < 8.0:
        return False
    m = float(np.mean(face_gray))
    return 25 < m < 240

def get_stress_level(raw_label, confidence, face_gray):
    h = face_gray.shape[0]
    eye_bright    = float(np.mean(face_gray[:int(h*0.4), :])) / 255.0
    mouth_tension = float(np.std (face_gray[int(h*0.65):, :])) / 128.0
    if raw_label == 'Low':
        return ('Low', confidence) if confidence > 0.75 else ('Moderate', confidence)
    else:
        if confidence > 0.80 and eye_bright < 0.50 and mouth_tension > 0.28:
            return ('High', confidence)
        elif confidence > 0.68:
            return ('Moderate', confidence)
        else:
            return ('Low', confidence) if eye_bright > 0.55 else ('Moderate', confidence)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':       'running',
        'stress_model': stress_model is not None,
        'model_ready':  stress_model is not None,
        'input_size':   MODEL_INPUT,
        'model_type':   'VGG16' if MODEL_INPUT == 224 else 'CNN'
    })

@app.route('/predict', methods=['POST'])
def predict():
    import cv2
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image'}), 400

        img = decode_image(data['image'])
        if img is None:
            return jsonify({'error': 'Invalid image'}), 400

        frame_h, frame_w = img.shape[:2]
        gray    = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray_eq = cv2.equalizeHist(gray)

        # Detect faces - strict first then lenient
        faces = face_cascade.detectMultiScale(
            gray_eq, scaleFactor=1.05, minNeighbors=6,
            minSize=(70, 70), maxSize=(int(frame_w*0.85), int(frame_h*0.85))
        )
        if len(faces) == 0:
            faces = face_cascade.detectMultiScale(
                gray_eq, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60)
            )

        total_faces = len(faces)

        if total_faces == 0:
            return jsonify({
                'face_detected': False,
                'message': 'No face detected — please face the camera directly and ensure good lighting'
            })

        best = pick_best_face(list(faces), frame_w, frame_h)
        if best is None:
            return jsonify({
                'face_detected': False,
                'message': 'Face too small — please move closer to the camera'
            })

        (x, y, fw, fh) = best
        face_img  = img [max(0,y):y+fh, max(0,x):x+fw]
        face_gray = gray[max(0,y):y+fh, max(0,x):x+fw]

        if face_img.size == 0:
            return jsonify({'face_detected': False, 'message': 'Face region empty'})

        if not face_is_live(face_img, face_gray):
            return jsonify({
                'face_detected': False,
                'message': 'Not a live face — check lighting and camera angle'
            })

        # Stress prediction
        stress_level, confidence = 'Low', 0.5
        if stress_model is not None:
            preds     = stress_model.predict(preprocess(face_img), verbose=0)[0]
            idx       = int(np.argmax(preds))
            raw_conf  = float(preds[idx])
            raw_label = stress_mapping.get(str(idx), 'Low')
            stress_level, confidence = get_stress_level(raw_label, raw_conf, face_gray)
        else:
            b = float(np.mean(face_gray)) / 255.0
            stress_level = 'High' if b < 0.35 else ('Moderate' if b < 0.52 else 'Low')
            confidence   = 0.72 if b < 0.35 else (0.65 if b < 0.52 else 0.70)

        h2, w2 = face_gray.shape
        eye_bright = float(np.mean(face_gray[:int(h2*0.4), :])) / 255.0
        mouth_var  = float(np.std (face_gray[int(h2*0.65):, :])) / 128.0
        features = {
            'blink_rate':     15.0,
            'eye_openness':   round(eye_bright, 3),
            'mouth_openness': round(min(mouth_var, 1.0), 3),
            'head_tilt':      0.0,
            'eyebrow_raise':  round(eye_bright * 0.5, 3)
        }

        print(f"[{datetime.now().strftime('%H:%M:%S')}] "
              f"Face OK | {stress_level:8} | Conf:{confidence*100:.0f}% | "
              f"Faces:{total_faces} | Model:{MODEL_INPUT}px")

        return jsonify({
            'face_detected':        True,
            'stress_level':         stress_level,
            'confidence':           round(confidence, 4),
            'features':             features,
            'face_box':             {'x':int(x),'y':int(y),'w':int(fw),'h':int(fh)},
            'multiple_faces':       total_faces > 1,
            'total_faces_in_frame': total_faces,
            'timestamp':            datetime.now().isoformat()
        })

    except Exception as e:
        print(f"Error: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--port', type=int, default=5001)
    args = p.parse_args()
    print("=" * 55)
    print("  AUTISM STUDENT STRESS MONITOR — AI Server")
    print("=" * 55)
    load_cascades()
    load_models()
    print(f"\nReady on port {args.port}")
    print(f"  Open: http://localhost:3000/monitor\n")
    app.run(host='0.0.0.0', port=args.port, debug=False)
