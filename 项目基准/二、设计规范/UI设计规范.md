# UI 设计规范

> 状态：已确认

## 目的
统一项目的视觉风格和交互风格，确保用户体验一致。

## 适用范围
所有页面和组件的 UI 开发。

## 规范内容

### 色彩系统

| 用途 | 色值 | Tailwind 类 |
|---|---|---|
| 主色 | `#3b82f6` (Blue-500) | `bg-blue-500` |
| 辅助色 | `#10b981` (Emerald-500) | `bg-emerald-500` |
| 危险色 | `#ef4444` (Red-500) | `bg-red-500` |
| 警告色 | `#f59e0b` (Amber-500) | `bg-amber-500` |
| 成功色 | `#22c55e` (Green-500) | `bg-green-500` |
| 文字主色 | `#1f2937` (Gray-800) | `text-gray-800` |
| 文字辅助色 | `#6b7280` (Gray-500) | `text-gray-500` |
| 背景色 | `#ffffff` | `bg-white` |
| 边框色 | `#e5e7eb` (Gray-200) | `border-gray-200` |

### 间距系统
- 使用 Tailwind 默认间距：`p-2`(8px), `p-4`(16px), `p-6`(24px), `p-8`(32px)
- 卡片内边距：`p-4`
- 页面内边距：`px-4 py-6`
- 元素间距：`gap-2` / `gap-4`

### 字体大小
- 页面标题：`text-2xl font-bold`
- 卡片标题：`text-lg font-semibold`
- 正文：`text-sm`
- 辅助文字：`text-xs text-gray-500`

### 圆角
- 按钮/输入框：`rounded-md` (4px)
- 卡片：`rounded-lg` (8px)
- 头像：`rounded-full`
- 标签：`rounded-full`

### 阴影
- 卡片：`shadow-sm`
- 下拉菜单/弹窗：`shadow-lg`

### 按钮规范
- 主要按钮：`bg-blue-500 text-white hover:bg-blue-600`
- 次要按钮：`bg-gray-100 text-gray-800 hover:bg-gray-200`
- 危险按钮：`bg-red-500 text-white hover:bg-red-600`
- 禁用状态：`opacity-50 cursor-not-allowed`

## 示例
```tsx
// 正确：使用 Tailwind 类
<button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
  提交
</button>

// 错误：内联样式
<button style={{ padding: "8px 16px", backgroundColor: "blue" }}>提交</button>
```

## 禁止事项
- 禁止使用内联 style 定义样式（除动态计算值外）
- 禁止硬编码色值
- 禁止使用非 Tailwind 的 CSS 类
- 禁止在组件内定义自定义颜色变量

## 关联规范
- [主题与暗色模式规范.md](./主题与暗色模式规范.md)
- [动画规范.md](./动画规范.md)
- [响应式布局规范.md](./响应式布局规范.md)

## 变更记录
| 日期 | 变更内容 | 修改人 |
|---|---|---|
| 2026-09-30 | 初始规范 | - |
