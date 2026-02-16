import { useState, useEffect } from 'react';
import { Input, Button, Space, message } from 'antd';
import { SaveOutlined, ReloadOutlined, ApiOutlined, LoadingOutlined } from '@ant-design/icons';

export default function SmtpConfig() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await window.nexus.loadSmtpConfig();
      setUsername(cfg.username || '');
      setPassword(cfg.password || '');
    } catch (e) {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      const result = await window.nexus.saveSmtpConfig({
        username: username.trim(),
        password,
      });
      if (result.ok) {
        message.success(result.message || 'SMTP 配置已保存');
      } else {
        message.error(result.message || '保存失败');
      }
    } catch (e) {
      message.error('保存失败');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await window.nexus.testSmtpConnection();
      if (result.ok) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (e) {
      message.error('测试失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <h2>SMTP 账号配置</h2>
        <p>配置用于发送邮件的 SMTP 服务器账号信息</p>
      </div>
      <div className="content-body">
        <div className="page-card">
          <h3>认证信息</h3>
          <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 480 }}>
            <div>
              <div style={{ marginBottom: 6, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                用户名（邮箱地址）
              </div>
              <Input
                size="large"
                placeholder="example@csvw.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                密码
              </div>
              <Input.Password
                size="large"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveConfig}>
                保存配置
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadConfig} loading={loading}>
                重新加载
              </Button>
              <Button
                icon={testing ? <LoadingOutlined /> : <ApiOutlined />}
                onClick={testConnection}
                loading={testing}
              >
                测试连接
              </Button>
            </Space>
          </Space>
        </div>
      </div>
    </>
  );
}
