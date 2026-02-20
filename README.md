# 面试报名系统 (Interview Registration System)

一个美观的前后端分离面试报名和面试系统，基于 React 18 + TypeScript + Express + SQLite3 构建。

## 功能特性

### 用户功能
- ✅ 邮箱登录/注册（带验证码）
- ✅ 浏览面试列表和详情
- ✅ 报名面试（支持选择场次）
- ✅ 查看我的报名记录
- ✅ 查看题库和学习资源
- ✅ 个人中心管理

### 管理员功能
- ✅ 数据统计仪表板
- ✅ 面试管理（创建、编辑、发布、关闭）
- ✅ 报名管理（查看、确认、评分、公布结果）
- ✅ 题库管理（增删改查题目）
- ✅ 教室管理（管理面试场地和设备）
- ✅ 用户管理

### 面试官功能
- ✅ 查看分配的面试场次
- ✅ 对候选人进行评分和反馈

## 技术栈

### 前端
- **框架**: React 18.x + TypeScript 5.x
- **构建工具**: Vite 5.x
- **路由**: React Router 6.x
- **状态管理**: Zustand 4.x
- **UI组件**: Ant Design 5.x
- **样式**: Tailwind CSS 3.x
- **HTTP客户端**: Axios

### 后端
- **运行时**: Node.js 18.x+ (必须使用 Node.js 18，better-sqlite3 与 Node.js 25+ 不兼容)
- **框架**: Express 4.x
- **语言**: TypeScript 5.x
- **数据库**: SQLite3 + better-sqlite3
- **认证**: JWT (Access Token: 15分钟, Refresh Token: 7天)
- **密码加密**: bcrypt (salt rounds: 10)
- **验证**: Joi
- **邮件**: Nodemailer

## 项目结构

```
interview-system/
├── frontend/                 # 前端项目 (Vite + React)
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   │   ├── common/      # 通用组件 (Button, Input, Modal...)
│   │   │   ├── layout/      # 布局组件 (Header, Sidebar, Footer...)
│   │   │   └── forms/       # 表单组件
│   │   ├── pages/           # 页面组件
│   │   │   ├── auth/        # 登录、注册、忘记密码
│   │   │   ├── user/        # 用户中心、我的报名
│   │   │   ├── interview/   # 面试列表、详情、报名
│   │   │   ├── question/    # 题库浏览
│   │   │   ├── admin/       # 管理后台
│   │   │   └── interviewer/ # 面试官工作台
│   │   ├── services/        # API服务
│   │   ├── store/           # Zustand状态管理
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── utils/           # 工具函数
│   │   ├── types/           # TypeScript类型定义
│   │   └── styles/          # 全局样式 (Tailwind CSS)
│   ├── public/
│   └── package.json
│
└── backend/                  # 后端项目 (Express)
    ├── src/
    │   ├── config/          # 配置文件
    │   │   ├── database.ts  # 数据库连接
    │   │   └── env.ts       # 环境变量
    │   ├── models/          # 数据模型
    │   │   ├── User.model.ts
    │   │   ├── Interview.model.ts
    │   │   ├── Registration.model.ts
    │   │   ├── QuestionBank.model.ts
    │   │   ├── Classroom.model.ts
    │   │   ├── InterviewSlot.model.ts
    │   │   └── NotificationLog.model.ts
    │   ├── controllers/     # 控制器
    │   ├── services/        # 业务逻辑
    │   │   ├── auth.service.ts
    │   │   ├── email.service.ts
    │   │   └── sms.service.ts
    │   ├── middlewares/     # 中间件
    │   │   ├── auth.middleware.ts
    │   │   ├── admin.middleware.ts
    │   │   ├── validation.middleware.ts
    │   │   └── rateLimit.middleware.ts
    │   ├── routes/          # 路由定义
    │   ├── validators/      # 请求验证器
    │   ├── utils/           # 工具函数
    │   ├── database/        # 数据库初始化
    │   │   ├── schema.sql   # 数据库表结构
    │   │   └── seed.ts      # 初始数据填充
    │   └── app.ts           # Express应用入口
    ├── database/
    │   ├── interview.db     # SQLite数据库文件
    │   ├── schema.sql       # 数据库表结构
    │   └── seed.ts          # 数据填充脚本
    └── package.json
```

## 快速开始

### 环境要求
- **Node.js 18.x** (必须！better-sqlite3 v9 与 Node.js 25+ 不兼容)
- npm 或 yarn
- macOS 用户：安装 Homebrew 版本的 Node.js 18

