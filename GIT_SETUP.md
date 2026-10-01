# Git 配置与备份恢复指南

> 本文件说明如何配置 Git、进行备份、以及代码丢失时的恢复方法。

---

## 1. 当前配置概览

| 配置项 | 值 |
|--------|-----|
| 本地仓库 | `D:\word-check-in` |
| 本地备份 | `D:\word-check-in-backup` (bare repo) |
| 远程仓库 | `https://github.com/Yolo/word-check-in.git` |
| Git 用户 | YOLO-Shuo / YOLO-Shuo@users.noreply.github.com |
| SSH 密钥 | `C:\Users\17167\.ssh\id_ed25519` |
| 自动备份 | Windows 计划任务 `WordCheckIn-AutoBackup`（每日 09:00） |
| post-commit hook | 自动推送到本地备份 + 尝试 GitHub |

---

## 2. Git 远程配置

### 2.1 查看当前远程

```bash
git remote -v
```

预期输出：

```
local-backup    file:///D:/word-check-in-backup (fetch)
local-backup    file:///D:/word-check-in-backup (push)
origin          https://github.com/Yolo/word-check-in.git (fetch)
origin          https://github.com/Yolo/word-check-in.git (push)
```

### 2.2 配置 GitHub SSH 密钥

SSH 密钥已生成，需要将其添加到 GitHub 账户：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHS+zvWJtdd11dnS4vahEp3F2+y4vblYYvd1HwdxxPtV YOLO-Shuo@users.noreply.github.com
```

**添加到 GitHub 的步骤：**

1. 打开 GitHub → Settings → SSH and GPG keys
2. 点击 "New SSH key"
3. Title: `word-check-in-backup-key`
4. Key type: Authentication & Signing
5. Key: 粘贴上面的公钥内容
6. 点击 "Add SSH key"

### 2.3 切换到 SSH 协议（推荐）

HTTPS 在中国大陆可能不稳定，推荐使用 SSH：

```bash
# 切换到 SSH
git remote set-url origin git@github.com:Yolo/word-check-in.git

# 或切回 HTTPS
git remote set-url origin https://github.com/Yolo/word-check-in.git
```

### 2.4 使用 Personal Access Token (HTTPS 备用)

如果不想用 SSH，可以生成 GitHub Token：

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 生成 Token（需要 `repo` 权限）
3. 推送时使用：

```bash
git push https://<TOKEN>@github.com/Yolo/word-check-in.git main
```

或配置凭据管理器：

```bash
git config --global credential.helper manager
# 然后 git push 会弹窗输入 Token
```

---

## 3. 日常开发工作流

### 3.1 基本流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 开发并提交（每次提交后自动备份）
git add .
git commit -m "feat: 你的变更描述"
# post-commit hook 会自动推送到备份

# 3. 网络可用时推送 GitHub
git push origin main
```

### 3.2 提交规范

遵循 Conventional Commits 格式：

```
feat: 新增功能
fix: 修复 Bug
refactor: 重构代码
docs: 更新文档
chore: 构建/工具配置变更
```

### 3.3 分支策略

```bash
# 主分支（生产）
main

# 开发分支
dev

# 功能分支（从 dev 创建）
git checkout -b feature/xxx dev
git checkout dev
git merge feature/xxx
```

---

## 4. 备份策略

### 4.1 自动备份（已配置）

| 备份方式 | 触发时机 | 目标 |
|----------|----------|------|
| post-commit hook | 每次 git commit | local-backup + origin(尽力) |
| Windows 计划任务 | 每日 09:00 | backup.bat 执行完整备份 |
| 手动备份 | 随时 | `backup.bat` |

### 4.2 手动备份

```bash
# 方式1: 运行备份脚本
D:\word-check-in\backup.bat

# 方式2: 手动推送
git push local-backup --all
git push origin main
```

### 4.3 备份内容

每次备份包含：
- ✅ 所有 Git 提交历史
- ✅ 所有分支（main, dev 等）
- ✅ 所有标签
- ✅ 工作区所有已提交文件

不包含（通过 .gitignore）：
- ❌ `.env*` 环境文件
- ❌ `node_modules/`
- ❌ `.next/` 构建产物
- ❌ `*.log` 日志文件
- ❌ `.acl-report/` 诊断报告

### 4.4 备份验证

```bash
# 检查本地备份是否最新
git log local-backup/main --oneline -5

# 检查远程是否最新（需要网络）
git log origin/main --oneline -5

# 检查备份仓库完整性
git fsck --no-dangling
```

---

## 5. 代码丢失恢复

### 5.1 场景 A: 本地文件丢失，但备份存在

```bash
# 从本地备份恢复
del /q D:\word-check-in  # 或 rd /s /q D:\word-check-in
git clone file:///D:/word-check-in-backup D:\word-check-in
```

### 5.2 场景 B: 本地和备份都丢失，从 GitHub 恢复

```bash
git clone https://github.com/Yolo/word-check-in.git D:\word-check-in
```

### 5.3 场景 C: 误删提交（找回丢失的提交）

```bash
# 查看最近的操作记录
git reflog

# 找回特定提交
git checkout <commit-hash>
# 或创建新分支
git checkout -b recovery <commit-hash>
```

### 5.4 场景 D: 工作区被覆盖（未提交改动丢失）

Git 无法恢复未提交的工作区改动。防范措施：

1. **勤提交** — 每完成一个小功能就提交一次
2. **IDE 本地历史** — VS Code / JetBrains 有本地历史功能
3. **备份脚本** — `backup.bat` 会先自动提交未提交的改动

### 5.5 使用恢复脚本

```bash
# 交互式恢复
D:\word-check-in\restore.bat
```

---

## 6. 故障排查

### 6.1 GitHub 连接失败

```bash
# 测试连接
ssh -T git@github.com

# 如果 HTTPS 失败，切换 SSH
git remote set-url origin git@github.com:Yolo/word-check-in.git
```

### 6.2 本地备份损坏

```bash
# 重建本地备份
git push local-backup --all --force
```

### 6.3 恢复计划任务

```bash
# 如果计划任务被删除
schtasks /create /tn "WordCheckIn-AutoBackup" /tr "D:\word-check-in\backup.bat" /sc daily /st 09:00 /f
```

### 6.4 恢复 post-commit hook

```bash
# 复制 hook 文件
copy "D:\word-check-in-backup\.git\hooks\post-commit" ".git\hooks\"
# 或直接参考本文档中的 hook 内容重新创建
```

---

## 7. 快速命令参考

| 操作 | 命令 |
|------|------|
| 查看状态 | `git status` |
| 提交变更 | `git add . && git commit -m "描述"` |
| 推送备份 | `git push local-backup --all` |
| 推送 GitHub | `git push origin main` |
| 拉取更新 | `git pull origin main` |
| 查看日志 | `git log --oneline --graph -20` |
| 查看所有分支 | `git branch -a` |
| 手动备份 | `backup.bat` |
| 恢复项目 | `restore.bat` |

---

## 8. 注意事项

1. **不要提交 `.env` 文件** — 敏感信息已被 `.gitignore` 排除
2. **不要使用 `git checkout .` 清空工作区** — 会丢失未提交的改动
3. **不要在 `main` 上直接开发** — 使用功能分支
4. **备份脚本不包含未提交的改动** — 请及时提交
5. **定期验证备份** — 每周至少检查一次备份完整性