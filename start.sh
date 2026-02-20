#!/bin/bash

# 设置 PATH 使用 Node.js 18
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 启动后端
echo "启动后端服务..."
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
echo "启动前端服务..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "面试报名系统已启动！"
echo "=========================================="
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:3001"
echo ""
echo "默认账户："
echo "  管理员: admin@interview.com / admin123"
echo "  面试官: interviewer@interview.com / interviewer123"
echo "  用户: user@example.com / user123"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "=========================================="

# 捕获退出信号
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# 等待进程
wait $BACKEND_PID $FRONTEND_PID
