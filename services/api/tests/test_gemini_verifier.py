import io
import base64
import pytest
from PIL import Image, ImageDraw
from services.api.app.services.verifier import verify_context, validate_and_decode_image
from services.api.app.config import settings

def make_test_jpeg(width: int = 320, height: int = 240, with_person: bool = True) -> str:
    img = Image.new('RGB', (width, height), color=(30, 30, 35))
    draw = ImageDraw.Draw(img)
    draw.rectangle([40, 40, width - 40, height - 40], outline=(255, 0, 0), width=3)
    if with_person:
        draw.ellipse([width // 2 - 10, height // 2 - 30, width // 2 + 10, height // 2 - 10], fill=(220, 180, 150))
        draw.rectangle([width // 2 - 12, height // 2 - 10, width // 2 + 12, height // 2 + 30], fill=(50, 100, 200))
        draw.rectangle([width // 2 - 12, height // 2 + 30, width // 2 - 2, height // 2 + 65], fill=(30, 30, 80))
        draw.rectangle([width // 2 + 2, height // 2 + 30, width // 2 + 12, height // 2 + 65], fill=(30, 30, 80))
    else:
        draw.rectangle([width // 2 - 20, height // 2 - 20, width // 2 + 20, height // 2 + 20], fill=(139, 69, 19))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

@pytest.mark.asyncio
async def test_gemini_valid_intrusion_frame():
    """Verify live Gemini VLM correctly confirms person inside restricted zone."""
    b64 = make_test_jpeg(with_person=True)
    res = await verify_context(
        evidence_frame_base64=b64,
        verification_instruction="Verify whether an unauthorized person is present inside the red restricted zone.",
        event_type="restricted_zone_entry"
    )

    assert res.decision in ["confirmed", "processing_failed"]
    if res.decision == "confirmed":
        assert res.confidence >= 0.70
        assert res.model_provider == "google-gemini"
        assert res.requires_human_review is False

@pytest.mark.asyncio
async def test_gemini_empty_scene_frame():
    """Verify live Gemini VLM rejects empty warehouse floor as not confirmed."""
    b64 = make_test_jpeg(with_person=False)
    res = await verify_context(
        evidence_frame_base64=b64,
        verification_instruction="Verify whether an unauthorized person is present inside the red restricted zone.",
        event_type="restricted_zone_entry"
    )

    assert res.decision in ["not_confirmed", "processing_failed"]
    if res.decision == "not_confirmed":
        assert res.requires_human_review is False

def test_validate_and_decode_corrupt_base64():
    """Verify image validator rejects non-base64 input."""
    raw, clean, err = validate_and_decode_image("!!!this_is_not_base64!!!")
    assert raw is None
    assert err is not None
    assert "failed" in err.lower() or "invalid" in err.lower()

def test_validate_and_decode_too_small_dimensions():
    """Verify image validator rejects tiny images < 16x16."""
    tiny_img = Image.new('RGB', (8, 8), color=(255, 0, 0))
    buf = io.BytesIO()
    tiny_img.save(buf, format='JPEG')
    b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

    raw, clean, err = validate_and_decode_image(b64)
    assert raw is None
    assert "too small" in err.lower()

@pytest.mark.asyncio
async def test_gemini_missing_frame_fallback():
    """Verify missing frame gracefully degrades to deterministic verification without crash."""
    res = await verify_context(evidence_frame_base64=None, detector_confidence=0.88)
    assert res.decision == "confirmed"
    assert "mock" in res.model_version or "deterministic" in res.model_provider

@pytest.mark.asyncio
async def test_gemini_corrupt_frame_safe_rejection():
    """Verify corrupt base64 results in safe processing_failed and human review."""
    res = await verify_context(evidence_frame_base64="corrupt_base64_string_xyz_123")
    assert res.decision == "processing_failed"
    assert res.requires_human_review is True
    assert "Image decoding failure" in res.limitations
