# 社区单词打卡应用

面向 3-15 人熟人小圈子的学习记录工具。

## 快速开始

### Windows

```bash
# 双击运行 setup.bat
# 或手动执行：
pnpm install
pnpm prisma generate
docker compose up -d db redis
pnpm prisma migrate dev
pnpm prisma:seed
pnpm dev
```

### macOS / Linux

```bash
chmod +x setup.sh
./setup.sh
# 或手动执行：
pnpm install
pnpm prisma generate
docker compose up -d db redis
pnpm prisma migrate dev
pnpm prisma:seed
pnpm dev
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 App Router + Tailwind CSS |
| 通信 | tRPC v9 |
| ORM | Prisma 5 + PostgreSQL 15 |
| 缓存 | Redis 7 |
| 认证 | NextAuth v4 (credentials) + argon2 |
| 测试 | Vitest + Playwright |

## 项目结构

```
src/
├── app/              # Next.js App Router 页面
│   ├── (auth)/      # 登录/注册
│   ├── feed/        # 动态流
│   ├── checkin/     # 打卡
│   ├── stats/       # 统计
│   ├── vocab/       # 词库
│   ├── members/     # 成员管理
│   ├── settings/    # 设置
│   └── admin/       # 管理后台
├── server/          # 服务端
│   ├── routers/     # tRPC 路由（9个模块）
│   └── lib/         # 工具函数
├── components/      # React 组件
└── providers/       # Provider
prisma/
├── schema.prisma    # 数据库 Schema（15张表）
└── seed.ts          # 种子数据
```

## 数据库表

| 表 | 说明 |
|---|---|
| User | 用户 |
| Circle | 学习圈子 |
| CircleMember | 圈子成员 |
| Checkin | 打卡记录 |
| CheckinDraft | 打卡草稿 |
| CheckinEdit | 打卡修改历史 |
| Like | 点赞 |
| Comment | 评论 |
| Notification | 通知 |
| NotificationPreference | 通知偏好 |
| VocabVersion | 词库版本 |
| VocabEntry | 词库词条 |
| AuditLog | 审计日志 |
| WeeklySnapshot | 周榜快照 |
| Export | 数据导出记录 |

## 开发命令

```bash
pnpm dev              # 开发服务器
pnpm build            # 构建
pnpm start            # 生产启动
pnpm typecheck        # TypeScript 检查
pnpm test             # 运行测试
pnpm prisma:studio    # 数据库管理
pnpm prisma:seed      # 导入种子数据
```
