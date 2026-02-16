import { useState, useEffect } from 'react';
import { Modal, Table, Input, Button, Space, message, Tag } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

interface Props {
  filePath: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CsvEditor({ filePath, onClose, onSaved }: Props) {
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  // Load CSV data
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await window.nexus.readCsv(filePath);
        if (result.ok) {
          setData(result.data);
        } else {
          message.error(result.message || '读取 CSV 失败');
        }
      } catch {
        message.error('读取 CSV 失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [filePath]);

  const handleSave = async () => {
    try {
      const result = await window.nexus.saveCsv(filePath, data);
      if (result.ok) {
        message.success('CSV 保存成功');
        setDirty(false);
        onSaved();
      } else {
        message.error(result.message);
      }
    } catch {
      message.error('保存失败');
    }
  };

  const updateCell = (row: number, col: number, value: string) => {
    setData((prev) => {
      const next = prev.map((r) => [...r]);
      // Ensure row and column exist
      while (next.length <= row) next.push([]);
      while (next[row].length <= col) next[row].push('');
      next[row][col] = value;
      return next;
    });
    setDirty(true);
  };

  const addRow = () => {
    const colCount = data.length > 0 ? Math.max(...data.map((r) => r.length)) : 1;
    setData((prev) => [...prev, Array(colCount).fill('')]);
    setDirty(true);
  };

  const deleteRow = (index: number) => {
    setData((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  // Build columns from data
  const maxCols = data.reduce((max, row) => Math.max(max, row.length), 0);
  const headerRow = data.length > 0 ? data[0] : [];
  const bodyData = data.length > 1 ? data.slice(1) : [];

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_: any, __: any, idx: number) => (
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{idx + 1}</span>
      ),
    },
    ...Array.from({ length: maxCols }, (_, colIdx) => ({
      title: headerRow[colIdx] || `列${colIdx + 1}`,
      key: `col-${colIdx}`,
      dataIndex: colIdx,
      render: (value: string, _record: any, rowIdx: number) => {
        const actualRow = rowIdx + 1; // +1 because header is row 0
        const isEditing =
          editingCell?.row === actualRow && editingCell?.col === colIdx;
        if (isEditing) {
          return (
            <Input
              size="small"
              value={value || ''}
              onChange={(e) => updateCell(actualRow, colIdx, e.target.value)}
              onBlur={() => setEditingCell(null)}
              onPressEnter={() => setEditingCell(null)}
              autoFocus
              style={{ margin: -4 }}
            />
          );
        }
        return (
          <div
            style={{
              cursor: 'pointer',
              minHeight: 22,
              padding: '0 4px',
            }}
            onDoubleClick={() => setEditingCell({ row: actualRow, col: colIdx })}
          >
            {value || ''}
          </div>
        );
      },
    })),
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: any, __: any, idx: number) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => deleteRow(idx + 1)}
        >
          删除
        </Button>
      ),
    },
  ];

  // Transform body data for Table
  const tableData = bodyData.map((row, idx) => {
    const obj: any = { key: idx };
    row.forEach((cell, colIdx) => {
      obj[colIdx] = cell;
    });
    return obj;
  });

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <Modal
      title={
        <Space>
          <span>CSV 编辑器</span>
          <Tag>{fileName}</Tag>
          {dirty && <Tag color="orange">未保存</Tag>}
        </Space>
      }
      open={true}
      onCancel={() => {
        if (dirty) {
          Modal.confirm({
            title: '未保存的更改',
            content: '你有未保存的更改，确定要关闭吗？',
            okText: '关闭',
            cancelText: '继续编辑',
            onOk: onClose,
          });
        } else {
          onClose();
        }
      }}
      footer={
        <Space>
          <Button onClick={addRow}>添加行</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!dirty}
          >
            保存
          </Button>
        </Space>
      }
      width={800}
      styles={{ body: { maxHeight: 500, overflowY: 'auto', padding: 12 } }}
    >
      <Table
        dataSource={tableData}
        columns={columns}
        loading={loading}
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
        style={{ background: 'transparent' }}
      />
      <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
        💡 双击单元格编辑内容，修改后点击「保存」按钮写回文件
      </div>
    </Modal>
  );
}
