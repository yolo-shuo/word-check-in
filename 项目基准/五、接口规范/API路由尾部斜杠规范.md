# API 路由尾部斜杠规范

> 状态：已确认

## 目的
规范 API 路由路径的尾部斜杠使用规则，避免路由冲突。

## 适用范围
所有 API 路由和前端请求路径。

## 规范内容

### 规则
1. **统一不使用尾部斜杠**
2. 所有 API 路径以非 `/` 结尾
3. 路由定义和请求路径保持一致

### 正确示例
```tsx
// 路由定义
export const router = {
  user: {
    profile: protectedProcedure.query(...),  // 路径: /user/profile
  },
}

// 请求
const data = await trpc.user.profile.query()

// 前端路由
router.push('/feed')  // 正确
router.push('/feed/')  // 错误
```

### Next.js 路由
- 页面文件：`src/app/feed/page.tsx` → 路径 `/feed`（无尾部斜杠）
- 动态路由：`src/app/checkin/[id]/page.tsx` → 路径 `/checkin/123`

## 禁止事项
- 禁止在 API 路径末尾添加 `/`
- 禁止在路由跳转中使用尾部斜杠
- 禁止在同一路由同时注册带和不带斜杠的版本

## 关联规范
- [API设计规范.md](./API设计规范.md)

## 变更记录
| 日期 | 变更内容 | 修改人 |
|---|---|---|
| 2026-09-30 | 初始规范 | - |
