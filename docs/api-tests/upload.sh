#!/bin/bash
# NestAI S3 上传测试脚本
# 用法: ./upload.sh <图片路径>
# 示例: ./upload.sh ~/Desktop/test.jpg

API_URL="http://localhost:3000/api/upload"
FILE_PATH="${1:-test.jpg}"

echo "上传文件: $FILE_PATH"
echo "目标接口: $API_URL"
echo ""

curl -X POST "$API_URL" \
  -F "file=@$FILE_PATH" \
  -H "Content-Type: multipart/form-data" \
  -v

echo ""
echo "=== 期望响应 ==="
echo '{'
echo '  "success": true,'
echo '  "data": {'
echo '    "url": "https://...",'
echo '    "key": "uploads/..."'
echo '  }'
echo '}'
