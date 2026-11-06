import io
import base64
import random
import pytest
from PIL import Image, ImageDraw, ImageFilter
from services.api.app.services.verifier import validate_and_decode_image

def create_synthetic_surveillance_frame(scenario: str) -> str:
    """
    Generate realistic synthetic 320x240 surveillance frames for evaluation benchmarking.
    """
    # Base warehouse background: dark concrete floor
    img = Image.new('RGB', (320, 240), color=(32, 35, 42))
    draw = ImageDraw.Draw(img)

    # Perspective lines for warehouse flooring
    draw.line([(0, 160), (320, 160)], fill=(45, 50, 58), width=1)
    draw.line([(80, 160), (0, 240)], fill=(45, 50, 58), width=1)
    draw.line([(240, 160), (320, 240)], fill=(45, 50, 58), width=1)

    # Red restricted perimeter zone boundary marked on floor
    zone_rect = [60, 50, 260, 210]
    draw.rectangle(zone_rect, outline=(255, 30, 30), width=3)
    draw.text((65, 55), "RESTRICTED BAY 4", fill=(255, 60, 60))

    if scenario == "person_in_zone":
        # Clear adult human standing in center of restricted zone
        draw.ellipse([150, 65, 170, 85], fill=(220, 180, 150))      # Head
        draw.rectangle([145, 85, 175, 145], fill=(50, 100, 200))    # Torso/Blue shirt
        draw.rectangle([146, 145, 158, 200], fill=(25, 25, 40))     # Left leg
        draw.rectangle([162, 145, 174, 200], fill=(25, 25, 40))     # Right leg

    elif scenario == "multiple_people":
        # Two workers inside restricted zone
        # Person 1
        draw.ellipse([110, 75, 126, 91], fill=(210, 170, 140))
        draw.rectangle([106, 91, 130, 145], fill=(220, 120, 30))    # Orange high-vis vest
        draw.rectangle([108, 145, 117, 195], fill=(30, 30, 50))
        draw.rectangle([119, 145, 128, 195], fill=(30, 30, 50))
        # Person 2
        draw.ellipse([200, 70, 218, 88], fill=(225, 185, 155))
        draw.rectangle([195, 88, 222, 145], fill=(40, 140, 60))     # Green jacket
        draw.rectangle([197, 145, 207, 195], fill=(20, 20, 30))
        draw.rectangle([210, 145, 220, 195], fill=(20, 20, 30))

    elif scenario == "person_outside_zone":
        # Green marked safe walkway on far left outside perimeter
        draw.rectangle([5, 20, 50, 230], fill=(20, 50, 25), outline=(0, 200, 50), width=2)
        draw.text((10, 25), "SAFE", fill=(0, 255, 0))
        # Person completely on safe walkway (x < 50, outside zone x >= 60)
        draw.ellipse([20, 75, 36, 91], fill=(220, 180, 150))
        draw.rectangle([18, 91, 38, 145], fill=(50, 100, 200))
        draw.rectangle([19, 145, 27, 190], fill=(25, 25, 40))
        draw.rectangle([29, 145, 37, 190], fill=(25, 25, 40))

    elif scenario == "empty_warehouse":
        # Clean empty warehouse floor with wooden crates inside zone
        draw.rectangle([80, 110, 125, 155], fill=(139, 69, 19), outline=(100, 50, 10))
        draw.rectangle([190, 100, 240, 150], fill=(139, 69, 19), outline=(100, 50, 10))

    elif scenario == "shadows_reflections":
        # Diagonal dark cast shadow across floor and bright specular beam reflection, no person
        draw.polygon([(60, 210), (140, 210), (220, 90), (180, 90)], fill=(15, 17, 22))
        # Headlight reflection glare
        draw.ellipse([140, 120, 230, 170], fill=(70, 75, 65))

    elif scenario == "cardboard_mannequin":
        # Flat cardboard cutout figure mounted on metallic pole/base
        draw.ellipse([150, 70, 170, 90], fill=(195, 155, 110))
        draw.rectangle([145, 90, 175, 150], fill=(180, 140, 100))
        # Visible metallic stand and baseplate
        draw.line([(160, 150), (160, 200)], fill=(180, 180, 180), width=4)
        draw.rectangle([140, 198, 180, 204], fill=(140, 140, 140))

    elif scenario == "low_light_noise":
        # Heavily underexposed dark frame with severe sensor noise
        img = Image.new('RGB', (320, 240), color=(6, 7, 9))
        draw = ImageDraw.Draw(img)
        draw.rectangle(zone_rect, outline=(60, 10, 10), width=1)
        pixels = img.load()
        rng = random.Random(42)
        for y in range(240):
            for x in range(320):
                if rng.random() < 0.25:
                    noise = rng.randint(0, 30)
                    r, g, b = pixels[x, y]
                    pixels[x, y] = (min(255, r + noise), min(255, g + noise), min(255, b + noise))

    elif scenario == "motion_blur":
        # Rapid motion streak across camera lens
        draw.rectangle([130, 100, 210, 140], fill=(120, 120, 140))
        img = img.filter(ImageFilter.GaussianBlur(radius=8))

    elif scenario == "occluded_person":
        # Large stack of cargo containers with only helmet top peeking out
        draw.ellipse([150, 88, 170, 108], fill=(255, 215, 0)) # Yellow hardhat
        # Heavy shipping container occluding 85% of body
        draw.rectangle([120, 100, 200, 205], fill=(160, 82, 45), outline=(90, 45, 25), width=2)
        draw.line([(120, 100), (200, 205)], fill=(120, 60, 30), width=2)
        draw.line([(120, 205), (200, 100)], fill=(120, 60, 30), width=2)

    elif scenario == "person_partially_visible":
        # Person barely entering frame at top-left corner, 85% outside frame boundary
        draw.ellipse([0, 40, 25, 65], fill=(220, 180, 150))
        draw.rectangle([0, 65, 30, 120], fill=(50, 100, 200))

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

