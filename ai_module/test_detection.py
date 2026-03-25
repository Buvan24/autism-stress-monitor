"""
test_detection.py
=================
Sends simulated detections to backend API.
Use this to test the full pipeline without a webcam or trained model.

Usage:
  python test_detection.py
  python test_detection.py --count 30 --student_id S101
  python test_detection.py --count 10 --student_id all
"""

import requests, random, time, argparse
from datetime import datetime

STUDENTS = ['S101', 'S102', 'S103', 'S104', 'S105']

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--server',     default='http://localhost:5000')
    p.add_argument('--student_id', default='all')
    p.add_argument('--count',      type=int, default=20)
    p.add_argument('--delay',      type=float, default=0.8)
    return p.parse_args()

def make_payload(student_id):
    level = random.choices(['Low','Moderate','High'], weights=[0.5,0.3,0.2])[0]
    conf  = 0.65 + random.random() * 0.33
    feats = {
        'blink_rate':     round(8  + random.random() * 25, 2),
        'eye_openness':   round(0.2 + random.random() * 0.5, 3),
        'mouth_openness': round(random.random() * 0.7, 3),
        'head_tilt':      round(random.random() * 25 - 12, 2),
        'eyebrow_raise':  round(random.random() * 0.6, 3),
    }
    return {
        'student_id':    student_id,
        'stress_level':  level,
        'confidence':    round(conf, 4),
        'autism_detected': random.random() > 0.6,
        'autism_confidence': round(0.6 + random.random()*0.3, 3),
        'features':      feats,
        'timestamp':     datetime.now().isoformat(),
        'session_id':    f'test_{int(time.time())}'
    }

def main():
    args = parse_args()
    print("="*55)
    print("  DETECTION PIPELINE TEST")
    print("="*55)
    print(f"Server : {args.server}")
    print(f"Student: {args.student_id}")
    print(f"Count  : {args.count}")
    print("="*55)

    # Health check
    try:
        r = requests.get(f'{args.server}/api/health', timeout=5)
        print(f"\n✅ Server: {r.json().get('message')}")
        print(f"   DB   : {r.json().get('db')}\n")
    except Exception as e:
        print(f"\n❌ Cannot reach server: {e}")
        print("   Start backend first: cd server && npm run dev\n")
        return

    ok = 0
    for i in range(args.count):
        sid = random.choice(STUDENTS) if args.student_id == 'all' else args.student_id
        payload = make_payload(sid)
        try:
            r = requests.post(f'{args.server}/api/detection', json=payload, timeout=5)
            if r.status_code == 201:
                alert = "🚨 ALERT!" if r.json().get('alert',{}) and r.json()['alert'].get('created') else ""
                ts = datetime.now().strftime('%H:%M:%S')
                print(f"[{i+1:2}/{args.count}] [{ts}] {payload['student_id']} | "
                      f"{payload['stress_level']:8} | Conf:{payload['confidence']*100:.0f}% {alert}")
                ok += 1
            else:
                print(f"[{i+1}/{args.count}] ❌ {r.status_code}")
        except Exception as e:
            print(f"[{i+1}/{args.count}] ❌ {e}")
        time.sleep(args.delay)

    print(f"\n✅ Done: {ok}/{args.count} sent")
    print(f"📊 View dashboard: http://localhost:3000")

if __name__ == '__main__':
    main()
