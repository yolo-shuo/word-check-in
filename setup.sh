#!/bin/bash
# ============================================
#  单词打卡应用 - Linux/macOS 安装脚本
# ============================================

echo ""
echo "============================================"
echo "  单词打卡应用 - 安装脚本"
echo "============================================"
echo ""

# 检查 Node.js
echo "[1/6] 检查 Node.js..."
if ! command -v node &> /dev/null; then
  echo "错误: 请先安装 Node.js 18+"
  echo "下载地址: https://nodejs.org/"
  exit 1
fi
echo "Node.js 版本: $(node --version)"
echo ""

# 检查 pnpm
echo "[2/6] 检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "未找到 pnpm，正在安装..."
  corepack enable
  corepack prepare pnpm@latest --activate
fi
echo "pnpm 版本: $(pnpm --version)"
echo ""

# 安装依赖
echo "[3/6] 安装依赖（可能需要几分钟）..."
pnpm install
if [ $? -ne 0 ]; then
  echo "依赖安装失败"
  exit 1
fi
echo ""

# 生成 Prisma 客户端
echo "[4/6] 生成 Prisma 客户端..."
pnpm prisma generate
if [ $? -ne 0 ]; then
  echo "Prisma 客户端生成失败"
  exit 1
fi
echo ""

# 启动数据库
echo "[5/6] 启动数据库..."
docker compose up -d db redis
if [ $? -ne 0 ]; then
  echo "Docker 未安装或未运行"
  echo "请先安装 Docker: https://docs.docker.com/desktop/"
  exit 1
fi
echo "等待数据库启动..."
sleep 5
echo ""

# 运行迁移
echo "[6/6] 运行数据库迁移..."
pnpm prisma migrate dev
if [ $? -ne 0 ]; then
  echo "数据库迁移失败"
  exit 1
fi
echo ""

echo "============================================"
echo "  安装完成！"
echo "============================================"
echo ""
echo "启动开发服务器: pnpm dev"
echo "访问地址: http://localhost:3000"
echo ""
echo "导入种子数据（词库）: pnpm prisma:seed"
echo ""
