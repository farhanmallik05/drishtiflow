from datetime import datetime, timezone, timedelta
import zoneinfo
from typing import Tuple, Optional
from ..schemas.workflow import WorkflowDefinition, ActionItem
from ..schemas.verification import VerificationResult
from ..database import get_db

class PolicyEngine:
    """
    Deterministic policy evaluator ensuring AI suggestions are safely governed.
    Enforces schedule windows, cooldown suppression, and hourly rate limits.
    """

    @staticmethod
    def is_schedule_active(workflow: Optional[WorkflowDefinition], current_dt: Optional[datetime] = None) -> bool:
        if not workflow or not workflow.trigger.schedule:
            return True # No schedule restriction means 24/7 active
        
        schedule = workflow.trigger.schedule
        tz_name = schedule.timezone or "Asia/Kolkata"
        try:
            tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            tz = timezone.utc

        now = current_dt or datetime.now(tz)
        current_time_str = now.strftime("%H:%M")
        
        # Check day
        day_map = {0: 'mon', 1: 'tue', 2: 'wed', 3: 'thu', 4: 'fri', 5: 'sat', 6: 'sun'}
        current_day = day_map[now.weekday()]
        if current_day not in schedule.days:
            return False

        start = schedule.start
        end = schedule.end

        # Handle overnight schedules (e.g. 22:00 to 06:00)
        if start > end:
            return current_time_str >= start or current_time_str <= end
        else:
            return start <= current_time_str <= end

    @staticmethod
    def evaluate(
        incident_id: str,
        camera_id: str,
        verification: VerificationResult,
        workflow: Optional[WorkflowDefinition] = None
    ) -> Tuple[bool, str, list[str]]:
        """
        Returns (allowed: bool, reason: str, permitted_action_types: list[str])
        """
        # 1. Verification Decision Guard
        if verification.decision != "confirmed":
            return False, f"Suppressed: Verification status is '{verification.decision}', not confirmed.", []

        # 2. Schedule Check
        if not PolicyEngine.is_schedule_active(workflow):
            return False, "Suppressed: Current time is outside configured active schedule.", []

        cooldown_seconds = workflow.safety.cooldown_seconds if workflow else 60
        max_per_hour = workflow.safety.max_actions_per_hour if workflow else 5

        conn = get_db()
        cursor = conn.cursor()

        # 3. Cooldown Suppression Check (within last N seconds for this camera)
        cursor.execute(
            """
            SELECT occurred_at FROM incidents
            WHERE camera_id = ? AND status in ('action_sent', 'confirmed') AND id != ?
            ORDER BY occurred_at DESC LIMIT 1
            """,
            (camera_id, incident_id)
        )
        last_incident = cursor.fetchone()
        if last_incident:
            try:
                last_time = datetime.fromisoformat(last_incident["occurred_at"])
                delta = (datetime.now(timezone.utc) - last_time.replace(tzinfo=timezone.utc)).total_seconds()
                if delta < cooldown_seconds:
                    conn.close()
                    return False, f"Suppressed by Cooldown: {int(delta)}s since previous incident (< {cooldown_seconds}s limit).", []
            except Exception:
                pass

        # 4. Hourly Rate Limit Check (scoped to camera)
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        cursor.execute(
            """
            SELECT COUNT(*) as count FROM actions a
            JOIN incidents i ON a.incident_id = i.id
            WHERE i.camera_id = ? AND a.status in ('sent', 'delivered') AND a.created_at >= ?
            """,
            (camera_id, cutoff)
        )
        actions_last_hour = cursor.fetchone()["count"]
        if actions_last_hour >= max_per_hour:
            conn.close()
            return False, f"Suppressed by Rate Limit: Reached {actions_last_hour}/{max_per_hour} actions per hour.", []

        conn.close()

        # Permitted action types based on workflow config
        permitted_actions = ["dashboard_alert"]
        if workflow:
            for act in workflow.actions:
                if act.enabled and act.type not in permitted_actions:
                    permitted_actions.append(act.type)

        return True, "Policy approved for execution.", permitted_actions

