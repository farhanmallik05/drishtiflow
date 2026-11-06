import pytest

from services.api.app.config import settings


@pytest.fixture(autouse=True)
def isolate_external_providers_for_unit_tests(monkeypatch, request):
    """Keep ordinary tests offline; marked integration tests opt into real providers."""
    if request.node.get_closest_marker("integration"):
        return

    monkeypatch.setattr(settings, "GROQ_API_KEY", "")
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "")
    monkeypatch.setattr(settings, "VISION_API_KEY", "")
    monkeypatch.setattr(settings, "WORKFLOW_COMPILER_API_KEY", "")
    monkeypatch.setattr(settings, "WORKFLOW_COMPILER_PROVIDER", "mock")
    monkeypatch.setattr(settings, "VISION_PROVIDER", "mock")
