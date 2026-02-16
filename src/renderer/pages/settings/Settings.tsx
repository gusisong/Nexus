import { useState, useEffect } from 'react';
import { Button, message, Space } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';

export default function Settings() {
  const [workDir, setWorkDir] = useState('');

  useEffect(() => {
    loadWorkDir();
  }, []);

  const loadWorkDir = async () => {
    try {
      const dir = await window.nexus.getWorkDir();
      setWorkDir(dir || '');
    } catch {
      /* ignore */
    }
  };

  const changeWorkDir = async () => {
    try {
      const dir = await window.nexus.selectDirectory();
      if (dir) {
        await window.nexus.setWorkDir(dir);
        setWorkDir(dir);
        message.success(`工作目录已切换到: ${dir}`);
      }
    } catch {
      message.error('选择目录失败');
    }
  };

  return (
    <>
      <div className="content-header">
        <h2>系统设置</h2>
        <p>全局配置与偏好设置</p>
      </div>
      <div className="content-body">
        <div className="page-card">
          <h3>工作根目录</h3>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 12 }}>
            指定 EmailAddress.csv、项目文件夹和日志的存储位置
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: '#141414',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 12,
            }}
          >
            <FolderOpenOutlined style={{ color: '#667eea', fontSize: 16 }} />
            <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              {workDir || '未设置'}
            </span>
          </div>
          <Space>
            <Button type="primary" icon={<FolderOpenOutlined />} onClick={changeWorkDir}>
              选择目录
            </Button>
          </Space>
        </div>

        <div className="page-card">
          <h3>关于</h3>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 2 }}>
            <div><strong style={{ color: 'rgba(255,255,255,0.65)' }}>Nexus</strong> — 企业工具平台</div>
            <div>版本: 1.0.0</div>
            <div>技术栈: Electron + React + TypeScript</div>
          </div>
        </div>
      </div>
    </>
  );
}
