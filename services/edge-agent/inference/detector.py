from typing import List, Dict, Any, Tuple

Point = Tuple[float, float]

def is_point_in_polygon(point: Point, polygon: List[Point]) -> bool:
    """Ray-casting algorithm for normalized coordinates [0.0 - 1.0]."""
    x, y = point
    n = len(polygon)
    if n < 3:
        return False

    inside = False
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside

class EdgeDetector:
    """YOLO detector inference abstraction with geometric zone intersection."""
    def __init__(self, confidence_threshold: float = 0.55):
        self.confidence_threshold = confidence_threshold

    def evaluate_detections_in_zone(
        self,
        detections: List[Dict[str, Any]],
        zone_polygon: List[Point]
    ) -> List[Dict[str, Any]]:
        """Filter detections whose bottom-center point falls inside the zone polygon."""
        breach_detections = []
        for det in detections:
            if det.get("confidence", 0.0) < self.confidence_threshold:
                continue

            bbox = det.get("bounding_box", {})
            feet_point = (
                (bbox.get("x_min", 0.0) + bbox.get("x_max", 0.0)) / 2.0,
                bbox.get("y_max", 0.0)
            )

            if is_point_in_polygon(feet_point, zone_polygon):
                breach_detections.append(det)

        return breach_detections

