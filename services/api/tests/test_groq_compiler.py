import pytest
from services.api.app.services.compiler import (
    compile_prompt,
    rule_based_compile,
    sanitize_and_validate_workflow,
    ALLOWED_DETECTOR_CLASSES,
    ALLOWED_ACTION_TYPES
)
from services.api.app.config import settings

@pytest.mark.asyncio
async def test_groq_hindi_instruction_compilation():
    """Verify live Groq compiler on Hindi prompt."""
    prompt = "Raat 10 baje ke baad godown mein koi aadmi dikhe toh whatsapp alert bhejo"
    wf = await compile_prompt(prompt)

    assert wf.schema_version == "1.0"
    assert "person" in wf.trigger.classes
    assert wf.status == "needs_review"
    assert any(a.type == "whatsapp_message" for a in wf.actions)
    assert any("Compiler:" in a for a in wf.assumptions)
    if wf.trigger.schedule:
        assert wf.trigger.schedule.start in ["22:00", "20:00", "21:00"]

@pytest.mark.asyncio
async def test_groq_hinglish_instruction_compilation():
    """Verify live Groq compiler on Hinglish prompt with siren alert."""
    prompt = "Machinery bay area me koi bhi vehicle enter kare toh local siren bajao"
    wf = await compile_prompt(prompt)

    assert wf.schema_version == "1.0"
    assert any(c in ["vehicle", "car", "truck"] for c in wf.trigger.classes)
    assert wf.status == "needs_review"
    assert any(a.type in ["local_siren", "dashboard_alert"] for a in wf.actions)

@pytest.mark.asyncio
async def test_groq_english_instruction_compilation():
    """Verify live Groq compiler on English prompt with schedule window."""
    prompt = "Detect any unauthorized person inside warehouse bay between 8pm and 6am and send dashboard alert"
    wf = await compile_prompt(prompt)

    assert wf.schema_version == "1.0"
    assert "person" in wf.trigger.classes
    assert wf.status == "needs_review"
    assert any(a.type == "dashboard_alert" for a in wf.actions)

@pytest.mark.asyncio
async def test_groq_clarification_for_missing_zone_and_schedule():
    """Verify compiler generates clarification questions for unspecified zone or schedule."""
    prompt = "Notify me when someone moves"
    wf = await compile_prompt(prompt)

    assert wf.status == "needs_review"
    assert len(wf.clarification_questions) >= 1
    # Should ask about zone boundary or schedule window
    assert any("zone" in q.lower() or "schedule" in q.lower() or "hour" in q.lower() for q in wf.clarification_questions)

def test_compiler_allowlist_filtering():
    """Verify allowlists strictly strip unsupported classes and actions."""
    malicious_raw = {
        "schema_version": "1.0",
        "title": "Hack Attempt",
        "source_text": "testing allowlist",
        "status": "active",  # Should be overridden to needs_review
        "assumptions": [],
        "clarification_questions": [],
        "trigger": {
            "type": "unauthorized_trigger_hack",
            "classes": ["person", "unsupported_alien_entity"],
            "zone_id": "zone-1",
            "minimum_confidence": 0.55,
            "dwell_seconds": 1.5
        },
        "verification": {
            "type": "temporal_scene_check",
            "instruction": "Verify person",
            "evidence_window_seconds": 2.0,
            "human_review_required": False
        },
        "actions": [
            {"type": "unauthorized_weapon_fire", "enabled": True},
            {"type": "dashboard_alert", "enabled": True}
        ],
        "safety": {"cooldown_seconds": 60, "max_actions_per_hour": 5}
    }

    sanitized = sanitize_and_validate_workflow(
        malicious_raw,
        prompt="testing allowlist",
        provider_name="groq_cloud",
        model_name="qwen/qwen3.8-27b"
    )

    assert sanitized.status == "needs_review"
    assert "unsupported_alien_entity" not in sanitized.trigger.classes
    assert "person" in sanitized.trigger.classes
    assert sanitized.trigger.type == "object_in_zone"
    assert not any(a.type == "unauthorized_weapon_fire" for a in sanitized.actions)
    assert any(a.type == "dashboard_alert" for a in sanitized.actions)

def test_deterministic_fallback_audit_trail():
    """Verify rule-based fallback explicitly logs its provenance in assumptions."""
    wf = rule_based_compile(
        "Raat 10 baje ke baad godown check karo",
        fallback_reason="Groq provider rate limit exceeded"
    )
    assert wf.status == "needs_review"
    assert any("rule_based_fallback" in a for a in wf.assumptions)
    assert any("Groq provider rate limit" in a for a in wf.assumptions)
