# Release Checklist - V1.1

## 1. 版本信息

- 版本：`V1.1`
- 发布策略：`V1.1.0`（体验底座）-> `V1.1.1`（会话增强）
- 主目标：体验提升（流式响应）
- 关联文档：
  - `docs/releases/v1.1/V1.1_DESIGN_BASELINE.md`
  - `docs/releases/v1.1/V1.1_EXECUTION_PLAN.md`
  - `docs/releases/v1.1/API_CONTRACT_V1.1.md`
  - `docs/releases/v1.1/TEST_PLAN_V1.1.md`

## 2. 发布前检查（Pre-Release）

- [ ] `V1.1` 范围与非范围一致
- [ ] 流式接口 `POST /api/v1/chat/stream` 可用
- [ ] 同步接口 `POST /api/v1/chat/completions` 兼容可用
- [ ] `GET /healthz` 可用
- [ ] 取消链路可用（前端取消 -> 后端中止）
- [ ] 日志字段齐全（含 `is_stream/ttft_ms/cancelled`）
- [ ] 错误码语义一致（含 `CANCELLED`）

## 3. 测试通过检查

- [ ] P0 测试通过（TC-101 ~ TC-106）
- [ ] `V1.0` 兼容回归通过
- [ ] 无 Blocker/Critical 缺陷
- [ ] `V1.1.1` 发布前 TC-107 通过

## 4. 兼容性与文档检查

- [ ] 无破坏性 API 变更
- [ ] 文档与实现一致
- [ ] 发布说明已更新
- [ ] 回滚方案可执行

## 5. 发布步骤（Go-Live）

1. 锁定版本与配置
2. 执行发布前冒烟（stream + completions + healthz）
3. 发布到目标环境
4. 验证流式首包与取消链路
5. 观察核心指标（首 30-60 分钟）
6. 记录发布结论

## 6. 发布后观察（Post-Release）

- [ ] 流式成功率稳定
- [ ] `TTFT` 达到预期改善
- [ ] 取消可控结束率稳定
- [ ] 同步路径无异常回归

## 7. 发布结论模板

- 发布时间：
- 发布人：
- 版本：
- 结果：`Success | Rollback`
- 指标摘要（TTFT/成功率/取消率）：
- 问题与处置：
