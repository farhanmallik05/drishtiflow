from fastapi.testclient import TestClient
from services.api.app.main import app

client = TestClient(app)

def test_vernacular_compile_hindi_prompt():
    prompt = "Raat 10 baje ke baad godown mein koi aaye toh alert karo"
    response = client.post("/api/v1/workflows/compile", json={"prompt": prompt})
    assert response.status_code == 200
    wf = response.json()
    assert wf["schema_version"] == "1.0"
    assert "person" in wf["trigger"]["classes"]
    assert wf["trigger"]["schedule"] is not None
    assert wf["trigger"]["schedule"]["start"] == "22:00"
    assert wf["status"] == "needs_review"
    assert len(wf["actions"]) >= 1

def test_vernacular_compile_english_prompt():
    prompt = "When any vehicle enters restricted machinery area after 8pm notify supervisor"
    response = client.post("/api/v1/workflows/compile", json={"prompt": prompt})
    assert response.status_code == 200
    wf = response.json()
    assert "vehicle" in wf["trigger"]["classes"]
    assert wf["trigger"]["schedule"]["start"] == "20:00"
