import json
import sys
from ultralytics import YOLO

model = YOLO(r"C:\Users\91810\Desktop\internship 8000\YOLO-Explorer\backend\models\yolov8n.pt")

def detect_objects(image_path):
    results = model(image_path, verbose=False, conf=0.5)  # Disable extra logs
    detections = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            label = model.names[int(box.cls[0])]
            confidence = float(box.conf[0])
            detections.append({
                "label": label,
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2]
            })
    return json.dumps(detections)

if __name__ == "__main__":
    image_path = sys.argv[1]
    print(detect_objects(image_path))
