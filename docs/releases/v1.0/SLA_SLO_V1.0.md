# SLA / SLO Baseline - V1.0

## 1. 目的

定义 `V1.0` 可用性与性能目标，作为发布准入、告警与回滚决策依据。

## 2. 指标对象

- 核心接口：`POST /api/v1/chat/completions`
- 健康接口：`GET /healthz`

## 3. SLI 定义

- 可用性 SLI：成功请求数 / 总请求数
- 延迟 SLI：`p95` 响应时间
- 错误率 SLI：5xx 请求占比

## 4. SLO 目标（V1.0 基线）

- 可用性：`>= 99.0%`（按月）
- `chat/completions` 延迟：`p95 <= 3000ms`（不含极端上游故障期）
- 5xx 错误率：`<= 1.0%`
- `healthz` 可用性：`>= 99.9%`

## 5. 告警建议阈值

- 连续 5 分钟可用性低于 `98%`：触发 P1
- 连续 5 分钟 `p95 > 5000ms`：触发 P1
- 连续 5 分钟 5xx 错误率 > `3%`：触发 P0
- `healthz` 连续失败：立即触发 P0

## 6. 错误预算

- 月度错误预算：`1.0%` 不可用窗口
- 当错误预算消耗 > `50%`：
  - 暂停非必要功能发布
  - 优先处理稳定性工作项

## 7. 发布准入规则

- 新版本发布前，上一观察窗口内 SLO 不得持续越线
- 若已越线，需先执行稳定性修复或风险豁免审批
- 发布后 30-60 分钟必须观察核心 SLI

## 8. 关联文档

- `docs/releases/v1.0/RELEASE_CHECKLIST_V1.0.md`
- `docs/releases/v1.0/ROLLBACK_PLAN_V1.0.md`
- `docs/releases/v1.0/OPERATIONS_RUNBOOK_V1.0.md`


