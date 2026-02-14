from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.core.errors import AppError
from app.main import app


client = TestClient(app)


def test_healthz_ok():
    response = client.get("/healthz")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["request_id"].startswith("req_")


def test_chat_completions_success(monkeypatch):
    async def fake_generate_answer(message: str) -> str:
        assert message == "你好"
        return "这是回答"

    monkeypatch.setattr("app.api.v1.routes.generate_answer", fake_generate_answer)

    response = client.post(
        "/api/v1/chat/completions",
        json={
            "message": "你好",
            "tenant_id": "tenant_personal_default",
            "edition": "personal",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "这是回答"
    assert body["request_id"].startswith("req_")
    assert isinstance(body["latency_ms"], int)


def test_chat_completions_invalid_argument():
    response = client.post(
        "/api/v1/chat/completions",
        json={"tenant_id": "tenant_personal_default", "edition": "personal"},
    )
    assert response.status_code == 400
    body = response.json()
    assert body["error_code"] == "INVALID_ARGUMENT"
    assert body["request_id"].startswith("req_")


def test_chat_completions_timeout(monkeypatch):
    async def fake_generate_answer(message: str) -> str:
        raise AppError("TIMEOUT", "request timed out", 408)

    monkeypatch.setattr("app.api.v1.routes.generate_answer", fake_generate_answer)

    response = client.post(
        "/api/v1/chat/completions",
        json={
            "message": "你好",
            "tenant_id": "tenant_personal_default",
            "edition": "personal",
        },
    )
    assert response.status_code == 408
    body = response.json()
    assert body["error_code"] == "TIMEOUT"
    assert body["request_id"].startswith("req_")


def test_chat_completions_internal_error(monkeypatch):
    async def fake_generate_answer(message: str) -> str:
        raise RuntimeError("boom")

    monkeypatch.setattr("app.api.v1.routes.generate_answer", fake_generate_answer)

    response = client.post(
        "/api/v1/chat/completions",
        json={
            "message": "你好",
            "tenant_id": "tenant_personal_default",
            "edition": "personal",
        },
    )
    assert response.status_code == 500
    body = response.json()
    assert body["error_code"] == "INTERNAL_ERROR"
    assert body["request_id"].startswith("req_")


def test_log_contains_required_fields(capsys):
    response = client.get("/healthz")
    assert response.status_code == 200

    out = capsys.readouterr().out.strip().splitlines()
    assert out
    log_item = json.loads(out[-1])

    assert "request_id" in log_item
    assert "path" in log_item
    assert "status_code" in log_item
    assert "latency_ms" in log_item
