import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import SmtpConfig from './pages/email/SmtpConfig';
import Signature from './pages/email/Signature';
import ProjectManager from './pages/email/ProjectManager';
import SendPanel from './pages/email/SendPanel';
import LogViewer from './pages/email/LogViewer';
import Settings from './pages/settings/Settings';
import NewTool from './pages/new/NewTool';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#667eea',
          borderRadius: 8,
          colorBgContainer: '#1f1f1f',
          colorBgElevated: '#262626',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
      }}
    >
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/email/send" replace />} />
            <Route path="/email/smtp" element={<SmtpConfig />} />
            <Route path="/email/signature" element={<Signature />} />
            <Route path="/email/projects" element={<ProjectManager />} />
            <Route path="/email/send" element={<SendPanel />} />
            <Route path="/email/log" element={<LogViewer />} />
            <Route path="/new" element={<NewTool />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </ConfigProvider>
  );
}
