# 开发笔记

## 项目概述

面试报名系统 - 基于 React + Express + SQLite 的前后端分离面试管理系统。

项目路径: `/Users/lvzucheng/Documents/R/claude/interview-system`

## 环境配置

### Node.js 版本要求
- **必须使用 Node.js 18.x**
- `better-sqlite3` v9 与 Node.js 25+ 不兼容（C++20 要求）
- macOS 使用 Homebrew 安装 Node.js 18:
  ```bash
  brew install node@18
  export PATH="/opt/homebrew/opt/node@18/bin:$PATH"
  ```

### 服务端口
- 后端: `http://localhost:3001`
- 前端: `http://localhost:5173`

## 已解决的关键问题

### 1. ProtectedRoute 路由嵌套问题
**问题**: 嵌套路由中 `<Route element={<AdminRoute />}>` 不渲染子路由
**解决**: 使用 `<Outlet />` 替代 `{children}` 来渲染嵌套路由

**位置**: `frontend/src/components/common/ProtectedRoute.tsx`
```typescript
// 错误写法
return <>{children}</>;

// 正确写法
return children ? <>{children}</> : <Outlet />;
```

### 2. Modal.info 不能渲染 JSX 内容
**问题**: `Modal.info` 的 content 属性不支持 JSX 组件
**解决**: 使用受控 Modal 组件，将 content 改为 children

**位置**: `frontend/src/pages/admin/AdminRegistrationsPage.tsx`
```typescript
// 错误写法
Modal.info({
  content: <Descriptions>...</Descriptions>
});

// 正确写法
<Modal open={detailModalOpen} onCancel={() => setDetailModalOpen(false)}>
  <Descriptions>...</Descriptions>
</Modal>
```

### 3. 导航链接使用 `<a href>` 导致页面刷新
**问题**: 使用 `<a href="/admin/registrations">` 会完全刷新页面，丢失认证状态
**解决**: 使用 React Router 的 `useNavigate` 钩子

**位置**: `frontend/src/pages/admin/AdminDashboardPage.tsx`
```typescript
// 错误写法
<a href="/admin/registrations">查看全部</a>

// 正确写法
<Button type="link" onClick={() => navigate('/admin/registrations')}>查看全部</Button>
```

### 4. MainLayout 菜单导航问题
**问题**: 菜单项 key 与实际路由不匹配，点击无反应
**解决**: 创建 key 到 path 的映射

**位置**: `frontend/src/components/layout/MainLayout.tsx`
```typescript
const keyToPath: Record<string, string> = {
  '/': '/',
  'admin-interviews': '/admin/interviews',
  'admin-registrations': '/admin/registrations',
  // ...
};
```

### 5. 邮件发送阻塞请求
**问题**: 同步发送邮件导致报名请求超时
**解决**: 将邮件发送改为异步（不使用 await）

**位置**: `backend/src/controllers/registration.controller.ts`
```typescript
// 错误写法
await EmailService.sendConfirmation(...);

// 正确写法
EmailService.sendConfirmation(...)
  .catch(err => console.error('Email send failed:', err));
```

### 6. 速率限制配置错误
**问题**: 使用 `config.env` 而不是 `config.nodeEnv`
**解决**: 统一使用 `config.nodeEnv`

**位置**: `backend/src/middlewares/rateLimit.middleware.ts`
```typescript
// 错误写法
const isDevelopment = config.env === 'development';

// 正确写法
const isDevelopment = config.nodeEnv === 'development';
```

### 7. 教室管理验证失败
**问题**: 前端发送的数据格式与后端 Joi schema 不匹配
**解决**: 确保数据类型匹配

**位置**:
- 前端: `frontend/src/pages/admin/AdminClassroomsPage.tsx`
- 后端: `backend/src/middlewares/validation.middleware.ts`

```typescript
// equipment 应该是数组，不是 JSON 字符串
equipment: values.equipment || []

// is_available 应该是布尔值，不是数字
is_available: values.is_available
```