### 安装 Node.js 18 (macOS)

如果已安装 Node.js 25，需要降级到 Node.js 18：

```bash
# 使用 Homebrew 安装 Node.js 18
brew install node@18

# 设置 PATH（添加到 ~/.zshrc 或 ~/.bash_profile）
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"

# 验证版本
node --version  # 应显示 v18.x.x
```

### 后端设置

1. 进入后端目录：
```bash
cd backend
```

2. 安装依赖：
```bash
npm install
```

3. 初始化数据库：
```bash
npm run db:init
npm run db:seed
```

4. 启动后端服务：
```bash
npm run dev
```

后端将在 http://localhost:3001 运行

### 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端将在 http://localhost:5173 运行

## 预设账户

| 角色 | 邮箱 | 密码 | 姓名 |
|------|------|------|------|
| 管理员 | admin@interview.com | admin123 | Admin User |
| 面试官 | interviewer@interview.com | interviewer123 | Interviewer User |
| 用户 | user@example.com | user123 | John Doe |
| 用户 | jane@example.com | user123 | Jane Smith |
| 用户 | bob@example.com | user123 | Bob Johnson |

## 报名状态说明

- **待确认 (pending)**: 用户刚报名后的初始状态
- **已确认 (confirmed)**: 管理员确认了报名
- **已完成 (completed)**: 面试已完成并已评分
- **已取消 (cancelled)**: 报名已取消
- **未通过 (failed)**: 面试未通过（分数 < 60）
- **未到场 (no_show)**: 候选人未到场

## 重要配置说明

### 开发环境速率限制
在开发环境中，所有速率限制已禁用（通过 `skip: () => isDevelopment` 配置）。

### 邮件配置
邮件服务目前为可选配置。如未配置 SMTP，邮件发送会失败但不影响其他功能。

### 数据库
使用 SQLite3，数据库文件位于 `backend/database/interview.db`。

## 已知问题与解决方案

### 1. better-sqlite3 编译错误
**问题**: Node.js 25.x 与 better-sqlite3 v9 不兼容
**解决**: 使用 Node.js 18.x

### 2. 登录后页面空白
**问题**: React Router 或组件渲染问题
**解决**: 检查控制台错误，确保 ProtectedRoute 使用 `<Outlet />` 而不是 `{children}`

### 3. Modal.info 无法渲染 JSX 内容
**问题**: Ant Design 的 Modal.info 不支持 JSX 内容
**解决**: 使用受控 Modal 组件替代

## 启动命令汇总

### 后端
```bash
cd backend
npm run dev          # 开发模式
npm run build        # 构建
npm run start        # 生产模式
npm run db:init      # 初始化数据库
npm run db:seed      # 填充初始数据
```

### 前端
```bash
cd frontend
npm run dev          # 开发模式 (http://localhost:5173)
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
```

## 环境变量

### 后端 `.env` (可选)
```env
NODE_ENV=development
PORT=3001

# 数据库
DB_PATH=./database/interview.db

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Interview System <noreply@interview.com>

# 短信配置 (可选，阿里云)
SMS_ACCESS_KEY_ID=your-access-key
SMS_ACCESS_KEY_SECRET=your-secret
SMS_SIGN_NAME=面试系统
SMS_TEMPLATE_CODE=SMS_123456789

# 前端URL
FRONTEND_URL=http://localhost:5173
```

## 继续开发注意事项

### 关键文件
- `frontend/src/components/common/ProtectedRoute.tsx`: 路由保护逻辑
- `frontend/src/components/layout/MainLayout.tsx`: 主布局和菜单导航
- `frontend/src/store/authStore.ts`: 认证状态管理
- `backend/src/middlewares/rateLimit.middleware.ts`: 速率限制配置
- `backend/src/middlewares/validation.middleware.ts`: Joi 验证 schemas

### 常见问题
1. **速率限制错误**: 检查 `rateLimit.middleware.ts` 中的 `isDevelopment` 判断
2. **验证错误**: 检查 `validation.middleware.ts` 中的 Joi schemas
3. **路由权限**: 检查 `ProtectedRoute` 和路由配置

### 待完成功能
- 短信通知功能（需要配置阿里云 SMS）
- 面试场次自动调度
- 实时通知（WebSocket）
- 文件上传（简历上传）
- 数据导出功能

## 许可证

MIT
