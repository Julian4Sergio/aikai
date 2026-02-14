from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.core.errors import AppError
from app.core.settings import SETTINGS


async def generate_answer(message: str, history: list[dict[str, str]] | None = None) -> str:
    chunks: list[str] = []
    async for chunk in generate_answer_stream(message, history):
        chunks.append(chunk)
    answer = "".join(chunks).strip()
    if not answer:
        raise AppError("INTERNAL_ERROR", "provider returned empty content", 500)
    return answer


async def generate_answer_stream(
    message: str, history: list[dict[str, str]] | None = None
) -> AsyncIterator[str]:
    provider = SETTINGS.llm_provider
    if provider == "siliconflow":
        async for chunk in _stream_with_chat_completions(
            provider_name="siliconflow",
            api_key=SETTINGS.siliconflow_api_key,
            base_url=SETTINGS.siliconflow_base_url,
            model=SETTINGS.siliconflow_model,
            system_prompt=SETTINGS.siliconflow_system_prompt,
            max_tokens=SETTINGS.siliconflow_max_tokens,
            message=message,
            history=history or [],
        ):
            yield chunk
        return
    if provider == "openai":
        async for chunk in _stream_with_chat_completions(
            provider_name="openai",
            api_key=SETTINGS.openai_api_key,
            base_url=SETTINGS.openai_base_url,
            model=SETTINGS.openai_model,
            system_prompt=SETTINGS.openai_system_prompt,
            max_tokens=SETTINGS.openai_max_tokens,
            message=message,
            history=history or [],
        ):
            yield chunk
        return

    raise AppError(
        "INTERNAL_ERROR",
        "LLM_PROVIDER must be one of: siliconflow, openai",
        500,
    )


async def _stream_with_chat_completions(
    *,
    provider_name: str,
    api_key: str,
    base_url: str,
    model: str,
    system_prompt: str,
    max_tokens: int,
    message: str,
    history: list[dict[str, str]],
) -> AsyncIterator[str]:
    if not api_key:
        raise AppError(
            "INTERNAL_ERROR",
            f"{provider_name.upper()}_API_KEY is not configured",
            500,
        )

    request_body: dict[str, Any] = {
        "model": model,
        "messages": _build_messages(system_prompt, history, message),
        "max_tokens": max_tokens,
        "stream": True,
    }
    endpoint = f"{base_url.rstrip('/')}/chat/completions"
    timeout_seconds = SETTINGS.request_timeout_ms / 1000
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            async with client.stream(
                "POST", endpoint, headers=headers, json=request_body
            ) as response:
                if response.status_code >= 400:
                    body = await response.aread()
                    raise AppError(
                        "INTERNAL_ERROR",
                        _extract_upstream_error_message_from_bytes(
                            response.status_code, body
                        ),
                        500,
                    )

                has_content = False
                async for line in response.aiter_lines():
                    delta = _extract_stream_delta(line)
                    if not delta:
                        continue
                    has_content = True
                    yield delta

                if not has_content:
                    raise AppError(
                        "INTERNAL_ERROR",
                        f"{provider_name} returned empty content",
                        500,
                    )
    except httpx.TimeoutException as exc:
        raise AppError("TIMEOUT", f"{provider_name} request timed out", 408) from exc
    except httpx.HTTPError as exc:
        raise AppError(
            "INTERNAL_ERROR",
            f"failed to connect to {provider_name}",
            500,
        ) from exc


def _extract_upstream_error_message_from_bytes(status_code: int, body: bytes) -> str:
    default_message = f"upstream request failed with status {status_code}"
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, ValueError):
        return default_message

    if not isinstance(payload, dict):
        return default_message

    error = payload.get("error")
    if isinstance(error, dict):
        message = error.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()
    return default_message


def _extract_stream_delta(line: str) -> str:
    if not line:
        return ""
    if not line.startswith("data:"):
        return ""

    raw_data = line[5:].strip()
    if not raw_data or raw_data == "[DONE]":
        return ""

    try:
        payload = json.loads(raw_data)
    except ValueError:
        return ""

    if not isinstance(payload, dict):
        return ""

    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""

    first = choices[0]
    if not isinstance(first, dict):
        return ""

    delta = first.get("delta")
    if isinstance(delta, dict):
        content = delta.get("content")
        if isinstance(content, str):
            return content
    return ""

def _build_messages(
    system_prompt: str,
    history: list[dict[str, str]],
    latest_user_message: str,
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for item in history:
        role = item.get("role", "").strip()
        content = item.get("content", "").strip()
        if role not in {"user", "assistant"}:
            continue
        if not content:
            continue
        messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": latest_user_message})
    return messages
