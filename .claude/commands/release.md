# Release - 智能发布准备

准备 npm 发布：分析变更、判断版本级别、生成 changelog、更新版本号。

## 执行流程

1. **分析变更**

   - 读取 git diff（对比上次发布 tag 或 main 分支）
   - 识别哪些包有变更

2. **判断版本级别**
   对每个有变更的包，根据以下规则判断：

   - **major**：破坏性变更（API 删除、参数变更、行为改变）
   - **minor**：新增功能（新 API、新选项、新特性）
   - **patch**：bug 修复、文档更新、内部重构

3. **生成 changelog**

   - 在每个变更包目录下更新 `CHANGELOG.md`
   - 格式：`## [版本号] - 日期` + 变更列表

4. **更新版本号**

   - 直接修改各包 `package.json` 中的 `version` 字段

5. **输出审查摘要**
   - 列出所有变更包、版本变化、changelog 内容
   - 提示用户审查后执行 `pnpm run release`

## 指令

请按以下步骤执行：

### Step 1: 获取变更信息

```bash
# 获取最近的 tag（如果没有则用首次提交）
git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD

# 获取变更文件列表
git diff --name-only $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD -- packages/

# 获取详细 diff
git diff $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD -- packages/
```

### Step 2: 分析每个包的变更

对于 `packages/` 下每个有变更的包：

1. 读取当前 `package.json` 获取当前版本
2. 分析 diff 内容，判断变更级别
3. 生成 changelog 条目

### Step 3: 更新文件

对每个需要发布的包：

1. 更新 `package.json` 的 `version` 字段
2. 更新或创建 `CHANGELOG.md`

### Step 4: 输出审查摘要

输出格式：

```
## 发布准备完成

### 变更包列表

| 包名 | 当前版本 | 新版本 | 变更级别 |
|------|----------|--------|----------|
| @baichuan/xxx | 0.0.1 | 0.0.2 | patch |

### Changelog 预览

#### @baichuan/xxx (0.0.1 → 0.0.2)
- 修复了 xxx 问题
- 优化了 xxx 逻辑

---

请审查以上变更，确认无误后执行：
pnpm run release
```

## 注意事项

- 如果没有 git 历史或没有变更，提示用户
- 如果用户指定了包名，只处理指定的包
- changelog 使用中文描述
