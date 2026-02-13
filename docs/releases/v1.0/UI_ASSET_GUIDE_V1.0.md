# UI 资产整理规范 - V1.0

## 1. 现状结论

当前放置方式 `ui/v1.0/` 是正确方向。  
你已有两张图：

- `ui/v1.0/homepage.png`（1600x1280）
- `ui/v1.0/chat.png`（1600x1299）

按版本分目录，便于追溯和后续迭代对比。

## 2. 推荐目录结构

```text
ui/
  v1.0/
    source/            # 原始设计稿导出（Figma/Sketch 导出图）
    mockups/           # 视觉稿（当前两张图建议放这里）
    flows/             # 流程图或交互流
    specs/             # 标注稿、尺寸、间距、颜色变量
    README.md          # 本版本 UI 说明
```

## 3. 命名规范

- 使用小写 + 下划线，体现页面与状态：
  - `home_default.png`
  - `chat_default.png`
  - `chat_error.png`
  - `chat_loading.png`
- 如果同页多轮迭代，追加日期或序号：
  - `chat_default_2026-02-13.png`
  - `chat_default_v2.png`

## 4. UI 文档最小说明（每个版本）

`ui/vx.y/README.md` 建议包含：

- 设计目标（该版本要支持什么用户动作）
- 页面清单（文件名 + 用途）
- 关键交互状态（默认/加载/错误/空态）
- 与需求文档映射（对应 `docs/Vx.y_DESIGN_BASELINE.md` 章节）

## 5. 与研发文档的映射规则

- `docs/releases/v1.0/V1.0_DESIGN_BASELINE.md` 记录 UI 设计输入来源
- `docs/releases/v1.0/TEST_PLAN_V1.0.md` 覆盖 UI 状态测试点
- `docs/releases/v1.0/CHANGELOG_V1.0.md` 记录 UI 变更摘要

## 6. 对当前文件的建议调整

建议保留版本目录不变，并做轻量整理：

1. 新建 `ui/v1.0/mockups/`
2. 将 `chat.png`、`homepage.png` 移入 `mockups/`
3. 新建 `ui/v1.0/README.md`，说明页面用途和映射关系

如果你不想现在移动文件，也可先保持现状，在 `ui/v1.0/README.md` 记录映射即可。


