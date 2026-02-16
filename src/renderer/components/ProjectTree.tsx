/**
 * ProjectTree — left pane directory tree component.
 */
import { Tree, Empty } from 'antd';
import {
  FolderOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { DirectoryTree } = Tree;

interface TreeNodeData {
  projectName: string;
  key: string;
  children: { title: string; key: string }[];
}

interface Props {
  treeData: TreeNodeData[];
  selectedDir: string | null;
  onSelect: (key: string) => void;
  onDeleteProject: (name: string) => void;
}

export default function ProjectTree({ treeData, selectedDir, onSelect, onDeleteProject }: Props) {
  const antTreeData = treeData.map((p) => ({
    title: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, width: '100%' }}>
        <span style={{ flex: 1 }}>{p.projectName}</span>
        <DeleteOutlined
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteProject(p.projectName);
          }}
        />
      </span>
    ),
    key: p.key,
    icon: <FolderOutlined />,
    children: p.children.map((sub) => ({
      title: sub.title,
      key: sub.key,
      icon: <FolderOpenOutlined />,
      isLeaf: true,
    })),
  }));

  return (
    <div
      style={{
        width: 220,
        minWidth: 220,
        background: '#1a1a1a',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 8,
        overflowY: 'auto',
      }}
    >
      {antTreeData.length === 0 ? (
        <Empty description="暂无项目" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
      ) : (
        <DirectoryTree
          treeData={antTreeData}
          onSelect={(keys) => {
            if (keys.length > 0) onSelect(keys[0] as string);
          }}
          selectedKeys={selectedDir ? [selectedDir] : []}
          defaultExpandAll
          style={{ background: 'transparent' }}
        />
      )}
    </div>
  );
}
