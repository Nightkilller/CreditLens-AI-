import sys
from pathlib import Path

# Add backend folder to python path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

def run_tests():
    print("=" * 70)
    print("  CreditLens AI — End-to-End API Integration Test")
    print("=" * 70)

    # Use 'with' context manager to trigger lifespan events (model loading, database seeding)
    with TestClient(app) as client:
        # 1. Test health endpoint
        print("\n[1/5] Testing health check...")
        response = client.get("/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        health_data = response.json()
        print(f"  ✅ Health: {health_data}")
        assert health_data["status"] == "healthy"
        assert health_data["ml_model_loaded"] is True

        # 2. Test authentication (login with demo credentials)
        print("\n[2/5] Testing authentication...")
        login_data = {
            "email": settings.demo_email,
            "password": settings.demo_password
        }
        response = client.post("/api/auth/login", json=login_data)
        assert response.status_code == 200, f"Login failed: {response.text}"
        token_data = response.json()
        print("  ✅ Login successful")
        token = token_data["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Test listing MSMEs (checking seeded data)
        print("\n[3/5] Testing MSME list...")
        response = client.get("/api/msmes", headers=headers)
        assert response.status_code == 200, f"List failed: {response.text}"
        list_data = response.json()
        msmes = list_data["msmes"]
        print(f"  ✅ MSMEs count fetched: {len(msmes)}")
        assert len(msmes) > 0, "No MSMEs found in database (seeding failed)"
        sample_msme = msmes[0]
        print(f"  Sample MSME: {sample_msme['business_name']} ({sample_msme['msme_id']})")

        # 4. Test generating credit score
        print("\n[4/5] Testing credit score generation...")
        msme_id = sample_msme["msme_id"]
        response = client.post(f"/api/score/{msme_id}", headers=headers)
        assert response.status_code == 200, f"Scoring failed: {response.text}"
        score_data = response.json()
        print(f"  ✅ Score generated successfully:")
        print(f"     Overall Score: {score_data['overall_score']}")
        print(f"     Risk Tier: {score_data['risk_tier']['label']} ({score_data['risk_tier']['color']})")
        print(f"     Top Factors: {len(score_data['top_factors'])} factors computed")
        for f in score_data['top_factors'][:3]:
            print(f"       - {f['feature']}: direction={f['direction']}, impact={f['impact']}")

        # 5. Test score history
        print("\n[5/5] Testing score history...")
        response = client.get(f"/api/score/{msme_id}/history", headers=headers)
        assert response.status_code == 200, f"History failed: {response.text}"
        history_data = response.json()
        history = history_data["history"]
        print(f"  ✅ History fetched successfully: {len(history)} records")
        assert len(history) > 0, "No score history recorded"
        print(f"     Latest historical score: {history[0]['overall_score']}")

    print("\n" + "=" * 70)
    print("  ✅ All Integration Tests Passed Successfully!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_tests()
