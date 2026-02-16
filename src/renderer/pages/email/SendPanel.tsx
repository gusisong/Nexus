import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Checkbox, Progress, Modal, message, Empty, Tag } from 'antd';
import {
  SendOutlined,
  StopOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ThunderboltOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import type { ProjectInfo, EmailProgress } from '../../../shared/ipc';

export default function SendPanel() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<EmailProgress | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    refreshProjects();
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  const refreshProjects = async () => {
    try {
      const list: ProjectInfo[] = await window.nexus.listProjects();
      setProjects(list.filter((p) => p.hasPending));
    } catch {
      message.error('加载项目列表失败');
    }
  };

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setPendingCount(null);
  };

  const selectAll = () => {
    if (selected.size === projects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(projects.map((p) => p.name)));
    }
    setPendingCount(null);
  };

  // Preview count
  useEffect(() => {
    if (selected.size === 0) {
      setPendingCount(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const count = await window.nexus.countPending(Array.from(selected));
        setPendingCount(count);
      } catch {
        setPendingCount(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [selected]);

  const startSend = useCallback(async () => {
    if (selected.size === 0) {
      message.warning('请先选择要发送的项目');
      return;
    }
    if (pendingCount === 0) {
      message.info('选中的项目下没有待发送的文件');
      return;
    }

    Modal.confirm({
      title: '确认发送',
      content: `即将向 ${pendingCount ?? '?'} 个供应商发送邮件，确定开始？`,
      okText: '开始发送',
      cancelText: '取消',
      onOk: async () => {
        setSending(true);
        setProgress(null);

        // Subscribe to progress events
        unsubRef.current = window.nexus.onProgress((p) => {
          setProgress(p);
        });

        try {
          const result = await window.nexus.sendBatch(Array.from(selected));
          const summary = result.cancelled
            ? `发送已取消。成功: ${result.success} 封，失败: ${result.failed} 封`
            : `发送完成！成功: ${result.success} 封，失败: ${result.failed} 封`;
          if (result.failed > 0) {
            message.warning(summary);
          } else {
            message.success(summary);
          }
        } catch (e) {
          message.error('发送过程中出错');
        } finally {
          setSending(false);
          if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
          }
          refreshProjects();
        }
      },
    });
  }, [selected, pendingCount]);

  const cancelSend = async () => {
    try {
      await window.nexus.cancelSend();
      message.info('已请求取消发送…');
    } catch {
      message.error('取消失败');
    }
  };

  const formatEta = (seconds: number | null | undefined): string => {
    if (seconds == null) return '--';
    const s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <>
      <div className="content-header">
        <h2>批量发送</h2>
        <p>选择项目并批量发送邮件给供应商</p>
      </div>
      <div className="content-body">
        {/* Project selection */}
        <div className="page-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>
              选择项目
              {pendingCount != null && (
                <Tag color="blue" style={{ marginLeft: 12, fontSize: 13 }}>
                  共 {pendingCount} 封待发送
                </Tag>
              )}
            </h3>
            <Button size="small" onClick={selectAll}>
              {selected.size === projects.length && projects.length > 0 ? '取消全选' : '全选'}
            </Button>
          </div>
          {projects.length === 0 ? (
            <Empty description="暂无包含待外发文件的项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {projects.map((p) => (
                <div
                  key={p.name}
                  onClick={() => !sending && toggleSelect(p.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: selected.has(p.name) ? 'rgba(102,126,234,0.08)' : '#141414',
                    border: `1px solid ${selected.has(p.name) ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 8,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Checkbox checked={selected.has(p.name)} disabled={sending} />
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress panel */}
        {(sending || progress) && (
          <div className="progress-panel">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                  📤 {progress ? `${progress.currentProject} → 供应商 ${progress.currentSupplier}` : '准备中…'}
                </span>
                <span style={{ color: '#667eea', fontWeight: 600 }}>
                  {progress ? `${Math.round(progress.percent)}%` : '0%'}
                </span>
              </div>
              <Progress
                percent={progress ? Math.round(progress.percent) : 0}
                showInfo={false}
                strokeColor={{
                  '0%': '#667eea',
                  '100%': '#764ba2',
                }}
                trailColor="rgba(255,255,255,0.08)"
                size={['100%', 10]}
              />
            </div>
            <div className="progress-stats">
              <div className="progress-stat">
                <div className="value">
                  <DashboardOutlined style={{ fontSize: 16, marginRight: 4 }} />
                  {progress ? (progress.rate * 60).toFixed(1) : '0'}
                </div>
                <div className="label">封/分钟</div>
              </div>
              <div className="progress-stat">
                <div className="value">
                  <ClockCircleOutlined style={{ fontSize: 16, marginRight: 4 }} />
                  {progress ? formatEta(progress.etaSeconds) : '--'}
                </div>
                <div className="label">剩余时间</div>
              </div>
              <div className="progress-stat success">
                <div className="value">
                  <CheckCircleFilled style={{ fontSize: 16, marginRight: 4 }} />
                  {progress?.success ?? 0}
                </div>
                <div className="label">发送成功</div>
              </div>
              <div className="progress-stat failed">
                <div className="value">
                  <CloseCircleFilled style={{ fontSize: 16, marginRight: 4 }} />
                  {progress?.failed ?? 0}
                </div>
                <div className="label">发送失败</div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          {sending ? (
            <Button danger icon={<StopOutlined />} size="large" onClick={cancelSend}>
              取消发送
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              size="large"
              onClick={startSend}
              disabled={selected.size === 0}
            >
              开始批量发送
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
