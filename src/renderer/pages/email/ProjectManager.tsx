/**
 * ProjectManager — assembles the file manager UI from hook + sub-components.
 * ~80 lines, down from 550+.
 */
import { Button, Input, Space, Modal, Select } from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useFileManager } from '../../hooks/useFileManager';
import ProjectTree from '../../components/ProjectTree';
import FileTable from '../../components/FileTable';
import CsvEditor from './CsvEditor';

export default function ProjectManager() {
  const fm = useFileManager();

  return (
    <>
      <div className="content-header">
        <h2>项目管理</h2>
        <p>浏览项目文件、上传附件、管理文件</p>
      </div>
      <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', padding: '12px 32px 24px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button icon={<ReloadOutlined />} onClick={() => { fm.refreshProjects(); fm.refreshFiles(); }} loading={fm.loading} size="small">
            刷新
          </Button>
          <Input
            placeholder="新项目名称"
            value={fm.newProjectName}
            onChange={(e) => fm.setNewProjectName(e.target.value)}
            onPressEnter={fm.handleCreateProject}
            style={{ width: 180 }}
            size="small"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={fm.handleCreateProject} size="small">
            新建
          </Button>
          <div style={{ flex: 1 }} />
          <Button icon={<UploadOutlined />} onClick={fm.handleUpload} size="small" disabled={!fm.selectedDir}>
            上传文件
          </Button>
          <Button
            icon={<SwapOutlined />}
            onClick={() => { fm.setMoveModalOpen(true); fm.setMoveTarget(''); }}
            size="small"
            disabled={fm.selectedFiles.length === 0}
          >
            移动到…
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={fm.handleDelete}
            size="small"
            disabled={fm.selectedFiles.length === 0}
          >
            删除 {fm.selectedFiles.length > 0 && `(${fm.selectedFiles.length})`}
          </Button>
        </div>

        {/* Dual pane */}
        <div style={{ display: 'flex', flex: 1, gap: 12, minHeight: 0 }}>
          <ProjectTree
            treeData={fm.treeData}
            selectedDir={fm.selectedDir}
            onSelect={fm.handleTreeSelect}
            onDeleteProject={fm.handleDeleteProject}
          />
          <FileTable
            selectedDir={fm.selectedDir}
            selectedDirLabel={fm.selectedDirLabel}
            files={fm.files}
            loading={fm.fileLoading}
            selectedFiles={fm.selectedFiles}
            renamingFile={fm.renamingFile}
            renameValue={fm.renameValue}
            dragOver={fm.dragOver}
            onSelectFiles={fm.setSelectedFiles}
            onStartRename={(path, name) => { fm.setRenamingFile(path); fm.setRenameValue(name); }}
            onRenameChange={fm.setRenameValue}
            onRenameConfirm={fm.handleRename}
            onRenameCancel={() => fm.setRenamingFile(null)}
            onOpenCsv={fm.setCsvEditorPath}
            onDragOver={fm.setDragOver}
            onDrop={fm.handleDrop}
          />
        </div>

        {/* Move modal */}
        <Modal
          title="移动文件"
          open={fm.moveModalOpen}
          onOk={fm.handleMove}
          onCancel={() => fm.setMoveModalOpen(false)}
          okText="移动"
          cancelText="取消"
        >
          <p style={{ marginBottom: 12 }}>
            将 {fm.selectedFiles.length} 个文件移动到：
          </p>
          <Select
            value={fm.moveTarget || undefined}
            onChange={fm.setMoveTarget}
            options={fm.moveOptions}
            placeholder="选择目标目录"
            style={{ width: '100%' }}
          />
        </Modal>

        {/* CSV Editor */}
        {fm.csvEditorPath && (
          <CsvEditor
            filePath={fm.csvEditorPath}
            onClose={() => fm.setCsvEditorPath(null)}
            onSaved={() => fm.refreshFiles()}
          />
        )}
      </div>
    </>
  );
}
