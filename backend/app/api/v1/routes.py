from __future__ import annotations

import time
from collections.abc import AsyncIterator
from json import dumps as json_dumps

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.api.v1.schemas import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatStreamRequest,
    ErrorResponse,
    HealthResponse,
)
from app.core.errors import AppError
from app.modules.chat.service import generate_answer, generate_answer_stream

router = APIRouter()


@router.get("/healthz", response_model=HealthResponse)
async def healthz(request: Request) -> HealthResponse:
    return HealthResponse(status="ok", request_id=request.state.request_id)


@router.post(
    "/api/v1/chat/completions",
    response_model=ChatCompletionResponse,
    responses={
        400: {"model": ErrorResponse},
        408: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def chat_completions(payload: ChatCompletionRequest, request: Request) -> ChatCompletionResponse:
    started = time.perf_counter()
    request_id = request.state.request_id
    request.state.tenant_id = payload.tenant_id
    request.state.edition = payload.edition.value

    try:
        answer = await generate_answer(payload.message)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("INTERNAL_ERROR", "unexpected internal error", 500) from exc

    latency_ms = int((time.perf_counter() - started) * 1000)
    return ChatCompletionResponse(
        answer=answer,
        request_id=request_id,
        latency_ms=latency_ms,
    )


@router.post(
    "/api/v1/chat/stream",
    responses={
        400: {"model": ErrorResponse},
        408: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def chat_stream(payload: ChatStreamRequest, request: Request) -> StreamingResponse:
    started = time.perf_counter()
    request_id = request.state.request_id
    request.state.tenant_id = payload.tenant_id
    request.state.edition = payload.edition.value
    request.state.is_stream = True

    history = [{"role": item.role.value, "content": item.content} for item in payload.history]

    async def stream_events() -> AsyncIterator[str]:
        sent_any_delta = False
        try:
            async for delta in generate_answer_stream(payload.message, history):
                if not sent_any_delta:
                    request.state.ttft_ms = int((time.perf_counter() - started) * 1000)
                    sent_any_delta = True

                if await request.is_disconnected():
                    request.state.cancelled = True
                    request.state.error_code = "CANCELLED"
                    return

                yield _to_sse_event(
                    "delta",
                    {"request_id": request_id, "delta": delta},
                )

            latency_ms = int((time.perf_counter() - started) * 1000)
            yield _to_sse_event(
                "done",
                {"request_id": request_id, "latency_ms": latency_ms},
            )
        except AppError as exc:
            request.state.error_code = exc.error_code
            yield _to_sse_event(
                "error",
                {
                    "request_id": request_id,
                    "error_code": exc.error_code,
                    "error_message": exc.error_message,
                },
            )
        except Exception:
            request.state.error_code = "INTERNAL_ERROR"
            yield _to_sse_event(
                "error",
                {
                    "request_id": request_id,
                    "error_code": "INTERNAL_ERROR",
                    "error_message": "unexpected internal error",
                },
            )

    return StreamingResponse(
        stream_events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _to_sse_event(event: str, payload: dict[str, object]) -> str:
    data = json_dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return f"event: {event}\ndata: {data}\n\n"
