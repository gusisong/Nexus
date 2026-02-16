/**
 * FileTable — right pane file browser with drag-drop support.
 */
import { Table, Input, Space, Tag, Tooltip } from 'antd';
import {
  FolderOpenOutlined,
  FileOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  InboxOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { FileEntry } from '../../shared/ipc';

/* ---- Helpers ---- */
function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
  if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  if (['doc', 'docx'].includes(ext)) return <FileWordOutlined style={{ color: '#1890ff' }} />;
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) return <FileImageOutlined style={{ color: '#faad14' }} />;
  return <FileOutlined />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ---- Props ---- */
interface Props {
  selectedDir: string | null;
  selectedDirLabel: string;
  files: FileEntry[];
  loading?: boolean;
  selectedFiles: string[];
  renamingFile: string | null;
  renameValue: string;
  dragOver: boolean;
  onSelectFiles: (paths: string[]) => void;
  onStartRename: (path: string, name: string) => void;
  onRenameChange: (value: string) => void;
  onRenameConfirm: (path: string) => void;
  onRenameCancel: () => void;
  onOpenCsv: (path: string) => void;
  onDragOver: (over: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function FileTable({
  selectedDir,
  selectedDirLabel,
  files,
  loading,
  selectedFiles,
  renamingFile,
  renameValue,
  dragOver,
  onSelectFiles,
  onStartRename,
  onRenameChange,
  onRenameConfirm,
  onRenameCancel,
  onOpenCsv,
  onDragOver,
  onDrop,
}: Props) {
  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => {
        const fullPath = `${selectedDir}/${name}`;
        if (renamingFile === fullPath) {
          return (
            <Input
              size="small"
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onPressEnter={() => onRenameConfirm(fullPath)}
              onBlur={onRenameCancel}
              autoFocus
              style={{ width: 200 }}
            />
          );
        }
        const isCsv = name.toLowerCase().endsWith('.csv');
        return (
          <Space>
            {fileIcon(name)}
            <span
              style={{ cursor: 'pointer' }}
              onDoubleClick={() => {
                if (isCsv) {
                  onOpenCsv(fullPath);
                } else {
                  onStartRename(fullPath, name);
                }
              }}
            >
              {name}
            </span>
            {isCsv && (
              <Tag color="green" style={{ fontSize: 11, cursor: 'pointer' }} onClick={() => onOpenCsv(fullPath)}>
                编辑
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => formatSize(size),
    },
    {
      title: '修改时间',
      dataIndex: 'modifiedAt',
      key: 'modifiedAt',
      width: 160,
      render: (d: string) => formatDate(d),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_: any, record: FileEntry) => (
        <Tooltip title="重命名">
          <EditOutlined
            style={{ color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
            onClick={() => onStartRename(`${selectedDir}/${record.name}`, record.name)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a1a',
        borderRadius: 8,
        border: dragOver ? '2px dashed #667eea' : '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        transition: 'border 0.2s ease',
        position: 'relative',
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(true); }}
      onDragLeave={() => onDragOver(false)}
      onDrop={onDrop}
    >
      {selectedDir && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
        }}>
          📁 {selectedDirLabel}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selectedDir ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
            <FolderOpenOutlined style={{ fontSize: 40, marginBottom: 12 }} />
            <div>请在左侧选择一个目录</div>
          </div>
        ) : (
          <Table
            dataSource={files}
            columns={columns}
            rowKey="name"
            size="small"
            loading={loading}
            pagination={false}
            rowSelection={{
              selectedRowKeys: selectedFiles.map((p) => p.replace(selectedDir + '/', '')),
              onChange: (_, rows) => onSelectFiles(rows.map((r) => `${selectedDir}/${r.name}`)),
            }}
            locale={{
              emptyText: (
                <div style={{ padding: 40 }}>
                  <InboxOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.3)' }}>
                    目录为空，拖拽文件到此处上传
                  </div>
                </div>
              ),
            }}
            style={{ background: 'transparent' }}
          />
        )}
      </div>

      {dragOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(102,126,234,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center', color: '#667eea' }}>
            <InboxOutlined style={{ fontSize: 48 }} />
            <div style={{ fontSize: 16, marginTop: 8 }}>释放以上传文件</div>
          </div>
        </div>
      )}
    </div>
  );
}
