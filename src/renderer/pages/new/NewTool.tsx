import { Empty } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

export default function NewTool() {
  return (
    <>
      <div className="content-header">
        <h2>New 工具</h2>
        <p>新模块 — 待开发</p>
      </div>
      <div className="content-body">
        <div className="page-card" style={{ textAlign: 'center', padding: 48 }}>
          <RocketOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>即将推出</h3>
          <Empty description="此模块正在开发中，敬请期待…" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      </div>
    </>
  );
}
