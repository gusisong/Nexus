/**
 * useFileManager — extracts all file management state & logic from ProjectManager.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { message, Modal } from 'antd';
import { useAppStore } from '../stores/appStore';
import { useProjectStore } from '../stores/projectStore';
import type { FileEntry } from '../../shared/ipc';

const SUB_DIRS = ['待外发', '已外发', 'failed'] as const;

export function useFileManager() {
  const workDir = useAppStore((s) => s.workDir);
  const { projects, loading, refreshProjects } = useProjectStore();

  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [selectedDirLabel, setSelectedDirLabel] = useState('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState('');
  const [csvEditorPath, setCsvEditorPath] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Init workDir
  useEffect(() => {
    useAppStore.getState().loadWorkDir();
  }, []);

  // Load projects on mount
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Load files when directory changes
  const refreshFiles = useCallback(async () => {
    if (!selectedDir) { setFiles([]); return; }
    try {
      const list = await window.nexus.listFiles(selectedDir);
      setFiles(list.filter((f: FileEntry) => !f.isDirectory));
      setSelectedFiles([]);
    } catch {
      message.error('加载文件列表失败');
    }
  }, [selectedDir]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  // ---- Derived state ----
  const currentProject = useMemo(() => {
    if (!selectedDir || !workDir) return '';
    return selectedDir.replace(workDir + '/', '').split('/')[0];
  }, [selectedDir, workDir]);

  const currentSubDir = useMemo(() => {
    if (!selectedDir || !workDir) return '';
    return selectedDir.replace(workDir + '/', '').split('/')[1] || '';
  }, [selectedDir, workDir]);

  const moveOptions = useMemo(() =>
    SUB_DIRS.filter((d) => d !== currentSubDir).map((d) => ({
      value: `${workDir}/${currentProject}/${d}`,
      label: `${currentProject} / ${d}`,
    })),
  [currentProject, currentSubDir, workDir]);

  const treeData = useMemo(() => {
    if (!workDir) return [];
    return projects.map((p) => ({
      projectName: p.name,
      key: `${workDir}/${p.name}`,
      children: SUB_DIRS.map((sub) => ({
        title: sub,
        key: `${workDir}/${p.name}/${sub}`,
      })),
    }));
  }, [projects, workDir]);

  // ---- Actions ----
  const handleTreeSelect = (key: string) => {
    setSelectedDir(key);
    const parts = key.replace(workDir + '/', '').split('/');
    setSelectedDirLabel(parts.join(' / '));
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) { message.warning('请输入项目名称'); return; }
    try {
      const result = await window.nexus.createProject(newProjectName.trim());
      if (result.ok) {
        message.success('项目创建成功');
        setNewProjectName('');
        refreshProjects();
      } else {
        message.error(result.message);
      }
    } catch { message.error('创建失败'); }
  };

  const handleDeleteProject = (projectName: string) => {
    Modal.confirm({
      title: '删除项目',
      content: `确定要删除项目「${projectName}」及其所有文件吗？此操作不可恢复！`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await window.nexus.deleteProject(projectName);
          if (result.ok) {
            message.success(result.message);
            if (selectedDir?.includes(`/${projectName}/`) || selectedDir?.endsWith(`/${projectName}`)) {
              setSelectedDir(null);
              setSelectedDirLabel('');
            }
            refreshProjects();
          } else {
            message.error(result.message);
          }
        } catch { message.error('删除失败'); }
      },
    });
  };

  const handleUpload = async () => {
    if (!selectedDir) { message.warning('请先选择一个目录'); return; }
    try {
      const result = await window.nexus.uploadFiles(selectedDir);
      if (result.ok && result.data > 0) {
        message.success(result.message);
        refreshFiles();
      }
    } catch { message.error('上传失败'); }
  };

  const handleDelete = () => {
    if (selectedFiles.length === 0) { message.warning('请先选择文件'); return; }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedFiles.length} 个文件吗？此操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await window.nexus.deleteFiles(selectedFiles);
          if (result.ok) {
            message.success(result.message);
            refreshFiles();
          } else {
            message.error(result.message);
          }
        } catch { message.error('删除失败'); }
      },
    });
  };

  const handleRename = async (oldPath: string) => {
    const newName = renameValue.trim();
    if (!newName) { setRenamingFile(null); return; }
    try {
      const result = await window.nexus.renameFile(oldPath, newName);
      if (result.ok) {
        message.success('重命名成功');
        refreshFiles();
      } else {
        message.error(result.message);
      }
    } catch { message.error('重命名失败'); }
    setRenamingFile(null);
  };

  const handleMove = async () => {
    if (!moveTarget || selectedFiles.length === 0) return;
    try {
      const result = await window.nexus.moveFiles(selectedFiles, moveTarget);
      if (result.ok) {
        message.success(result.message);
        refreshFiles();
      } else {
        message.error(result.message);
      }
    } catch { message.error('移动失败'); }
    setMoveModalOpen(false);
    setMoveTarget('');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!selectedDir) { message.warning('请先在左侧选择一个目录'); return; }
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;
    const paths = droppedFiles.map((f) => (f as any).path).filter(Boolean);
    if (paths.length === 0) { message.warning('无法获取文件路径'); return; }
    try {
      const result = await window.nexus.dropFiles(paths, selectedDir);
      if (result.ok && result.data > 0) {
        message.success(result.message);
        refreshFiles();
      }
    } catch { message.error('上传失败'); }
  };

  return {
    // State
    workDir,
    projects,
    loading,
    selectedDir,
    selectedDirLabel,
    files,
    selectedFiles,
    newProjectName,
    renamingFile,
    renameValue,
    moveModalOpen,
    moveTarget,
    moveOptions,
    csvEditorPath,
    dragOver,
    treeData,

    // Setters
    setSelectedFiles,
    setNewProjectName,
    setRenamingFile,
    setRenameValue,
    setMoveModalOpen,
    setMoveTarget,
    setCsvEditorPath,
    setDragOver,

    // Actions
    refreshProjects,
    refreshFiles,
    handleTreeSelect,
    handleCreateProject,
    handleDeleteProject,
    handleUpload,
    handleDelete,
    handleRename,
    handleMove,
    handleDrop,
  };
}
