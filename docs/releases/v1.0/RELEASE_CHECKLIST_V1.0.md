# Release Checklist - V1.0

## 1. 版本信息

- 版本：`V1.0`
- 发布目标：单轮问答基线可用并可观测
- 关联文档：
  - `docs/releases/v1.0/V1.0_DESIGN_BASELINE.md`
  - `docs/releases/v1.0/V1.0_EXECUTION_PLAN.md`
  - `docs/releases/v1.0/API_CONTRACT_V1.md`
  - `docs/releases/v1.0/TEST_PLAN_V1.0.md`

## 2. 发布前检查（Pre-Release）

- [ ] 范围与非范围与 `V1.0` 基线一致
- [ ] API 契约与实现一致（请求/响应/错误码）
- [ ] `POST /api/v1/chat/completions` 可用
- [ ] `GET /healthz` 可用
- [ ] 默认模式为 `edition=personal`
- [ ] 核心模型包含 `tenant_id`
- [ ] 请求链路输出结构化日志（含 `request_id`）
- [ ] 超时处理已启用
- [ ] 关键异常映射稳定错误码

## 3. 测试通过检查

- [ ] 单元测试通过（参数校验、错误码、超时）
- [ ] 集成测试通过（chat + healthz）
- [ ] 关键手工联调通过（输入、加载、成功、错误）
- [ ] P0 用例全部通过（参考 `docs/releases/v1.0/TEST_PLAN_V1.0.md`）

## 4. 兼容性与文档检查

- [ ] `V1` 契约无破坏性变更
- [ ] 文档索引已更新（`docs/README.md`）
- [ ] 发布说明与风险说明已更新
- [ ] 回滚文档可执行（`docs/releases/v1.0/ROLLBACK_PLAN_V1.0.md`）

## 5. 发布步骤（Go-Live）

1. 锁定发布版本与配置
2. 执行发布前冒烟测试（chat + healthz）
3. 发布到目标环境
4. 验证接口可用性与关键日志
5. 观察错误率与延迟窗口（首 30-60 分钟）
6. 记录发布结论（成功/回滚）

## 6. 发布后观察（Post-Release）

- [ ] 主链路成功率正常
- [ ] 错误码分布符合预期
- [ ] 响应延迟无显著劣化
- [ ] 无 Blocker/Critical 新缺陷

## 7. 发布结论模板

- 发布时间：
- 发布人：
- 版本：
- 结果：`Success | Rollback`
- 主要指标摘要：
- 问题与处置：


