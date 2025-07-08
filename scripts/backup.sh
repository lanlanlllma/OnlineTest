#!/bin/bash

# 数据备份脚本

set -e

# 配置
BACKUP_DIR="/backup/exam-system"
APP_DIR="/var/www/exam-system" # 或者你的应用目录
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

echo "🗃️  开始备份在线答题系统数据..."

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据文件
if [ -d "$APP_DIR/data" ]; then
    echo "📁 备份数据文件..."
    tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" -C "$APP_DIR" data
    echo "✅ 数据文件备份完成: data_$DATE.tar.gz"
else
    echo "⚠️  数据目录不存在: $APP_DIR/data"
fi

# 备份环境配置
if [ -f "$APP_DIR/.env.local" ]; then
    echo "⚙️  备份环境配置..."
    cp "$APP_DIR/.env.local" "$BACKUP_DIR/env_$DATE.backup"
    echo "✅ 环境配置备份完成: env_$DATE.backup"
fi

# 备份应用代码 (可选)
if [ "$1" = "--include-code" ]; then
    echo "💻 备份应用代码..."
    tar -czf "$BACKUP_DIR/code_$DATE.tar.gz" \
        --exclude="node_modules" \
        --exclude=".next" \
        --exclude="logs" \
        --exclude="data" \
        -C "$(dirname $APP_DIR)" "$(basename $APP_DIR)"
    echo "✅ 应用代码备份完成: code_$DATE.tar.gz"
fi

# 清理旧备份
echo "🧹 清理 $KEEP_DAYS 天前的备份..."
find "$BACKUP_DIR" -name "data_*" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "env_*" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "code_*" -mtime +$KEEP_DAYS -delete

# 显示备份信息
echo ""
echo "📊 备份完成统计："
echo "备份位置: $BACKUP_DIR"
echo "备份文件:"
ls -lh "$BACKUP_DIR" | grep "$DATE"

echo ""
echo "💾 当前备份占用空间:"
du -sh "$BACKUP_DIR"

echo ""
echo "📋 恢复备份命令示例:"
echo "  恢复数据: tar -xzf $BACKUP_DIR/data_$DATE.tar.gz -C $APP_DIR"
echo "  恢复配置: cp $BACKUP_DIR/env_$DATE.backup $APP_DIR/.env.local"

echo "✅ 备份完成！"
