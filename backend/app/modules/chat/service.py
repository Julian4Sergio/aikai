from __future__ import annotations

import asyncio


async def generate_mock_answer(message: str) -> str:
    lowered = message.lower()
    if "timeout" in lowered:
        await asyncio.sleep(20)

    await asyncio.sleep(0.8)
    return (
        f"你问的是：{message}\n\n"
        "这是本地 FastAPI 的模拟回答链路，当前未接入真实模型供应商。\n\n"
        "下一步可以替换 chat service 的实现，将当前 mock 输出改为真实 LLM 返回结果。"
    )
