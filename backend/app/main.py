from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.routes import router as v1_router
from app.api.v1.schemas import ErrorResponse
from app.core.errors import AppError
from app.core.settings import SETTINGS

app = FastAPI(title=SETTINGS.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(SETTINGS.cors_allow_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-Id", f"req_{uuid4().hex[:12]}")
    request.state.request_id = request_id
    request.state.started_at = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        _log_request(request, status_code=500, error_code="INTERNAL_ERROR")
        raise

    response.headers["X-Request-Id"] = request_id
    _log_request(
        request,
        status_code=response.status_code,
        error_code=getattr(request.state, "error_code", None),
    )
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    request.state.error_code = exc.error_code
    body = ErrorResponse(
        error_code=exc.error_code,
        error_message=exc.error_message,
        request_id=request.state.request_id,
    )
    return JSONResponse(status_code=exc.status_code, content=body.model_dump())


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    first_err = exc.errors()[0] if exc.errors() else {}
    message = first_err.get("msg", "invalid request")
    body = ErrorResponse(
        error_code="INVALID_ARGUMENT",
        error_message=message,
        request_id=request.state.request_id,
    )
    request.state.error_code = "INVALID_ARGUMENT"
    return JSONResponse(status_code=400, content=body.model_dump())


app.include_router(v1_router)


def _log_request(request: Request, status_code: int, error_code: str | None = None) -> None:
    started_at = getattr(request.state, "started_at", None)
    latency_ms = int((time.perf_counter() - started_at) * 1000) if started_at else None
    log_item = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": "INFO" if status_code < 500 else "ERROR",
        "request_id": getattr(request.state, "request_id", None),
        "path": request.url.path,
        "method": request.method,
        "tenant_id": getattr(request.state, "tenant_id", None),
        "edition": getattr(request.state, "edition", None),
        "is_stream": getattr(request.state, "is_stream", False),
        "ttft_ms": getattr(request.state, "ttft_ms", None),
        "cancelled": getattr(request.state, "cancelled", False),
        "latency_ms": latency_ms,
        "status_code": status_code,
        "error_code": error_code,
    }
    print(json.dumps(log_item, ensure_ascii=False))
