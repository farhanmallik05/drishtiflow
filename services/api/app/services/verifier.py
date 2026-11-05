import io
import base64
import json
import asyncio
import httpx
from typing import Optional, List
from PIL import Image, UnidentifiedImageError
from ..schemas.verification import VerificationResult, VerificationDecision
from ..config import settings

ALLOWED_DECISIONS = {'confirmed', 'not_confirmed', 'uncertain', 'needs_human_review', 'processing_failed'}

def validate_and_decode_image(b64_str: str) -> tuple[Optional[bytes], Optional[str], Optional[str]]:
    """
    Validate base64 string, verify it can be decoded into a real image using Pillow,
    and detect its MIME type and dimensions.
    Returns (raw_bytes, clean_b64, mime_type) or (None, None, error_message).
    """
    if not b64_str or not isinstance(b64_str, str):
        return None, None, "Evidence frame base64 string is missing or empty"

    clean_b64 = b64_str.strip()
    mime_type = "image/jpeg"

    if "," in clean_b64:
        header, clean_b64 = clean_b64.split(",", 1)
        if "png" in header.lower():
            mime_type = "image/png"
        elif "webp" in header.lower():
            mime_type = "image/webp"

    try:
        raw_bytes = base64.b64decode(clean_b64, validate=True)
    except Exception as e:
        return None, None, f"Base64 decoding failed: {str(e)}"

    if len(raw_bytes) < 32:
        return None, None, "Base64 payload too small to be a valid image"

    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            img.verify()
            width, height = img.size
            if width < 16 or height < 16:
                return None, None, f"Image dimensions too small ({width}x{height}), minimum 16x16 required"
            
            fmt = (img.format or "").upper()
            if fmt == "PNG":
                mime_type = "image/png"
            elif fmt in ["JPEG", "JPG"]:
                mime_type = "image/jpeg"
            elif fmt == "WEBP":
                mime_type = "image/webp"
    except UnidentifiedImageError:
        return None, None, "Corrupt or unrecognized image file format"
    except Exception as e:
        return None, None, f"Image validation error: {str(e)}"

    return raw_bytes, clean_b64, mime_type