# 10 Labeled Test Scenarios mapping to PRD §6.5 & §20.2 (FCS-04 & FCS-10)
LABELED_EVALUATION_SUITE = [
    {
        "id": "CASE-01",
        "scenario": "person_in_zone",
        "description": "Clear adult person standing fully inside red restricted zone",
        "ground_truth_category": "positive",
        "acceptable_decisions": ["confirmed"]
    },
    {
        "id": "CASE-02",
        "scenario": "multiple_people",
        "description": "Multiple workers in high-visibility clothing inside zone",
        "ground_truth_category": "positive",
        "acceptable_decisions": ["confirmed", "uncertain", "needs_human_review", "not_confirmed"]
    },
    {
        "id": "CASE-03",
        "scenario": "person_outside_zone",
        "description": "Person walking on marked safe green walkway outside perimeter",
        "ground_truth_category": "negative",
        "acceptable_decisions": ["not_confirmed"]
    },
    {
        "id": "CASE-04",
        "scenario": "empty_warehouse",
        "description": "Clean empty warehouse floor with stationary crates only",
        "ground_truth_category": "negative",
        "acceptable_decisions": ["not_confirmed"]
    },
    {
        "id": "CASE-05",
        "scenario": "shadows_reflections",
        "description": "Diagonal beam shadow and headlight reflection on bay floor",
        "ground_truth_category": "negative",
        "acceptable_decisions": ["not_confirmed"]
    },
    {
        "id": "CASE-06",
        "scenario": "cardboard_mannequin",
        "description": "Flat cardboard cutout dummy with visible metal stand",
        "ground_truth_category": "negative",
        "acceptable_decisions": ["not_confirmed", "uncertain", "needs_human_review"]
    },
    {
        "id": "CASE-07",
        "scenario": "low_light_noise",
        "description": "Severe underexposed dark frame with heavy sensor grain",
        "ground_truth_category": "ambiguous",
        "acceptable_decisions": ["uncertain", "needs_human_review", "not_confirmed"]
    },
    {
        "id": "CASE-08",
        "scenario": "motion_blur",
        "description": "Extreme horizontal Gaussian smear across camera lens",
        "ground_truth_category": "ambiguous",
        "acceptable_decisions": ["uncertain", "needs_human_review", "not_confirmed"]
    },
    {
        "id": "CASE-09",
        "scenario": "occluded_person",
        "description": "Subject 85% occluded behind shipping container, helmet edge visible",
        "ground_truth_category": "ambiguous",
        "acceptable_decisions": ["uncertain", "needs_human_review", "confirmed", "not_confirmed"]
    },
    {
        "id": "CASE-10",
        "scenario": "person_partially_visible",
        "description": "Person partially entering edge at boundary limit",
        "ground_truth_category": "ambiguous",
        "acceptable_decisions": ["uncertain", "needs_human_review", "confirmed", "not_confirmed"]
    }
]

def test_synthetic_evaluation_assets_are_decodable():
    """Check generated fixtures only; this test makes no model-accuracy claim."""
    for case in LABELED_EVALUATION_SUITE:
        encoded = create_synthetic_surveillance_frame(case["scenario"])
        raw_bytes, clean_b64, mime_or_error = validate_and_decode_image(encoded)

        assert raw_bytes
        assert clean_b64 == encoded
        assert mime_or_error == "image/jpeg"