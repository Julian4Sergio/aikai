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


def test_chat_stream_success(monkeypatch):
    async def fake_generate_answer_stream(message: str, history=None):
        assert message == "你好"
        assert history == [{"role": "user", "content": "上一个问题"}]
        yield "这是"
        yield "流式回答"

    monkeypatch.setattr(
        "app.api.v1.routes.generate_answer_stream",
        fake_generate_answer_stream,
    )

    with client.stream(
        "POST",
        "/api/v1/chat/stream",
        json={
            "message": "你好",
            "tenant_id": "tenant_personal_default",
            "edition": "personal",
            "history": [{"role": "user", "content": "上一个问题"}],
        },
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        lines = [line for line in response.iter_lines() if line]

    text = "\n".join(lines)
    assert "event: delta" in text
    assert '"delta":"这是"' in text
    assert '"delta":"流式回答"' in text
    assert "event: done" in text


def test_chat_stream_error_event(monkeypatch):
    async def fake_generate_answer_stream(message: str, history=None):
        raise AppError("TIMEOUT", "request timed out", 408)
        yield  # pragma: no cover

    monkeypatch.setattr(
        "app.api.v1.routes.generate_answer_stream",
        fake_generate_answer_stream,
    )

    with client.stream(
        "POST",
        "/api/v1/chat/stream",
        json={
            "message": "你好",
            "tenant_id": "tenant_personal_default",
            "edition": "personal",
            "history": [],
        },
    ) as response:
        assert response.status_code == 200
        lines = [line for line in response.iter_lines() if line]

    text = "\n".join(lines)
    assert "event: error" in text
    assert '"error_code":"TIMEOUT"' in text


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
    assert "is_stream" in log_item
    assert "ttft_ms" in log_item
    assert "cancelled" in log_item
