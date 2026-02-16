import { useState, useEffect } from 'react';
import { Input, Button, Space, message } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export default function Signature() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSignature();
  }, []);

  const loadSignature = async () => {
    setLoading(true);
    try {
      const text = await window.nexus.loadSignature();
      setContent(text || '');
    } catch {
      message.error('加载签名失败');
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = async () => {
    try {
      const result = await window.nexus.saveSignature(content);
      if (result.ok) {
        message.success(result.message || '签名已保存');
      } else {
        message.error(result.message || '保存失败');
      }
    } catch {
      message.error('保存失败');
    }
  };

  return (
    <>
      <div className="content-header">
        <h2>邮件签名</h2>
        <p>编辑邮件正文末尾的签名内容（Signature.txt）</p>
      </div>
      <div className="content-body">
        <div className="page-card">
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            placeholder="在此输入签名内容…"
            style={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
              fontSize: 14,
              lineHeight: 1.8,
            }}
          />
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveSignature}>
                保存签名
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadSignature} loading={loading}>
                重新加载
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </>
  );
}
