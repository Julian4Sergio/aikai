# 版本统一交付规范（V1.0 ~ V2.0）

## 1. 目的

统一每个版本的文档交付结构，确保每次迭代都输出同一套可评审、可验收、可回滚的材料。

## 2. 每个版本必须输出的同构文档

每个版本（如 `V1.1`、`V1.2`）都必须至少包含以下文档：

1. `Vx.y_DESIGN_BASELINE.md`
2. `Vx.y_EXECUTION_PLAN.md`
3. `API_CONTRACT_Vx.md`（或 `API_CONTRACT_Vx.y.md`，按变更范围选择）
4. `TEST_PLAN_Vx.y.md`
5. `RELEASE_CHECKLIST_Vx.y.md`
6. `ROLLBACK_PLAN_Vx.y.md`
7. `CHANGELOG_Vx.y.md`

运维与治理文档（建议在 `V1.0` 起逐步纳入，`V1.2` 起强制）：

8. `OPERATIONS_RUNBOOK_Vx.y.md`
9. `SECURITY_BASELINE_Vx.y.md`
10. `SLA_SLO_Vx.y.md`

说明：

- 如果某版本不变更 API，也必须在契约文档注明“无变更”并给出兼容性结论。
- 所有文档均需关联 `ROADMAP` 条目与验收标准。

## 3. 每个版本文档必须包含的固定章节

### 3.1 设计基线

- 版本目标
- In Scope / Out of Scope
- 架构约束与边界
- 验收标准

### 3.2 执行计划

- 任务分解（WBS）
- 里程碑节奏
- 风险与缓解
- 交付清单

### 3.3 API 契约

- 路径与版本
- 请求/响应模型
- 错误码
- 兼容性声明

### 3.4 测试计划

- 测试范围
- 用例矩阵
- 退出标准（Exit Criteria）
- 回归策略

### 3.5 发布与回滚

- 发布前检查项
- 发布步骤
- 回滚触发条件
- 回滚步骤与验证

## 4. 各版本“需要做到什么”总览

| 版本 | 核心目标 | 必做能力 | 验收关键词 |
|---|---|---|---|
| V1.0 | 单轮问答基线 | 单轮问答、基础页面/接口、日志 | 可提问可回答、本地可运行、有日志 |
| V1.1 | 稳定性与可运维 | 超时/重试、错误码优化、指标接入 | 超时可预测、错误标准化、延迟/错误率可观测 |
| V1.2 | 工程化基线 | 测试基线、多环境、CI 检查 | CI 稳定通过、`dev/staging` 可用、质量自动化 |
| V1.3 | 多轮问答 | 会话模型、上下文窗口 | 多轮连续对话、上下文注入正确 |
| V1.4 | 记忆与租户就绪 | 记忆抽象、租户边界、企业入口钩子 | 租户隔离字段到位、`edition` 能力入口可控 |
| V1.5 | 边界冻结 | 模块接口稳定、扩展点定稿 | 内部契约稳定完备、可平滑迈向 V2.0 |
| V2.0 | 能力升级 | RAG、MCP、外部 API 治理 | 回答可追溯、工具 Schema 调用、标准适配层接入 |

## 5. 文档命名与目录约定

- 统一放在 `docs/`
- 文件名采用大写版本号与下划线风格
- 模板来源：`docs/templates/VERSION_DOC_TEMPLATES.md`
- 示例：
  - `V1.1_DESIGN_BASELINE.md`
  - `V1.1_EXECUTION_PLAN.md`
  - `API_CONTRACT_V1.1.md`
  - `TEST_PLAN_V1.1.md`
  - `RELEASE_CHECKLIST_V1.1.md`
  - `ROLLBACK_PLAN_V1.1.md`
  - `CHANGELOG_V1.1.md`

## 6. 评审门禁（每个版本通用）

- 文档先于实现或至少与实现同步提交
- API 变更必须有契约与兼容性结论
- 测试计划必须覆盖主链路、异常链路、回归链路
- 发布前必须具备回滚文档与演练记录（至少一次）
- 文档索引（`docs/README.md`）必须更新

额外门禁（`V1.2` 起）：

- Runbook、Security、SLA/SLO 三份文档必须存在且与版本范围一致
- 发布检查清单必须引用当前版本 SLO 与安全基线

## 7. 与当前版本对齐情况

当前已完成：

- `V1.0_DESIGN_BASELINE.md`
- `V1.0_EXECUTION_PLAN.md`
- `API_CONTRACT_V1.md`
- `TEST_PLAN_V1.0.md`
- `OPERATIONS_RUNBOOK_V1.0.md`
- `SECURITY_BASELINE_V1.0.md`
- `SLA_SLO_V1.0.md`

当前状态说明：

- `V1.0` 核心 7 件套已补齐
- 运维治理 3 件套（Runbook/Security/SLA-SLO）已补齐
- 后续版本可直接按本文件同构生成

