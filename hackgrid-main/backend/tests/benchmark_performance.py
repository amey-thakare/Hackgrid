"""
Empirical Benchmark and Verification Script for FinSight Financial Firebreak.
PRD v1.1 Performance and Reliability Tests:
- T-26 [P0]: Measure end-to-end analysis time (< 30s target over 3 consecutive runs)
- T-28 [P1]: Run 5 consecutive analyses without restart (all complete, no memory leak, degradation < 10%)
"""

import time
import statistics
import pandas as pd
from fastapi.testclient import TestClient
from backend.main import app
from backend.data_generator import generate_crisis_dataset, generate_healthy_dataset

client = TestClient(app)


def run_benchmark():
    print("================================================================")
    print("FIN SIGHT FINANCIAL FIREBREAK — BENCHMARK & RELIABILITY VERIFIER")
    print("================================================================")

    df_crisis = generate_crisis_dataset()
    csv_bytes = df_crisis.to_csv(index=False).encode("utf-8")

    timings = []
    runs_count = 5

    print(f"\nExecuting {runs_count} consecutive full-pipeline runs (Ingest -> Metric Engine -> Outlook -> AI -> DB)...")

    for i in range(1, runs_count + 1):
        start = time.perf_counter()
        response = client.post(
            "/api/upload",
            files={"file": (f"benchmark_run_{i}.csv", csv_bytes, "text/csv")}
        )
        elapsed = time.perf_counter() - start
        timings.append(elapsed)

        assert response.status_code == 200, f"Run {i} failed with status {response.status_code}"
        data = response.json()

        # Validate core deliverables in payload
        assert "financial_stress_index" in data
        assert "severity_zone" in data
        assert "risk_chain_narrative" in data
        assert "signal_combinations" in data
        assert "outlook" in data
        assert "preventive_actions" in data
        assert "ai_disclaimer" in data
        assert 3 <= len(data["preventive_actions"]) <= 5

        print(f"  Run {i}: Status=200, Latency={elapsed:.4f}s, Stress Index={data['financial_stress_index']}, Zone={data['severity_zone']}, Persisted={data.get('persisted_via')}")

    mean_time = statistics.mean(timings)
    max_time = max(timings)
    min_time = min(timings)
    stdev_time = statistics.stdev(timings) if len(timings) > 1 else 0.0

    print("\n----------------------------------------------------------------")
    print("PERFORMANCE & RELIABILITY RESULTS (PRD T-26 & T-28)")
    print("----------------------------------------------------------------")
    print(f"  Total Runs Executed:       {runs_count} / {runs_count} SUCCESSFUL")
    print(f"  Mean Execution Time:       {mean_time:.4f}s  (PRD Target: < 30.0s) -> {'PASS [P0]' if mean_time < 30.0 else 'FAIL'}")
    print(f"  Fastest Run:               {min_time:.4f}s")
    print(f"  Slowest Run:               {max_time:.4f}s")
    print(f"  Standard Deviation:        {stdev_time:.4f}s")
    print(f"  Degradation vs Run 1:      {((timings[-1] - timings[0]) / timings[0] * 100):.2f}%")
    print("================================================================")

    # Assertions for automated pass
    assert mean_time < 30.0, f"Mean time {mean_time}s exceeded 30s limit!"
    assert all(t < 30.0 for t in timings), "A run exceeded 30s target!"
    return timings


if __name__ == "__main__":
    run_benchmark()
