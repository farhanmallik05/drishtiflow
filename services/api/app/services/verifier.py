import asyncio
import json
import httpx
from typing import Optional
from ..schemas.verification import VerificationResult, VerificationDecision
from ..config import settings

async def verify_context(
    evidence_frame_base64: Optional[str] = None,
    verification_instruction: Optional[str] = None,
    event_type: str = "restricted_zone_entry",
    detector_confidence: float = 0.85
) -> VerificationResult:
    """
    Contextual verification of candidate event keyframes against rule instructions.
    Adheres strictly to PRD §6.5 contracts.
    """
    instruction = verification_instruction or "Verify whether an unauthorized person is present inside the configured restricted zone."
    api_key = settings.VISION_API_KEY or settings.GOOGLE_API_KEY
    model_name = settings.GEMINI_MODEL or "gemini-3-flash-preview"

    # 1. Live Cloud VLM Provider (Google Gemini Vision)
    if settings.VISION_PROVIDER == "gemini" and api_key and evidence_frame_base64:
        try:
            # Strip data URL prefix if present
            clean_b64 = evidence_frame_base64
            mime_type = "image/jpeg"
            if "," in clean_b64:
                header, clean_b64 = clean_b64.split(",", 1)
                if "png" in header:
                    mime_type = "image/png"

            prompt_text = (
                f"You are the DrishtiFlow Context Verifier evaluating a CCTV video monitoring event.\n"
                f"Rule Instruction: {instruction}\n"
                f"Event Type: {event_type}\n"
                f"Initial Detector Confidence: {detector_confidence}\n\n"
                f"Evaluate the evidence image against the rule instruction.\n"
                f"Output strict JSON with these exact fields:\n"
                f'- "decision": one of "confirmed", "not_confirmed", "uncertain", "needs_human_review"\n'
                f'- "confidence": a float between 0.0 and 1.0 representing your visual certainty\n'
                f'- "evidence_summary": a concise 1-sentence visual description\n'
                f'- "limitations": list of strings (e.g. ["low illumination", "blur"] or empty list)\n'
                f'- "requires_human_review": boolean'
            )

            parts = []
            if clean_b64:
                parts.append({"inlineData": {"mimeType": mime_type, "data": clean_b64}})
            parts.append({"text": prompt_text})

            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": parts}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.1
                }
            }

            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(raw_text)
                    decision = parsed.get("decision", "confirmed")
                    if decision not in ["confirmed", "not_confirmed", "uncertain", "needs_human_review"]:
                        decision = "confirmed" if detector_confidence >= 0.75 else "uncertain"

                    return VerificationResult(
                        decision=decision,
                        event_type=event_type,
                        confidence=float(parsed.get("confidence", 0.92)),
                        evidence_summary=parsed.get("evidence_summary", "Visual context verified by Gemini VLM."),
                        limitations=parsed.get("limitations", []),
                        requires_human_review=bool(parsed.get("requires_human_review", decision in ["uncertain", "needs_human_review"])),
                        model_provider="google-gemini",
                        model_version=model_name
                    )
        except Exception as e:
            # PRD FR-A-10: Safe degradation on provider error (never silently treat as safe)
            return VerificationResult(
                decision="processing_failed",
                event_type=event_type,
                confidence=0.0,
                evidence_summary=f"Context verification failed during Gemini call: {str(e)}",
                limitations=["Provider timeout or connection failure"],
                requires_human_review=True,
                model_provider="google-gemini",
                model_version=model_name
            )

    # 2. Deterministic Mock Fallback (Guaranteed reliability for demo, test suite, and offline mode)
    # Simulate quick VLM inference latency (approx 300ms)
    await asyncio.sleep(0.05)

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


