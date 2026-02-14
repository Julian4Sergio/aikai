from __future__ import annotations

import json
import time

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.api.v1.schemas import (
    ChatCompletionRequest,
    ErrorResponse,
    HealthResponse,
)
from app.core.errors import AppError
from app.modules.chat.service import generate_answer_stream

router = APIRouter()


@router.get("/healthz", response_model=HealthResponse)
async def healthz(request: Request) -> HealthResponse:
    return HealthResponse(status="ok", request_id=request.state.request_id)


@router.post(
    "/api/v1/chat/completions",
    responses={
        400: {"model": ErrorResponse},
        408: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def chat_completions(
    payload: ChatCompletionRequest, request: Request
) -> StreamingResponse:
    started = time.perf_counter()
    request_id = request.state.request_id

    def _to_sse(event: str, data: dict[str, object]) -> str:
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def event_stream():
        try:
            async for chunk in generate_answer_stream(
                payload.message,
                [item.model_dump() for item in payload.history],
            ):
                yield _to_sse("delta", {"content": chunk})

            latency_ms = int((time.perf_counter() - started) * 1000)
            yield _to_sse(
                "done",
                {"request_id": request_id, "latency_ms": latency_ms},
            )
        except AppError as exc:
            yield _to_sse(
                "error",
                {
                    "error_code": exc.error_code,
                    "error_message": exc.error_message,
                    "request_id": request_id,
                },
            )
        except Exception:
            yield _to_sse(
                "error",
                {
                    "error_code": "INTERNAL_ERROR",
                    "error_message": "unexpected internal error",
                    "request_id": request_id,
                },
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
