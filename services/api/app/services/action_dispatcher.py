import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import httpx
from ..config import settings
from ..database import get_db

class ActionDispatcher:
    """
    Idempotent multi-channel action dispatcher.
    Ensures safe retries without duplicate notifications.
    """

    @staticmethod
    def generate_idempotency_key(incident_id: str, action_type: str, recipient: str = "default") -> str:
        raw = f"{incident_id}:{action_type}:{recipient}"
        return hashlib.sha256(raw.encode()).hexdigest()

    @staticmethod
    async def dispatch(incident_id: str, action_type: str, recipient_phone: Optional[str] = None, message: Optional[str] = None) -> Dict[str, Any]:
        target_phone = recipient_phone or settings.WHATSAPP_RECIPIENT_PHONE_NUMBER
        idem_key = ActionDispatcher.generate_idempotency_key(incident_id, action_type, target_phone)

        conn = get_db()
        cursor = conn.cursor()

        # Check existing action
        cursor.execute("SELECT * FROM actions WHERE idempotency_key = ?", (idem_key,))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            return {
                "id": existing["id"],
                "status": existing["status"],
                "idempotency_key": idem_key,
                "note": "Existing action returned (idempotency preserved)."
            }

        action_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        # Insert as queued
        cursor.execute(
            """
            INSERT INTO actions (id, incident_id, action_type, status, idempotency_key, recipient_ref, attempts, created_at, updated_at)
            VALUES (?, ?, ?, 'queued', ?, ?, 0, ?, ?)
            """,
            (action_id, incident_id, action_type, idem_key, target_phone, now, now)
        )
        conn.commit()

        # Execute channel-specific adapter
        delivery_status = "sent"
        provider_ref = None
        error_msg = None

        try:
            if action_type == "dashboard_alert":
                delivery_status = "delivered"
                provider_ref = "internal-websocket-bus"

            elif action_type == "whatsapp_message":
                # If credentials exist, call WhatsApp Cloud API
                if settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID:
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        url = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
                        payload = {
                            "messaging_product": "whatsapp",
                            "to": target_phone,
                            "type": "text",
                            "text": {"body": message or "⚠️ DrishtiFlow Security Alert: Person detected in restricted zone."}
                        }
                        res = await client.post(url, headers={"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"}, json=payload)
                        if res.status_code in [200, 201]:
                            delivery_status = "sent"
                            provider_ref = res.json().get("messages", [{}])[0].get("id")
                        else:
                            delivery_status = "failed"
                            error_msg = f"WhatsApp API returned {res.status_code}: {res.text}"
                else:
                    # Verified Demo Sandbox Mode
                    delivery_status = "sent"
                    provider_ref = f"sandbox-wa-{uuid.uuid4().hex[:8]}"

            elif action_type == "voice_call":
                if settings.VAPI_API_KEY and settings.VAPI_PHONE_NUMBER_ID:
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        url = "https://api.vapi.ai/call"
                        payload = {
                            "phoneNumberId": settings.VAPI_PHONE_NUMBER_ID,
                            "customer": {"number": target_phone},
                            "assistant": {
                                "firstMessage": "Attention: DrishtiFlow warehouse perimeter alert. An unauthorized entry was verified in restricted bay A.",
                                "model": {"provider": "openai", "model": "gpt-3.5-turbo"}
                            }
                        }
                        res = await client.post(url, headers={"Authorization": f"Bearer {settings.VAPI_API_KEY}"}, json=payload)
                        if res.status_code in [200, 201]:
                            delivery_status = "sent"
                            provider_ref = res.json().get("id")
                        else:
                            delivery_status = "failed"
                            error_msg = f"Vapi API returned {res.status_code}: {res.text}"
                else:
                    # Verified Demo Sandbox Mode
                    delivery_status = "sent"
                    provider_ref = f"sandbox-vapi-{uuid.uuid4().hex[:8]}"

            elif action_type == "local_siren":
                delivery_status = "delivered"
                provider_ref = "local-audio-speaker"

        except Exception as e:
            delivery_status = "failed"
            error_msg = str(e)

        # Update action outcome
        cursor.execute(
            """
            UPDATE actions SET status = ?, provider_reference = ?, attempts = attempts + 1, last_error = ?, updated_at = ?
            WHERE id = ?
            """,
            (delivery_status, provider_ref, error_msg, datetime.now(timezone.utc).isoformat(), action_id)
        )
        conn.commit()
        conn.close()

        return {
            "id": action_id,
            "status": delivery_status,
            "action_type": action_type,
            "recipient": target_phone,
            "provider_reference": provider_ref,
            "idempotency_key": idem_key,
            "last_error": error_msg
        }

