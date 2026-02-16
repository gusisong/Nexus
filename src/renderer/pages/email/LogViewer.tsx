import { useState, useEffect, useMemo } from 'react';
import { Button, Space, Select, Input, message } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

type LogLevel = 'all' | 'info' | 'warning' | 'error';

export default function LogViewer() {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<LogLevel>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLog();
  }, []);

  const loadLog = async () => {
    setLoading(true);
    try {
      const content = await window.nexus.loadLog();
      setRaw(content || '');
    } catch {
      message.error('加载日志失败');
    } finally {
      setLoading(false);
    }
  };

  const lines = useMemo(() => {
    return raw.split('\n').filter(Boolean).map((line) => {
      let lineLevel: 'info' | 'warning' | 'error' = 'info';
      if (line.includes(' - WARNING - ')) lineLevel = 'warning';
      else if (line.includes(' - ERROR - ')) lineLevel = 'error';
      return { text: line, level: lineLevel };
    });
  }, [raw]);

  const filtered = useMemo(() => {
    let result = lines;
    if (level !== 'all') {
      result = result.filter((l) => l.level === level);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.text.toLowerCase().includes(q));
    }
    return result;
  }, [lines, level, search]);

  const counts = useMemo(() => {
    const c = { info: 0, warning: 0, error: 0 };
    for (const l of lines) c[l.level]++;
    return c;
  }, [lines]);

  return (
    <>
      <div className="content-header">
        <h2>运行日志</h2>
        <p>邮件发送运行日志（email_smtp_log.log）</p>
      </div>
      <div className="content-body">
        <div className="page-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <Space>
              <Select
                value={level}
                onChange={setLevel}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: `全部 (${lines.length})` },
                  { value: 'info', label: `INFO (${counts.info})` },
                  { value: 'warning', label: `WARNING (${counts.warning})` },
                  { value: 'error', label: `ERROR (${counts.error})` },
                ]}
              />
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索日志…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={{ width: 220 }}
              />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={loadLog} loading={loading} size="small">
              刷新
            </Button>
          </div>
          <div className="log-viewer">
            {filtered.length === 0 ? (
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>暂无日志</span>
            ) : (
              filtered.map((line, i) => (
                <div key={i} className={`log-line ${line.level}`}>
                  {line.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
