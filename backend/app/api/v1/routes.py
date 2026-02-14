from __future__ import annotations

import time

from fastapi import APIRouter, Request

from app.api.v1.schemas import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ErrorResponse,
    HealthResponse,
)
from app.core.errors import AppError
from app.modules.chat.service import generate_answer

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
