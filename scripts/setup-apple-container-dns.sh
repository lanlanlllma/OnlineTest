#!/bin/bash

# =============================================================================
# Apple Container DNS 配置脚本
# 设置本地DNS域以便更方便地访问容器应用
# =============================================================================

set -e

echo "🍎 Apple Container DNS 配置"
echo "=========================="

# 检查 Apple Container 是否可用
if ! command -v container &> /dev/null; then
    echo "❌ 未找到 Apple Container 命令"
    echo "请先安装 Apple Container"
    exit 1
fi

echo "✅ Apple Container 已安装"

# 设置本地DNS域
DOMAIN_NAME=${1:-"exam"}

echo "🔧 设置本地DNS域: $DOMAIN_NAME"
echo "这将需要管理员权限..."

# 创建DNS域
sudo container system dns create "$DOMAIN_NAME"

# 设置为默认域
container system dns default set "$DOMAIN_NAME"

echo "✅ DNS域配置完成"
echo
echo "🎯 现在您可以使用以下域名访问容器："
echo "  - exam-system-app.$DOMAIN_NAME:3000"
echo "  - 管理员面板: exam-system-app.$DOMAIN_NAME:3000/admin"
echo
echo "📝 其他有用的DNS命令："
echo "  查看DNS配置: container system dns list"
echo "  删除DNS域: sudo container system dns delete $DOMAIN_NAME"
echo "  重置DNS: sudo container system dns reset"
