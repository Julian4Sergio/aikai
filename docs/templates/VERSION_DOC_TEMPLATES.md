# 版本文档模板库（Vx.y）

## 1. 使用方式

1. 确定版本号（如 `V1.1`）
2. 按本文件复制对应模板并重命名
3. 填写占位符：`<VERSION>`、`<DATE>`、`<OWNER>`、`<SCOPE>`
4. 更新 `docs/README.md` 索引

---

## 2. `Vx.y_DESIGN_BASELINE.md` 模板

```md
# <VERSION> 设计基线（Scope Freeze）

## 1. 版本目标
## 2. In Scope
## 3. Out of Scope
## 4. 架构约束与边界
## 5. 接口影响（如有）
## 6. 数据模型影响（如有）
## 7. 验收标准
## 8. 风险与缓解
## 9. 追踪来源文档
```

## 3. `Vx.y_EXECUTION_PLAN.md` 模板

```md
# <VERSION> 执行计划

## 1. 目标
## 2. 执行顺序
## 3. 工作分解（WBS）
## 4. 里程碑与时间安排
## 5. 依赖与阻塞项
## 6. 风险与缓解
## 7. 交付物清单
```

## 4. `API_CONTRACT_Vx(.y).md` 模板

```md
# API Contract - <VERSION>

## 1. 版本与兼容性声明
## 2. 公共约定（Headers/Auth/Request-Id）
## 3. 接口清单
## 4. 请求模型
## 5. 响应模型
## 6. 错误码定义
## 7. 变更记录（相对上一版本）
## 8. 示例请求与响应
```

## 5. `TEST_PLAN_Vx.y.md` 模板

```md
# Test Plan - <VERSION>

## 1. 测试目标
## 2. 测试范围（In Scope / Out of Scope）
## 3. 环境与前置条件
## 4. 测试分层（单元/集成/E2E）
## 5. 用例矩阵
## 6. 退出标准（Exit Criteria）
## 7. 回归策略
## 8. 测试交付物
```

## 6. `RELEASE_CHECKLIST_Vx.y.md` 模板

```md
# Release Checklist - <VERSION>

## 1. 版本信息
## 2. 发布前检查（Pre-Release）
## 3. 测试通过检查
## 4. 配置与依赖检查
## 5. 发布步骤（Go-Live）
## 6. 发布后观察（Post-Release）
## 7. 发布结论记录
```

## 7. `ROLLBACK_PLAN_Vx.y.md` 模板

```md
# Rollback Plan - <VERSION>

## 1. 目的
## 2. 触发条件
## 3. 回滚范围
## 4. 回滚前确认
## 5. 执行步骤
## 6. 回滚后验证清单
## 7. 失败兜底策略
## 8. 事件记录模板
```

## 8. `CHANGELOG_Vx.y.md` 模板

```md
# Changelog - <VERSION>

## 版本概览
## Added
## Changed
## Fixed
## Removed
## 兼容性说明
## 已知限制
## 关联文档
```

## 9. `OPERATIONS_RUNBOOK_Vx.y.md` 模板

```md
# Operations Runbook - <VERSION>

## 1. 目标
## 2. 值班与响应等级
## 3. 关键服务清单
## 4. 故障处理总流程
## 5. 快速诊断清单
## 6. 常见故障场景与处置
## 7. 升级与通知规则
## 8. 复盘模板
```

## 10. `SECURITY_BASELINE_Vx.y.md` 模板

```md
# Security Baseline - <VERSION>

## 1. 安全目标
## 2. 数据分级与处理原则
## 3. 密钥与凭据管理
## 4. 访问控制与权限模型
## 5. API 安全基线
## 6. 日志脱敏与隐私策略
## 7. 依赖与供应链安全
## 8. 发布安全门禁
## 9. 安全事件响应流程
```

## 11. `SLA_SLO_Vx.y.md` 模板

```md
# SLA / SLO - <VERSION>

## 1. 目标与对象
## 2. SLI 定义
## 3. SLO 目标
## 4. 告警阈值
## 5. 错误预算
## 6. 发布准入规则
## 7. 与回滚策略联动
## 8. 关联文档
```

## 12. 建议命名示例

- `V1.1_DESIGN_BASELINE.md`
- `V1.1_EXECUTION_PLAN.md`
- `API_CONTRACT_V1.1.md`
- `TEST_PLAN_V1.1.md`
- `RELEASE_CHECKLIST_V1.1.md`
- `ROLLBACK_PLAN_V1.1.md`
- `CHANGELOG_V1.1.md`
- `OPERATIONS_RUNBOOK_V1.1.md`
- `SECURITY_BASELINE_V1.1.md`
- `SLA_SLO_V1.1.md`