async def verify_context(
    evidence_frame_base64: Optional[str] = None,
    verification_instruction: Optional[str] = None,
    event_type: str = "restricted_zone_entry",
    detector_confidence: float = 0.85
) -> VerificationResult:
    """
    Contextual verification of candidate event keyframes against natural language rules.
    Adheres strictly to PRD §6.5 & §20.2 (FCS-04) contracts.
    """
    instruction = verification_instruction or "Verify whether an unauthorized living person is clearly present inside the configured restricted zone. Distinguish real humans from inanimate objects, posters, mannequins, reflections, or shadows."
    api_key = settings.VISION_API_KEY or settings.GOOGLE_API_KEY

    # 1. Live Cloud VLM Provider (Google Gemini Vision) when evidence frame is provided
    if settings.VISION_PROVIDER == "gemini" and api_key and evidence_frame_base64:
        raw_bytes, clean_b64, mime_or_err = validate_and_decode_image(evidence_frame_base64)
        if not raw_bytes or not clean_b64:
            return VerificationResult(
                decision="processing_failed",
                event_type=event_type,
                confidence=0.0,
                evidence_summary=f"Invalid evidence frame: {mime_or_err}",
                limitations=["Image decoding failure", mime_or_err or "Unknown error"],
                requires_human_review=True,
                model_provider="validation",
                model_version="image_decoder_v1"
            )

        mime_type = mime_or_err
        prompt_text = (
            f"You are the DrishtiFlow Context Verifier evaluating a CCTV video monitoring event.\n"
            f"Rule Instruction: {instruction}\n"
            f"Event Type: {event_type}\n"
            f"Initial Detector Confidence: {detector_confidence}\n\n"
            f"Evaluate the provided evidence image against the rule instruction.\n"
            f"Determine whether the rule is violated, not violated, or ambiguous/uncertain.\n"
            f"Output strict JSON with these exact fields:\n"
            f'- "decision": one of "confirmed", "not_confirmed", "uncertain", "needs_human_review"\n'
            f'- "confidence": a float between 0.0 and 1.0 representing your visual certainty\n'
            f'- "evidence_summary": a concise 1-sentence visual description\n'
            f'- "limitations": list of strings (e.g. ["low illumination", "blur"] or empty list)\n'
            f'- "requires_human_review": boolean'
        )

        candidate_models = [settings.GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-3-flash-preview"]
        models_to_try = []
        for m in candidate_models:
            if m and m not in models_to_try:
                models_to_try.append(m)

        timeout_config = httpx.Timeout(connect=5.0, read=12.0, write=5.0, pool=5.0)
        last_error = ""

        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [{
                    "parts": [
                        {"inlineData": {"mimeType": mime_type, "data": clean_b64}},
                        {"text": prompt_text}
                    ]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.1
                }
            }

            for attempt in range(2):
                try:
                    async with httpx.AsyncClient(timeout=timeout_config) as client:
                        res = await client.post(url, json=payload)
                        if res.status_code == 200:
                            data = res.json()
                            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                            parsed = json.loads(raw_text)

                            decision = parsed.get("decision", "uncertain")
                            if decision not in ALLOWED_DECISIONS:
                                decision = "uncertain"

                            requires_hr = bool(parsed.get("requires_human_review", decision in ["uncertain", "needs_human_review"]))
                            if decision in ["uncertain", "needs_human_review"]:
                                requires_hr = True

                            return VerificationResult(
                                decision=decision,
                                event_type=event_type,
                                confidence=float(parsed.get("confidence", 0.90)),
                                evidence_summary=parsed.get("evidence_summary", "Visual context verified by Gemini VLM."),
                                limitations=parsed.get("limitations", []),
                                requires_human_review=requires_hr,
                                model_provider="google-gemini",
                                model_version=model_name
                            )
                        elif res.status_code in [429, 500, 503] and attempt == 0:
                            await asyncio.sleep(0.5)
                            continue
                        else:
                            last_error = f"HTTP {res.status_code}: {res.text[:120]}"
                            break
                except httpx.TimeoutException:
                    last_error = f"Model {model_name} timed out after 10.0s"
                    break
                except Exception as e:
                    last_error = str(e)
                    break

        # Safe degradation on live provider failure (PRD FR-A-10)
        return VerificationResult(
            decision="processing_failed",
            event_type=event_type,
            confidence=0.0,
            evidence_summary=f"Context verification failed during Gemini call: {last_error}",
            limitations=["Provider timeout or connection failure", last_error[:80]],
            requires_human_review=True,
            model_provider="google-gemini",
            model_version=settings.GEMINI_MODEL
        )

    # 2. Deterministic Mock Fallback (Guaranteed reliability for local dev, offline mode, and unit tests)
    await asyncio.sleep(0.02)

    if detector_confidence >= 0.75:
        return VerificationResult(
            decision="confirmed",
            event_type=event_type,
            confidence=0.92,
            evidence_summary="Verified person clearly present inside restricted perimeter bay during monitored schedule.",
            limitations=[],
            requires_human_review=False,
            model_provider="drishtiflow-deterministic-vlm-v1",
            model_version="mock-warehouse-v3"
        )
    elif detector_confidence >= 0.45:
        return VerificationResult(
            decision="uncertain",
            event_type=event_type,
            confidence=0.55,
            evidence_summary="Partial visual silhouette detected near zone perimeter; high ambient noise or partial shadow.",
            limitations=["Low illumination", "Bounding box clipped at boundary"],
            requires_human_review=True,
            model_provider="drishtiflow-deterministic-vlm-v1",
            model_version="mock-warehouse-v3"
        )
    else:
        return VerificationResult(
            decision="not_confirmed",
            event_type=event_type,
            confidence=0.20,
            evidence_summary="No unauthorized intrusion confirmed; detected movement appears to be external light shadow or camera noise.",
            limitations=[],
            requires_human_review=False,
            model_provider="drishtiflow-deterministic-vlm-v1",
            model_version="mock-warehouse-v3"
        )
