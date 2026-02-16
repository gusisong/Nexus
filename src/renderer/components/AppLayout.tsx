import { useLocation, useNavigate } from 'react-router-dom';
import {
  MailOutlined,
  RocketOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

/* ---- Types ---- */
interface Module {
  key: string;
  label: string;
  icon: ReactNode;
  /** Default sub-page path */
  path: string;
  /** Sub-pages shown as horizontal tabs (omit for single-page modules) */
  tabs?: { path: string; label: string }[];
}

/* ---- Module definitions ---- */
const modules: Module[] = [
  {
    key: 'email',
    label: '邮件工具',
    icon: <MailOutlined />,
    path: '/email/send',
    tabs: [
      { path: '/email/send', label: '批量发送' },
      { path: '/email/projects', label: '项目管理' },
      { path: '/email/smtp', label: 'SMTP 配置' },
      { path: '/email/signature', label: '邮件签名' },
      { path: '/email/log', label: '运行日志' },
    ],
  },
  {
    key: 'new',
    label: 'New 工具',
    icon: <RocketOutlined />,
    path: '/new',
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: <SettingOutlined />,
    path: '/settings',
  },
];

/* ---- Helpers ---- */
function getActiveModule(pathname: string): Module | undefined {
  return modules.find(
    (m) => pathname === m.path || m.tabs?.some((t) => pathname === t.path),
  );
}

/* ---- Component ---- */
interface Props {
  children: ReactNode;
}

export default function AppLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = getActiveModule(location.pathname);

  return (
    <div className="app-layout">
      {/* ---- Sidebar: module-level only ---- */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <ThunderboltOutlined className="logo-icon" style={{ color: '#667eea' }} />
          <h1>NEXUS</h1>
        </div>

        <nav className="sidebar-menu">
          {modules.map((m) => (
            <div
              key={m.key}
              className={`sidebar-item ${active?.key === m.key ? 'active' : ''}`}
              onClick={() => navigate(m.path)}
            >
              {m.icon}
              <span>{m.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">Nexus v1.0.0</div>
      </aside>

      {/* ---- Content area ---- */}
      <main className="content-area">
        {/* Horizontal sub-tabs (only when the active module has tabs) */}
        {active?.tabs && (
          <div className="content-tabs">
            {active.tabs.map((tab) => (
              <div
                key={tab.path}
                className={`content-tab ${location.pathname === tab.path ? 'active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </div>
            ))}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