## 路由保护机制

### ProtectedRoute 组件层次
1. `ProtectedRoute` - 普通用户认证保护
2. `AdminRoute` - 管理员角色保护（继承自 ProtectedRoute）
3. `InterviewerRoute` - 面试官角色保护（继承自 ProtectedRoute）

### 角色权限
- `admin`: 管理员，可以访问所有功能
- `interviewer`: 面试官，可以访问面试评分相关功能
- `user`: 普通用户，只能访问报名相关功能

## 认证流程

### Token 机制
- Access Token: 15分钟有效期
- Refresh Token: 7天有效期
- 存储在 Zustand store 中（非持久化，刷新后丢失）

### 认证中间件
- `authenticate`: 验证 JWT token
- `requireAdmin`: 要求管理员权限
- `requireInterviewer`: 要求面试官或管理员权限

## 数据库模型

### 核心表
- `users`: 用户表
- `interviews`: 面试表
- `registrations`: 报名记录表
- `interview_slots`: 面试场次表
- `question_banks`: 题库表
- `classrooms`: 教室表
- `notification_logs`: 通知记录表

### 关键关系
- 一个用户可以报名多个面试
- 一个报名可以关联一个面试场次
- 一个面试可以有多个场次

## 待完成功能

1. **短信通知**: 需要配置阿里云 SMS
2. **文件上传**: 简历上传功能
3. **实时通知**: WebSocket 支持
4. **数据导出**: Excel 导出功能
5. **邮件模板**: 优化邮件内容
6. **面试自动调度**: 根据教室和面试官自动安排时间

## 开发脚本

### 后端
```bash
cd backend
npm run dev          # tsx watch 开发模式
npm run build        # TypeScript 编译
npm run start        # 生产模式
npm run db:init      # 初始化数据库
npm run db:seed      # 填充初始数据
```

### 前端
```bash
cd frontend
npm run dev          # Vite 开发模式
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
```

## 调试技巧

### 查看后端日志
```bash
# 后端在后台运行时
cat /private/tmp/claude-501/-Users-lvzucheng-Documents-R-claude/tasks/<task-id>.output
```

### 测试 API
```bash
# 登录获取 token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@interview.com","password":"admin123"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# 使用 token 访问 API
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/dashboard
```

### 重启服务
```bash
# 停止后端
lsof -ti:3001 | xargs kill -9

# 停止前端
lsof -ti:5173 | xargs kill -9
```

## 重要文件路径

### 前端关键文件
- `src/App.tsx`: 路由配置
- `src/main.tsx`: 应用入口
- `src/services/index.ts`: API 服务定义
- `src/store/authStore.ts`: 认证状态管理

### 后端关键文件
- `src/app.ts`: Express 应用入口
- `src/database/schema.sql`: 数据库表结构
- `src/database/seed.ts`: 初始数据填充
- `src/middlewares/validation.middleware.ts`: Joi 验证 schemas

## 预设账户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@interview.com | admin123 |
| 面试官 | interviewer@interview.com | interviewer123 |
| 用户 | user@example.com | user123 |

## 下次继续开发时

1. 确认 Node.js 版本: `node --version` (应该是 v18.x.x)
2. 启动后端: `cd backend && npm run dev`
3. 启动前端: `cd frontend && npm run dev`
4. 访问 http://localhost:5173
5. 使用管理员账号登录: admin@interview.com / admin123

## 常见错误和解决方案

### better-sqlite3 编译错误
```
Error: C++20 is required
```
**解决**: 切换到 Node.js 18

### 登录后空白页
```
React is not defined
```
**解决**: 检查组件导入，确保 `useEffect` 等钩子正确导入

### 速率限制错误
```
Too many requests
```
**解决**: 确认开发环境下速率限制已禁用

### 验证错误
```
Validation failed
```
**解决**: 检查请求数据格式是否与 Joi schema 匹配
