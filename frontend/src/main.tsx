import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// 确保在 DOM 准备好后才开始渲染
const rootElement = document.getElementById('root');

if (rootElement) {
  // 添加淡入动画类
  rootElement.classList.add('app-loading');

  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#0f766e',
            borderRadius: 14,
            fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
            colorInfo: '#0f766e',
            colorSuccess: '#15803d',
            colorWarning: '#ea580c',
            colorError: '#dc2626',
          },
        }}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </StrictMode>
  );
}
