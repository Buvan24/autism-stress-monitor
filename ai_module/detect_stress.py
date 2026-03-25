"""
detect_stress.py - CLI Webcam Stress Detector
==============================================
Standalone webcam monitor for autism students.
Detects STRESS LEVEL only (Low / Moderate / High).
Sends results to Node.js backend.

Usage:
  python detect_stress.py --student_id S101
  python detect_stress.py --student_id S101 --camera 0 --interval 3
"""
import cv2, numpy as np, requests, json, base64, time, argparse, os, sys
from datetime import datetime
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

COLORS = {'Low': (46, 213, 115), 'Moderate': (2, 165, 255), 'High': (87, 71, 255)}

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--student_id',   default='S101')
    p.add_argument('--server',       default='http://localhost:5000')
    p.add_argument('--stress_model', default='stress_model.h5')
    p.add_argument('--camera',       type=int, default=0)
    p.add_argument('--interval',     type=float, default=3.0)
    p.add_argument('--no_display',   action='store_true')
    return p.parse_args()

def preprocess_face(face_img):
    img = cv2.resize(face_img, (64, 64))
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    return np.expand_dims(img.astype('float32') / 255.0, axis=0)

def predict_stress(model, face_img, mapping):
    preds = model.predict(preprocess_face(face_img), verbose=0)[0]
    idx   = int(np.argmax(preds))
    conf  = float(preds[idx])
    label = mapping.get(str(idx), 'Low')
    # Map 2-class output to 3 levels
    if label == 'Low':
        return ('Low', conf) if conf > 0.75 else ('Moderate', conf)
    else:
        return ('High', conf) if conf > 0.80 else ('Moderate', conf)

def pick_best_face(faces, fw, fh):
    """Return largest, most-central face."""
    if len(faces) == 0:
        return None
    cx, cy = fw / 2, fh / 2
    best, best_score = None, -1
    for (x, y, w, h) in faces:
        if w < 70: continue
        score = w * h - ((x+w/2-cx)**2 + (y+h/2-cy)**2)**0.5 * 4
        if score > best_score:
            best_score, best = score, (x, y, w, h)
    return best

def face_is_live(face_img, face_gray):
    if min(face_gray.shape) < 50: return False
    if float(np.std(face_img.astype(float))) < 8.0: return False
    m = float(np.mean(face_gray))
    return 25 < m < 240

def extract_features(face_gray):
    h, _ = face_gray.shape
    eye_bright  = float(np.mean(face_gray[:int(h*0.4), :])) / 255.0
    mouth_var   = float(np.std(face_gray[int(h*0.65):, :])) / 128.0
    return {
        'blink_rate':     15.0,
        'eye_openness':   round(eye_bright, 3),
        'mouth_openness': round(min(mouth_var, 1.0), 3),
        'head_tilt':      0.0,
        'eyebrow_raise':  round(eye_bright * 0.5, 3)
    }

def send_to_backend(server, student_id, stress_level, confidence, features, frame, session_id):
    _, buf  = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
    img_b64 = base64.b64encode(buf).decode('utf-8')
    payload = {
        'student_id':  student_id,
        'stress_level':stress_level,
        'confidence':  round(confidence, 4),
        'features':    features,
        'image_data':  f'data:image/jpeg;base64,{img_b64}',
        'timestamp':   datetime.now().isoformat(),
        'session_id':  session_id
    }
    try:
        res = requests.post(f'{server}/api/detection', json=payload, timeout=5)
        if res.status_code == 201:
            if res.json().get('alert', {}) and res.json()['alert'].get('created'):
                print("  ALERT TRIGGERED!")
            return True
    except requests.exceptions.ConnectionError:
        print(f"  Cannot connect to {server}")
    except Exception as e:
        print(f"  Error: {e}")
    return False

