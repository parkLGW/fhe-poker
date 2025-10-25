#!/bin/bash

# 清理脚本 - 将开发文档移动到 docs/archive 目录

echo "🧹 开始清理开发文档..."

# 创建归档目录
mkdir -p docs/archive

# 需要保留的文档（不移动）
KEEP_FILES=(
    "README.md"
    "LICENSE"
)

# 移动所有其他 .md 文件到归档目录
for file in *.md; do
    # 检查文件是否在保留列表中
    should_keep=false
    for keep in "${KEEP_FILES[@]}"; do
        if [ "$file" = "$keep" ]; then
            should_keep=true
            break
        fi
    done
    
    # 如果不在保留列表中，移动到归档目录
    if [ "$should_keep" = false ] && [ -f "$file" ]; then
        echo "📦 归档: $file"
        mv "$file" docs/archive/
    fi
done

echo "✅ 清理完成！"
echo "📁 开发文档已移动到 docs/archive/ 目录"
echo "📝 保留的文档: README.md, LICENSE"

