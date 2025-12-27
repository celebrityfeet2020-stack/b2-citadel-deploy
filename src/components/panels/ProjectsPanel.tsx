'use client';
import { useState, useEffect } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { scribeApi, Project, Module } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput, GlassTextarea } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  RefreshCw,
  ChevronRight,
  Box,
  CheckCircle,
  Circle,
  X,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

// 创建项目对话框
interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateProjectDialog({ isOpen, onClose, onCreated }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入项目名称');
      return;
    }

    setIsLoading(true);
    try {
      await scribeApi.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        tech_stack: techStack.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('项目创建成功');
      onCreated();
      onClose();
      setName('');
      setDescription('');
      setTechStack('');
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('创建项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-b2-text-primary">创建新项目</h3>
            <button onClick={onClose} className="text-b2-text-muted hover:text-b2-text-primary">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-b2-text-secondary mb-2">
                项目名称 *
              </label>
              <GlassInput
                value={name}
                onChange={setName}
                placeholder="my-awesome-project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-b2-text-secondary mb-2">
                项目描述
              </label>
              <GlassTextarea
                value={description}
                onChange={setDescription}
                placeholder="描述这个项目的目标和范围..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-b2-text-secondary mb-2">
                技术栈
              </label>
              <GlassInput
                value={techStack}
                onChange={setTechStack}
                placeholder="React, TypeScript, Node.js（用逗号分隔）"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <GlassButton variant="secondary" onClick={onClose}>
              取消
            </GlassButton>
            <GlassButton onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw size={16} className="animate-spin mr-2" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              创建
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// 创建模块对话框
interface CreateModuleDialogProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateModuleDialog({ isOpen, projectId, onClose, onCreated }: CreateModuleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dodChecklist, setDodChecklist] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('请输入模块名称');
      return;
    }

    setIsLoading(true);
    try {
      await scribeApi.createModule({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        dod_checklist: dodChecklist.split('\n').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('模块创建成功');
      onCreated();
      onClose();
      setName('');
      setDescription('');
      setDodChecklist('');
    } catch (error) {
      console.error('Failed to create module:', error);
      toast.error('创建模块失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-b2-text-primary">创建新模块</h3>
            <button onClick={onClose} className="text-b2-text-muted hover:text-b2-text-primary">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-b2-text-secondary mb-2">
                模块名称 *
              </label>
              <GlassInput
                value={name}
                onChange={setName}
                placeholder="auth-module"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-b2-text-secondary mb-2">
                模块描述
              </label>
              <GlassTextarea
                value={description}
                onChange={setDescription}
                placeholder="描述这个模块的功能..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-b2-text-secondary mb-2">
                DoD清单（每行一项）
              </label>
              <GlassTextarea
                value={dodChecklist}
                onChange={setDodChecklist}
                placeholder="代码通过审计官审查&#10;单元测试覆盖率 > 80%&#10;API文档已更新"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <GlassButton variant="secondary" onClick={onClose}>
              取消
            </GlassButton>
            <GlassButton onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw size={16} className="animate-spin mr-2" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              创建
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// 项目卡片组件
interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
}

function ProjectCard({ project, isSelected, onSelect }: ProjectCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-xl transition-all',
        isSelected
          ? 'bg-gradient-to-r from-b2-accent-cyan/20 to-b2-accent-purple/10 border border-b2-accent-cyan/30'
          : 'bg-white/5 hover:bg-white/10 border border-transparent'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          isSelected ? 'bg-b2-accent-cyan/20' : 'bg-white/10'
        )}>
          <FolderOpen size={20} className={isSelected ? 'text-b2-accent-cyan' : 'text-b2-text-secondary'} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-b2-text-primary truncate">{project.name}</h4>
          {project.description && (
            <p className="text-xs text-b2-text-muted truncate">{project.description}</p>
          )}
        </div>
        <ChevronRight size={16} className={cn(
          'transition-transform',
          isSelected ? 'text-b2-accent-cyan rotate-90' : 'text-b2-text-muted'
        )} />
      </div>
      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {project.tech_stack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-b2-text-muted"
            >
              {tech}
            </span>
          ))}
          {project.tech_stack.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-b2-text-muted">
              +{project.tech_stack.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

// 模块列表组件
interface ModuleListProps {
  projectId: string;
  onCreateModule: () => void;
}

function ModuleList({ projectId, onCreateModule }: ModuleListProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const data = await scribeApi.getModules(projectId);
      setModules(data);
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw size={20} className="animate-spin text-b2-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-b2-text-secondary">模块列表</h4>
        <GlassButton size="sm" variant="secondary" onClick={onCreateModule}>
          <Plus size={14} className="mr-1" />
          新建模块
        </GlassButton>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-8 text-b2-text-muted">
          <Box size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无模块</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((module) => (
            <GlassCard key={module.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Box size={16} className="text-b2-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-b2-text-primary">{module.name}</h5>
                    <span className={cn(
                      'px-2 py-0.5 text-xs rounded-full',
                      module.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      module.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    )}>
                      {module.status}
                    </span>
                  </div>
                  {module.description && (
                    <p className="text-xs text-b2-text-muted mt-1">{module.description}</p>
                  )}
                  {module.dod_checklist && module.dod_checklist.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-b2-text-secondary">DoD清单:</p>
                      {module.dod_checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-b2-text-muted">
                          <Circle size={12} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// 主项目管理面板
export function ProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateModule, setShowCreateModule] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await scribeApi.getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('加载项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex flex-col h-full">
      {/* 标题 */}
      <div className="flex-shrink-0 p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <FolderOpen size={24} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-b2-text-primary">项目管理</h2>
              <p className="text-sm text-b2-text-muted">
                管理开发项目和模块
                {projects.length > 0 && ` · 共 ${projects.length} 个项目`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton variant="secondary" onClick={loadProjects} disabled={isLoading}>
              <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
            </GlassButton>
            <GlassButton onClick={() => setShowCreateProject(true)}>
              <Plus size={16} className="mr-2" />
              新建项目
            </GlassButton>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：项目列表 */}
        <div className="w-80 flex-shrink-0 border-r border-white/5 p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw size={20} className="animate-spin text-b2-text-muted" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={48} className="mx-auto mb-4 text-b2-text-muted opacity-50" />
              <h3 className="text-lg font-medium text-b2-text-primary mb-2">暂无项目</h3>
              <p className="text-sm text-b2-text-secondary mb-4">
                创建第一个项目开始开发
              </p>
              <GlassButton onClick={() => setShowCreateProject(true)}>
                <Plus size={16} className="mr-2" />
                创建项目
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isSelected={selectedProjectId === project.id}
                  onSelect={() => setSelectedProjectId(project.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右侧：项目详情 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedProject ? (
            <div className="space-y-6">
              {/* 项目信息 */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-b2-text-primary mb-2">
                  {selectedProject.name}
                </h3>
                {selectedProject.description && (
                  <p className="text-b2-text-secondary mb-4">{selectedProject.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-b2-text-muted">
                  <span>创建于 {formatRelativeTime(new Date(selectedProject.created_at))}</span>
                  <span>更新于 {formatRelativeTime(new Date(selectedProject.updated_at))}</span>
                </div>
                {selectedProject.tech_stack && selectedProject.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedProject.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-sm rounded-full bg-white/10 text-b2-text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* 模块列表 */}
              <ModuleList
                projectId={selectedProject.id}
                onCreateModule={() => setShowCreateModule(true)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-b2-text-muted">
              选择一个项目查看详情
            </div>
          )}
        </div>
      </div>

      {/* 创建项目对话框 */}
      <AnimatePresence>
        {showCreateProject && (
          <CreateProjectDialog
            isOpen={showCreateProject}
            onClose={() => setShowCreateProject(false)}
            onCreated={loadProjects}
          />
        )}
      </AnimatePresence>

      {/* 创建模块对话框 */}
      <AnimatePresence>
        {showCreateModule && selectedProjectId && (
          <CreateModuleDialog
            isOpen={showCreateModule}
            projectId={selectedProjectId}
            onClose={() => setShowCreateModule(false)}
            onCreated={() => {
              // 触发模块列表刷新
              setSelectedProjectId(null);
              setTimeout(() => setSelectedProjectId(selectedProjectId), 0);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
