import React, { useState, useRef, useEffect } from 'react';
import { 
  Briefcase, Plus, Search, Filter, LayoutGrid, 
  List as ListIcon, MoreHorizontal, ArrowLeft, 
  Calendar, Users, Target, Clock, DollarSign, 
  CheckCircle2, AlertCircle, Trash2, Edit2, 
  ChevronDown, ChevronRight, FileText, Link as LinkIcon,
  Phone, MapPin, Type, Hash, Layers, UserPlus,
  MessageSquare, Star, X, Settings, GripVertical,
  PlusCircle, Download, Share2, User
} from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';
import { Project, ProjectTask, ColumnDefinition, ColumnType } from '../../lib/mockData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function CommProjects() {
  const { 
    projects, addProject, updateProject, deleteProject, 
    addColumn, updateColumn, deleteColumn,
    addTask, updateTask, updateTaskValue, deleteTask 
  } = useProjects();
  const { user } = useAuth();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('id, name, role');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.currentTarget as any).projectName.value;
    const desc = (e.currentTarget as any).projectDesc.value;
    const project: Project = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      description: desc,
      status: 'planning',
      progress: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      budget: 0,
      isPrivate: false,
      category: 'Comunicação',
      priority: 'medium',
      invitees: user ? [user.id] : [],
      columns: [
        { id: 'c1', name: 'Status', type: 'status', options: ['Todo', 'Working on it', 'Stuck', 'Done'] },
        { id: 'c2', name: 'Owner', type: 'people' },
        { id: 'c3', name: 'Timeline', type: 'date' },
      ],
      tasks: []
    };
    addProject(project);
    setShowNewProjectModal(false);
  };

  if (selectedProject) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedProjectId(null)}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{selectedProject.name}</h1>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                  {selectedProject.status}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Projeto #{selectedProject.id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
              <button 
                onClick={() => setViewMode('table')}
                className={cn(
                  "p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                  viewMode === 'table' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <ListIcon size={16} /> Tabela
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                className={cn(
                  "p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                  viewMode === 'kanban' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid size={16} /> Kanban
              </button>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copiado para a área de transferência!');
              }}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <ProjectTableView 
            project={selectedProject} 
            updateTaskValue={updateTaskValue}
            addColumn={addColumn}
            updateColumn={updateColumn}
            deleteColumn={deleteColumn}
            addTask={addTask}
            deleteTask={deleteTask}
            users={users}
          />
        ) : (
          <ProjectKanbanView 
            project={selectedProject}
            updateTaskValue={updateTaskValue}
            addTask={addTask}
            deleteTask={deleteTask}
            updateColumn={updateColumn}
            users={users}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Briefcase className="text-indigo-600" size={36} />
            Gestão de Projetos
          </h1>
          <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-xs">Sistema de acompanhamento Monday Style</p>
        </div>
        <button 
          onClick={() => setShowNewProjectModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-[2rem] font-black flex items-center gap-3 transition-all shadow-xl shadow-indigo-200 active:scale-95 uppercase text-xs tracking-widest"
        >
          <PlusCircle size={20} />
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => setSelectedProjectId(project.id)}
            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full border-b-8 border-b-transparent hover:border-b-indigo-600"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000 opacity-50" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-white shadow-xl shadow-indigo-500/10 text-indigo-600 rounded-3xl flex items-center justify-center font-black text-2xl border border-indigo-50 group-hover:scale-110 transition-transform">
                  {project.name.charAt(0)}
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    project.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    project.status === 'planning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                  )}>
                    {project.status === 'active' ? 'Em Curso' : project.status === 'planning' ? 'Planejamento' : 'Pausado'}
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-tight">{project.name}</h3>
              <p className="text-sm text-slate-400 font-medium line-clamp-3 mb-8 leading-relaxed">
                {project.description}
              </p>

              <div className="mt-auto space-y-6 pt-8 border-t border-slate-50">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Progresso do Workflow</span>
                  <span className="text-indigo-600">{project.progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-200"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Equipe</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <Layers size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{project.tasks.length} Entregáveis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="bg-emerald-600 p-12 text-white relative">
              <h3 className="text-3xl font-black tracking-tight">Novo Quadro</h3>
              <p className="text-white/80 text-sm font-bold uppercase tracking-widest mt-2">Personalize seu fluxo de trabalho</p>
              <button 
                onClick={() => setShowNewProjectModal(false)}
                className="absolute top-10 right-10 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-12 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Quadro</label>
                <input 
                  name="projectName"
                  required
                  type="text" 
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-slate-700"
                  placeholder="Ex: Pós Venda, RH, Marketing..."
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição curta</label>
                <textarea 
                  name="projectDesc"
                  rows={3}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-600 resize-none"
                  placeholder="Objetivo deste fluxo..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="w-full px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black transition-all shadow-xl shadow-emerald-200 active:scale-95 uppercase text-sm tracking-widest"
                >
                  Criar e Abrir Quadro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectTableView({ project, updateTaskValue, addColumn, updateColumn, deleteColumn, addTask, deleteTask, users }: { 
  project: Project, 
  updateTaskValue: any,
  addColumn: any,
  updateColumn: any,
  deleteColumn: any,
  addTask: any,
  deleteTask: any,
  users: any[]
}) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<ColumnType>('text');
  
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editOptionsValue, setEditOptionsValue] = useState('');

  const statusColumn = project.columns?.find(c => c.type === 'status');
  const groups = statusColumn?.options || ['Todo'];
  const statusColumnId = statusColumn?.id;

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const column: ColumnDefinition = {
      id: `c${Date.now()}`,
      name: newColumnName,
      type: newColumnType,
      options: newColumnType === 'status' ? ['Todo', 'Working on it', 'Stuck', 'Done'] : undefined
    };
    addColumn(project.id, column);
    setShowAddColumnModal(false);
    setNewColumnName('');
  };

  const handleUpdateOptions = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingColumnId) {
      const options = editOptionsValue.split(',').map(o => o.trim()).filter(o => o !== '');
      updateColumn(project.id, editingColumnId, { options });
      setEditingColumnId(null);
    }
  };

  const handleAddTaskToGroup = (statusValue: string) => {
    const task: ProjectTask = {
      id: `t${Date.now()}`,
      title: 'Novo Elemento',
      description: '',
      status: 'todo',
      cost: 0,
      subtasks: [],
      invitees: [],
      priority: 'medium',
      values: statusColumnId ? { [statusColumnId]: statusValue } : {}
    };
    addTask(project.id, task);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-5 w-10"></th>
              <th className="p-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 min-w-[300px]">Elemento</th>
              {(project.columns || []).map(col => (
                <th key={col.id} className="p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 group min-w-[150px] relative">
                  <div className="flex items-center justify-center gap-2">
                    {getColumnIcon(col.type)}
                    <span 
                      onClick={() => col.type === 'status' && (setEditingColumnId(col.id), setEditOptionsValue(col.options?.join(', ') || ''))}
                      className={cn(col.type === 'status' && "cursor-pointer hover:text-indigo-600 underline decoration-dotted decoration-indigo-300")}
                    >
                      {col.name}
                    </span>
                    <button 
                      onClick={() => deleteColumn(project.id, col.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  {/* Edit Status Options Popover */}
                  {editingColumnId === col.id && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100] bg-white border border-slate-100 shadow-2xl p-6 rounded-3xl min-w-[300px] animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editar Opções de Status</h4>
                        <button onClick={() => setEditingColumnId(null)}><X size={14} className="text-slate-400" /></button>
                      </div>
                      <form onSubmit={handleUpdateOptions} className="space-y-4">
                        <textarea 
                          value={editOptionsValue}
                          onChange={(e) => setEditOptionsValue(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none"
                          placeholder="Opção 1, Opção 2, Opção 3..."
                          rows={3}
                        />
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest italic">Separe as opções por vírgula</p>
                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                          Salvar Opções
                        </button>
                      </form>
                    </div>
                  )}
                </th>
              ))}
              <th className="p-4 w-12">
                <button 
                  onClick={() => setShowAddColumnModal(true)}
                  className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <Plus size={16} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((statusValue, idx) => {
              const tasksInGroup = project.tasks.filter(t => 
                !statusColumnId || (t.values && t.values[statusColumnId] === statusValue) || (!t.values?.[statusColumnId] && statusValue === groups[0])
              );
              
              return (
                <React.Fragment key={idx}>
                  {/* Group Header */}
                  <tr className="group/row">
                    <td colSpan={(project.columns?.length || 0) + 3} className="p-0">
                      <div className="flex items-center gap-3 p-4 bg-slate-50/30 border-b border-slate-100 cursor-pointer">
                        <ChevronDown size={16} className="text-slate-400" />
                        <span className={cn(
                          "font-black text-sm px-3 py-1 rounded-lg border",
                          idx === 0 ? "text-amber-600 border-amber-100 bg-amber-50" : 
                          idx === groups.length - 1 ? "text-emerald-600 border-emerald-100 bg-emerald-50" :
                          "text-indigo-600 border-indigo-100 bg-indigo-50"
                        )}>
                          {statusValue}
                        </span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          {tasksInGroup.length} Elementos
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Tasks in Group */}
                  {tasksInGroup.map(task => (
                    <tr key={task.id} className="group/task border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-center">
                        <GripVertical size={14} className="text-slate-200 opacity-0 group-hover/task:opacity-100 cursor-grab" />
                      </td>
                      <td className="p-0 border-r border-slate-100">
                        <input 
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTaskValue(project.id, task.id, 'title', e.target.value)}
                          className="w-full h-full px-6 py-4 bg-transparent border-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white font-bold text-sm text-slate-700 outline-none"
                        />
                      </td>
                      {(project.columns || []).map(col => (
                        <td key={col.id} className="p-0 border-r border-slate-100 h-full">
                          <CellEditor 
                            projectId={project.id}
                            taskId={task.id}
                            column={col}
                            value={task.values?.[col.id]}
                            onUpdate={(val: any) => updateTaskValue(project.id, task.id, col.id, val)}
                            users={users}
                          />
                        </td>
                      ))}
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => deleteTask(project.id, task.id)}
                          className="text-slate-200 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-all p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Add Row in Group */}
                  <tr className="border-b border-slate-100 bg-slate-50/20">
                    <td className="p-4"></td>
                    <td className="p-0" colSpan={(project.columns?.length || 0) + 2}>
                      <button 
                        onClick={() => handleAddTaskToGroup(statusValue)}
                        className="w-full text-left px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Adicionar elemento
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Column Modal */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-10 text-white relative">
              <h3 className="text-2xl font-black tracking-tight">Nova Coluna</h3>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-2">Escolha o tipo de dado</p>
              <button onClick={() => setShowAddColumnModal(false)} className="absolute top-10 right-10 p-2 rounded-xl bg-white/10 hover:bg-white/20"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddColumn} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Coluna</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-slate-700"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Dado</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['text', 'date', 'status', 'people', 'value', 'phone', 'location', 'link', 'number', 'notes', 'dropdown', 'timeline'] as ColumnType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewColumnType(type)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        newColumnType === type ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
                      )}
                    >
                      {getColumnIcon(type)}
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-200 active:scale-95 transition-all">
                Criar Coluna
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectKanbanView({ project, updateTaskValue, addTask, deleteTask, updateColumn, users }: any) {
  const statusColumn = (project.columns || []).find((c: any) => c.type === 'status');
  const columns = statusColumn?.options || ['Todo'];
  const statusColumnId = statusColumn?.id;
  
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');

  const handleMoveTask = (taskId: string, newStatus: string) => {
    if (statusColumnId) {
      updateTaskValue(project.id, taskId, statusColumnId, newStatus);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && statusColumnId) {
      updateTaskValue(project.id, taskId, statusColumnId, newStatus);
    }
  };

  const handleAddColumn = () => {
    if (newColumnName.trim() && statusColumnId) {
      updateColumn(project.id, statusColumnId, { options: [...columns, newColumnName.trim()] });
      setNewColumnName('');
    }
  };

  const handleDeleteColumn = (statusToDelete: string) => {
    if (statusColumnId) {
      updateColumn(project.id, statusColumnId, { options: columns.filter((c: string) => c !== statusToDelete) });
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-10 min-h-[600px] animate-in fade-in duration-500">
      {columns.map((status: string, idx: number) => {
        const tasks = project.tasks.filter((t: any) => 
          !statusColumnId || (t.values && t.values[statusColumnId] === status) || (!t.values?.[statusColumnId] && status === columns[0])
        );

        return (
          <div 
            key={status} 
            className="flex-shrink-0 w-80 flex flex-col group/col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-3 flex-1 pr-2">
                <div className={cn(
                  "w-3 h-3 rounded-full shadow-sm",
                  idx === 0 ? "bg-amber-500" : 
                  idx === columns.length - 1 ? "bg-emerald-500" : "bg-indigo-500"
                )} />
                {editingColumn === status ? (
                  <input 
                    autoFocus
                    className="text-sm font-black text-slate-900 tracking-tight bg-white border border-indigo-200 rounded px-2 py-1 w-full outline-none"
                    defaultValue={status}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== status && statusColumnId) {
                        const newOptions = [...columns];
                        newOptions[idx] = e.target.value.trim();
                        updateColumn(project.id, statusColumnId, { options: newOptions });
                      }
                      setEditingColumn(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                  />
                ) : (
                  <h3 
                    className="text-sm font-black text-slate-900 tracking-tight cursor-pointer hover:text-indigo-600 truncate"
                    onClick={() => setEditingColumn(status)}
                    title="Clique para editar"
                  >
                    {status}
                  </h3>
                )}
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg flex-shrink-0">
                  {tasks.length}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover/col:opacity-100 transition-all">
                <button 
                  onClick={() => handleDeleteColumn(status)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm"
                  title="Excluir Etapa"
                >
                  <Trash2 size={14} />
                </button>
                <button 
                  onClick={() => {
                    const task: ProjectTask = {
                      id: `t${Date.now()}`,
                      title: 'Novo Card',
                      description: '',
                      status: 'todo',
                      cost: 0,
                      subtasks: [],
                      invitees: [],
                      priority: 'medium',
                      values: statusColumnId ? { [statusColumnId]: status } : {}
                    };
                    addTask(project.id, task);
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 min-h-[200px] p-2 rounded-[2rem] border border-transparent hover:border-slate-100 transition-all">
              {tasks.map((task: any) => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => setEditingTask(task)}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group/card cursor-grab active:cursor-grabbing border-l-4"
                  style={{ borderLeftColor: idx === 0 ? '#f59e0b' : idx === columns.length - 1 ? '#10b981' : '#6366f1' }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-black text-slate-800 leading-tight group-hover/card:text-indigo-600 transition-colors">{task.title}</h4>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => deleteTask(project.id, task.id)}
                        className="opacity-0 group-hover/card:opacity-100 text-slate-300 hover:text-red-500 p-1 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex -space-x-2">
                      {/* People indicator */}
                      {(project.columns || []).filter((c: any) => c.type === 'people').map((pc: any) => {
                        const taskUsers = task.values?.[pc.id] || [];
                        return taskUsers.map((uid: string) => {
                          const user = users.find((u: any) => u.id === uid);
                          return (
                            <div key={uid} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black">
                              {user?.name.charAt(0)}
                            </div>
                          );
                        });
                      })}
                    </div>
                    
                    {/* Status Move Menu */}
                    <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-all">
                      {columns.filter(s => s !== status).map(s => (
                        <button
                          key={s}
                          onClick={() => handleMoveTask(task.id, s)}
                          title={`Mover para ${s}`}
                          className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-all"
                        >
                          <ChevronRight size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="h-20 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  Solte aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Add New Column */}
      <div className="flex-shrink-0 w-80 flex flex-col pt-12">
        <div className="bg-slate-50/50 p-4 rounded-3xl border-2 border-dashed border-slate-200">
          <input 
            type="text"
            value={newColumnName}
            onChange={e => setNewColumnName(e.target.value)}
            placeholder="Nova Etapa..."
            className="w-full px-4 py-2 mb-2 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-indigo-300"
            onKeyDown={e => { if (e.key === 'Enter') handleAddColumn(); }}
          />
          <button 
            onClick={handleAddColumn}
            disabled={!newColumnName.trim()}
            className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Task Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800">Editar Elemento</h2>
              <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-white rounded-xl text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label>
                <input 
                  type="text" 
                  defaultValue={editingTask.title}
                  onBlur={(e) => updateTaskValue(project.id, editingTask.id, 'title', e.target.value)}
                  className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              
              {(project.columns || []).map((col: any) => (
                <div key={col.id}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{col.name}</label>
                  <div className="mt-2 h-12 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex items-center">
                    <div className="flex-1 h-full px-2">
                      <CellEditor 
                        projectId={project.id}
                        taskId={editingTask.id}
                        column={col}
                        value={editingTask.values?.[col.id]}
                        onUpdate={(val: any) => {
                          updateTaskValue(project.id, editingTask.id, col.id, val);
                          // Local update for immediate feedback
                          setEditingTask((prev: any) => ({
                            ...prev,
                            values: { ...prev.values, [col.id]: val }
                          }));
                        }}
                        users={users}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CellEditor({ projectId, taskId, column, value, onUpdate, users }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (column.type === 'status') {
    const options = column.options || ['Todo'];
    return (
      <div className="relative h-full flex items-center justify-center p-2">
        <select 
          value={value || options[0]}
          onChange={(e) => onUpdate(e.target.value)}
          className={cn(
            "w-full h-10 border-none rounded-lg text-center font-black uppercase text-[10px] tracking-widest cursor-pointer focus:ring-2 focus:ring-indigo-500/20 appearance-none transition-all",
            value === 'Done' || value === 'Concluído' ? "bg-emerald-500 text-white" :
            value === 'Stuck' ? "bg-rose-500 text-white" :
            value === 'Working on it' || value === 'Em Curso' ? "bg-amber-500 text-white" : "bg-indigo-500 text-white"
          )}
        >
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  if (column.type === 'people') {
    const selectedUsers = Array.isArray(value) ? value : [];
    
    const toggleUser = (userId: string) => {
      if (selectedUsers.includes(userId)) {
        onUpdate(selectedUsers.filter(id => id !== userId));
      } else {
        onUpdate([...selectedUsers, userId]);
      }
    };

    return (
      <div className="relative group/people flex items-center justify-center gap-1 p-2 h-full min-h-[50px]">
        <div className="flex -space-x-2">
          {selectedUsers.length > 0 ? selectedUsers.map((uid: string) => {
            const user = users.find((u: any) => u.id === uid);
            return (
              <div 
                key={uid} 
                className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm transition-transform hover:scale-110 hover:z-10" 
                title={user?.name || 'Usuário'}
              >
                {user?.name.charAt(0)}
              </div>
            );
          }) : (
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
              <User size={14} />
            </div>
          )}
        </div>
        
        {/* Dropdown Popover */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover/people:block z-[101] bg-white rounded-2xl border border-slate-100 shadow-2xl p-3 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Atribuir Responsável</p>
          <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
            {users.map((user: any) => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all",
                  selectedUsers.includes(user.id) ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{user.role}</p>
                </div>
                {selectedUsers.includes(user.id) && <CheckCircle2 size={14} className="text-indigo-600" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (column.type === 'date') {
    return (
      <input 
        type="date"
        value={value || ''}
        onChange={(e) => onUpdate(e.target.value)}
        className="w-full h-full px-4 py-3 bg-transparent border-none text-center text-xs font-bold text-slate-600 outline-none focus:bg-slate-50"
      />
    );
  }

  if (column.type === 'value') {
    return (
      <div className="relative h-full flex items-center">
        <DollarSign size={12} className="absolute left-3 text-slate-400" />
        <input 
          type="number"
          value={value || ''}
          onChange={(e) => onUpdate(parseFloat(e.target.value))}
          className="w-full h-full pl-8 pr-4 py-3 bg-transparent border-none text-right text-xs font-black text-slate-800 outline-none focus:bg-slate-50"
          placeholder="0.00"
        />
      </div>
    );
  }

  if (column.type === 'file') {
    return (
      <div className="relative h-full flex items-center">
        <FileText size={12} className="absolute left-3 text-slate-400" />
        <input 
          type="text"
          value={value || ''}
          onChange={(e) => onUpdate(e.target.value)}
          className="w-full h-full pl-8 pr-4 py-3 bg-transparent border-none text-left text-xs font-medium text-slate-600 outline-none focus:bg-slate-50 placeholder:text-slate-200"
          placeholder="Nome do arquivo ou link..."
        />
      </div>
    );
  }

  if (column.type === 'link') {
    return (
      <div className="relative h-full flex items-center group">
        <LinkIcon size={12} className="absolute left-3 text-slate-400" />
        <input 
          type="text"
          value={value || ''}
          onChange={(e) => onUpdate(e.target.value)}
          className="w-full h-full pl-8 pr-8 py-3 bg-transparent border-none text-left text-xs font-medium text-slate-600 outline-none focus:bg-slate-50 placeholder:text-slate-200"
          placeholder="Link do drive..."
        />
        {value && (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className="absolute right-2 p-1 text-indigo-500 hover:text-indigo-700 bg-indigo-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
             <LinkIcon size={12} />
          </a>
        )}
      </div>
    );
  }

  return (
    <input 
      type={column.type === 'number' ? 'number' : 'text'}
      value={value || ''}
      onChange={(e) => onUpdate(e.target.value)}
      className="w-full h-full px-5 py-4 bg-transparent border-none text-left text-xs font-medium text-slate-600 outline-none focus:bg-slate-50 placeholder:text-slate-200"
      placeholder="..."
    />
  );
}

function getColumnIcon(type: ColumnType) {
  switch (type) {
    case 'text': return <Type size={14} />;
    case 'number': return <Hash size={14} />;
    case 'date': return <Calendar size={14} />;
    case 'status': return <CheckCircle2 size={14} />;
    case 'people': return <Users size={14} />;
    case 'file': return <FileText size={14} />;
    case 'link': return <LinkIcon size={14} />;
    case 'phone': return <Phone size={14} />;
    case 'location': return <MapPin size={14} />;
    case 'value': return <DollarSign size={14} />;
    case 'dropdown': return <ChevronDown size={14} />;
    case 'timeline': return <Clock size={14} />;
    case 'notes': return <MessageSquare size={14} />;
    default: return <Settings size={14} />;
  }
}