def draw_overlay(frame, face_detected, stress_level, confidence, features, fps, student_id, connected, multi_face):
    h, w = frame.shape[:2]
    # Top bar
    cv2.rectangle(frame, (0, 0), (w, 55), (15, 15, 30), -1)
    cv2.putText(frame, f"Student: {student_id}", (10, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)
    cv2.putText(frame, f"FPS: {fps:.1f}", (10, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (140, 140, 140), 1)
    api_color = (46, 213, 115) if connected else (87, 71, 255)
    cv2.putText(frame, "API:OK" if connected else "API:OFF", (w-90, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.42, api_color, 1)

    if multi_face:
        cv2.rectangle(frame, (0, 55), (w, 82), (20, 10, 10), -1)
        cv2.putText(frame, "Multiple faces — using largest face only", (8, 75),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (100, 100, 255), 1)

    if face_detected:
        bgr = COLORS.get(stress_level, (255, 255, 255))
        cv2.rectangle(frame, (8, h-115), (270, h-8), (18, 18, 35), -1)
        cv2.rectangle(frame, (8, h-115), (270, h-8), bgr, 2)
        cv2.putText(frame, "STRESS LEVEL", (18, h-92), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (160, 160, 160), 1)
        cv2.putText(frame, stress_level.upper(), (18, h-58), cv2.FONT_HERSHEY_SIMPLEX, 1.1, bgr, 2)
        cv2.putText(frame, f"Confidence: {confidence*100:.1f}%", (18, h-36), cv2.FONT_HERSHEY_SIMPLEX, 0.46, (200, 200, 200), 1)
        bar = int(240 * confidence)
        cv2.rectangle(frame, (18, h-26), (258, h-16), (50, 50, 80), -1)
        cv2.rectangle(frame, (18, h-26), (18+bar, h-16), bgr, -1)
    else:
        cv2.rectangle(frame, (8, h-70), (310, h-8), (18, 18, 35), -1)
        cv2.rectangle(frame, (8, h-70), (310, h-8), (80, 80, 80), 1)
        cv2.putText(frame, "NO FACE DETECTED", (18, h-44), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 100), 1)
        cv2.putText(frame, "Please face the camera directly", (18, h-20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (80, 80, 80), 1)
    return frame

def main():
    args = parse_args()
    print("=" * 55)
    print("  AUTISM STUDENT STRESS MONITOR — LIVE WEBCAM")
    print("=" * 55)
    print(f"Student  : {args.student_id}")
    print(f"Server   : {args.server}")
    print(f"Interval : {args.interval}s")
    print("=" * 55)

    stress_model = None
    stress_mapping = {'0': 'Low', '1': 'High'}

    if os.path.exists(args.stress_model):
        print(f"\nLoading stress model: {args.stress_model}")
        import tensorflow as tf
        stress_model = tf.keras.models.load_model(args.stress_model)
        if os.path.exists('stress_class_mapping.json'):
            stress_mapping = json.load(open('stress_class_mapping.json'))['classes']
        print("Stress model loaded OK")
    else:
        print(f"stress_model.h5 not found — using brightness fallback")

    print("\nLoading face detector...")
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
    print("Face detector ready")

    print(f"\nOpening camera {args.camera}...")
    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print("Cannot open camera"); sys.exit(1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    print("Camera opened OK")
    print("\nRunning! Press Q to quit\n")

    session_id    = f"session_{int(time.time())}"
    last_send     = 0
    frame_count   = 0
    fps_timer     = time.time()
    fps           = 0
    connected     = False
    cur_stress    = 'Low'
    cur_conf      = 0.0
    cur_features  = None
    face_detected = False
    multi_face    = False

    os.makedirs('../captures', exist_ok=True)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Frame read failed"); break

        frame_count += 1
        if time.time() - fps_timer >= 1.0:
            fps = frame_count / (time.time() - fps_timer)
            frame_count = 0
            fps_timer = time.time()

        gray    = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray_eq = cv2.equalizeHist(gray)

        # Detect faces
        faces = face_cascade.detectMultiScale(gray_eq, scaleFactor=1.05, minNeighbors=6, minSize=(70, 70))
        if len(faces) == 0:
            faces = face_cascade.detectMultiScale(gray_eq, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))

        multi_face = len(faces) > 1
        best = pick_best_face(list(faces), frame.shape[1], frame.shape[0])

        if best is not None:
            (x, y, fw, fh) = best
            face_img  = frame[max(0,y):y+fh, max(0,x):x+fw]
            face_gray = gray[max(0,y):y+fh, max(0,x):x+fw]

            if face_img.size > 0 and face_is_live(face_img, face_gray):
                face_detected = True
                cv2.rectangle(frame, (x, y), (x+fw, y+fh), COLORS.get(cur_stress, (255,255,255)), 2)

                if stress_model:
                    cur_stress, cur_conf = predict_stress(stress_model, face_img, stress_mapping)
                else:
                    b = float(np.mean(face_gray)) / 255.0
                    cur_stress, cur_conf = ('High',0.72) if b<0.35 else (('Moderate',0.65) if b<0.5 else ('Low',0.70))
                cur_features = extract_features(face_gray)
            else:
                face_detected = False
        else:
            face_detected = False

        now = time.time()
        if now - last_send >= args.interval:
            if face_detected and cur_conf > 0:
                connected = send_to_backend(args.server, args.student_id,
                    cur_stress, cur_conf, cur_features or {}, frame, session_id)
                print(f"[{datetime.now().strftime('%H:%M:%S')}] {args.student_id} | "
                      f"{cur_stress:8} | Conf:{cur_conf*100:.0f}% | "
                      f"Face:YES | API:{'OK' if connected else 'FAIL'}")
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Waiting for face...")
            last_send = now

        if not args.no_display:
            frame = draw_overlay(frame, face_detected, cur_stress, cur_conf,
                                 cur_features, fps, args.student_id, connected, multi_face)
            cv2.imshow('Stress Monitor — Press Q to quit', frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("\nQuit"); break
            elif key == ord('s'):
                fname = f'../captures/{args.student_id}_{int(time.time())}.jpg'
                cv2.imwrite(fname, frame)
                print(f"Saved: {fname}")

    cap.release()
    if not args.no_display:
        cv2.destroyAllWindows()
    print(f"\nSession ended | Last stress: {cur_stress}")

if __name__ == '__main__':
    main()
