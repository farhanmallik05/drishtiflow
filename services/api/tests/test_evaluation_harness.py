import pytest
import asyncio
from services.api.app.services.verifier import verify_context

EVALUATION_DATASET = [
    # Positive Intrusion Cases
    {"id": "eval-01", "event_type": "restricted_zone_entry", "detector_conf": 0.92, "ground_truth": "confirmed"},
    {"id": "eval-02", "event_type": "restricted_zone_entry", "detector_conf": 0.88, "ground_truth": "confirmed"},
    {"id": "eval-03", "event_type": "restricted_zone_entry", "detector_conf": 0.81, "ground_truth": "confirmed"},
    {"id": "eval-04", "event_type": "restricted_zone_entry", "detector_conf": 0.79, "ground_truth": "confirmed"},
    {"id": "eval-05", "event_type": "restricted_zone_entry", "detector_conf": 0.76, "ground_truth": "confirmed"},
    # Hard Negatives (Shadows, Optical glare, Low Confidence Noise)
    {"id": "eval-06", "event_type": "shadow_movement", "detector_conf": 0.25, "ground_truth": "not_confirmed"},
    {"id": "eval-07", "event_type": "headlight_reflection", "detector_conf": 0.30, "ground_truth": "not_confirmed"},
    {"id": "eval-08", "event_type": "camera_noise_rain", "detector_conf": 0.18, "ground_truth": "not_confirmed"},
    {"id": "eval-09", "event_type": "partial_boundary_flicker", "detector_conf": 0.52, "ground_truth": "uncertain"},
    {"id": "eval-10", "event_type": "stray_dog_perimeter", "detector_conf": 0.48, "ground_truth": "uncertain"},
]

@pytest.mark.asyncio
async def test_evaluation_benchmark():
    tp = 0
    fp = 0
    tn = 0
    fn = 0
    uncertain_count = 0

    for sample in EVALUATION_DATASET:
        result = await verify_context(
            detector_confidence=sample["detector_conf"],
            event_type=sample["event_type"]
        )

        decision = result.decision
        expected = sample["ground_truth"]

        if expected == "confirmed":
            if decision == "confirmed":
                tp += 1
            else:
                fn += 1
        elif expected == "not_confirmed":
            if decision == "not_confirmed":
                tn += 1
            elif decision == "confirmed":
                fp += 1
            else:
                uncertain_count += 1
        elif expected == "uncertain":
            uncertain_count += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

    print(f"\n--- EVALUATION BENCHMARK RESULTS ---")
    print(f"Total Evaluation Samples: {len(EVALUATION_DATASET)}")
    print(f"True Positives: {tp}, False Positives: {fp}, True Negatives: {tn}, False Negatives: {fn}")
    print(f"Uncertain/Human Review Degraded: {uncertain_count}")
    print(f"Precision: {precision * 100:.1f}%")
    print(f"Recall: {recall * 100:.1f}%")

    assert tp == 5
    assert fp == 0
    assert fn == 0
    assert precision == 1.0
    assert recall == 1.0

