'use client';

import { useEffect, useState } from 'react';

interface Tarefa {
  _id: string;
  titulo: string;
  descricao: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavel: string;
  criadoPor: string;
  prazo: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  username: string;
  fullName: string;
  funcao: string;
  isAdmin: boolean;
  nivelAcesso?: string;
}

const STATUS_COLUMNS = [
  { id: 'todo', label: 'A Fazer', color: 'bg-gray-700', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'in-progress', label: 'Em Andamento', color: 'bg-gray-700', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'review', label: 'Revisão', color: 'bg-gray-700', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'done', label: 'Concluído', color: 'bg-[#4CAF50]', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const PRIORIDADE_COLORS = {
  baixa: 'bg-gray-800/50 text-gray-300 border-gray-700',
  media: 'bg-gray-800/50 text-gray-300 border-gray-700',
  alta: 'bg-gray-800/50 text-gray-300 border-gray-700',
  urgente: 'bg-gray-800/50 text-gray-300 border-gray-700',
};

export default function TarefasPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null);
  const [draggedTarefa, setDraggedTarefa] = useState<Tarefa | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'todo' as Tarefa['status'],
    prioridade: 'media' as Tarefa['prioridade'],
    responsavel: '',
    prazo: '',
    tags: '',
  });
  const [error, setError] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');

  useEffect(() => {
    fetchUser();
    fetchTarefas();
    fetchUsers();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchTarefas = async () => {
    try {
      const response = await fetch('/api/tarefas');
      if (response.ok) {
        const data = await response.json();
        setTarefas(data.tarefas || []);
      }
    } catch (error) {
      console.error('Error fetching tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreate = () => {
    setEditingTarefa(null);
    setFormData({
      titulo: '',
      descricao: '',
      status: 'todo',
      prioridade: 'media',
      responsavel: '',
      prazo: '',
      tags: '',
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (tarefa: Tarefa) => {
    setEditingTarefa(tarefa);
    setFormData({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || '',
      status: tarefa.status,
      prioridade: tarefa.prioridade,
      responsavel: tarefa.responsavel || '',
      prazo: tarefa.prazo ? tarefa.prazo.split('T')[0] : '',
      tags: tarefa.tags.join(', '),
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.titulo.trim()) {
      setError('Título é obrigatório');
      return;
    }

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const payload = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        status: formData.status,
        prioridade: formData.prioridade,
        responsavel: formData.responsavel || null,
        prazo: formData.prazo || null,
        tags: tagsArray,
      };

      let response;
      if (editingTarefa) {
        response = await fetch(`/api/tarefas/${editingTarefa._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/tarefas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        setShowModal(false);
        fetchTarefas();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao salvar tarefa');
      }
    } catch (error) {
      console.error('Error saving tarefa:', error);
      setError('Erro ao salvar tarefa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tarefas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTarefas();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir tarefa');
      }
    } catch (error) {
      console.error('Error deleting tarefa:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const handleDragStart = (e: React.DragEvent, tarefa: Tarefa) => {
    setDraggedTarefa(tarefa);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Tarefa['status']) => {
    e.preventDefault();

    if (!draggedTarefa || draggedTarefa.status === targetStatus) {
      setDraggedTarefa(null);
      return;
    }

    try {
      const response = await fetch(`/api/tarefas/${draggedTarefa._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (response.ok) {
        fetchTarefas();
      }
    } catch (error) {
      console.error('Error updating tarefa status:', error);
    }

    setDraggedTarefa(null);
  };

  const getTarefasFiltradas = () => {
    return tarefas.filter(t => {
      if (filtroPrioridade !== 'todas' && t.prioridade !== filtroPrioridade) return false;
      if (filtroResponsavel !== 'todos') {
        if (filtroResponsavel === 'sem-responsavel' && t.responsavel) return false;
        if (filtroResponsavel !== 'sem-responsavel' && t.responsavel !== filtroResponsavel) return false;
      }
      return true;
    });
  };

  const getTarefasByStatus = (status: Tarefa['status']) => {
    return getTarefasFiltradas().filter(t => t.status === status);
  };

  const getStats = () => {
    const filtradas = getTarefasFiltradas();
    return {
      total: filtradas.length,
      todo: filtradas.filter(t => t.status === 'todo').length,
      inProgress: filtradas.filter(t => t.status === 'in-progress').length,
      review: filtradas.filter(t => t.status === 'review').length,
      done: filtradas.filter(t => t.status === 'done').length,
      atrasadas: filtradas.filter(t => {
        if (!t.prazo || t.status === 'done') return false;
        const prazo = new Date(t.prazo);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return prazo < hoje;
      }).length,
    };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const isOverdue = (prazo: string | null) => {
    if (!prazo) return false;
    const date = new Date(prazo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-[#1e2228] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tarefas</h1>
            <p className="text-gray-400">Gerencie suas tarefas e projetos</p>
          </div>
        {user?.nivelAcesso !== 'suporte' && (
          <button
            onClick={handleCreate}
            className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-5 py-2.5 rounded-lg transition flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Tarefa
          </button>
        )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#282c34] rounded-lg p-3 border border-gray-700/50">
            <div className="text-gray-500 text-xs mb-1">Total</div>
            <div className="text-xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-[#282c34] rounded-lg p-3 border border-gray-700/50">
            <div className="text-gray-500 text-xs mb-1">A Fazer</div>
            <div className="text-xl font-bold text-white">{stats.todo}</div>
          </div>
          <div className="bg-[#282c34] rounded-lg p-3 border border-gray-700/50">
            <div className="text-gray-500 text-xs mb-1">Em Andamento</div>
            <div className="text-xl font-bold text-white">{stats.inProgress}</div>
          </div>
          <div className="bg-[#282c34] rounded-lg p-3 border border-gray-700/50">
            <div className="text-gray-500 text-xs mb-1">Revisão</div>
            <div className="text-xl font-bold text-white">{stats.review}</div>
          </div>
          <div className="bg-[#282c34] rounded-lg p-3 border border-gray-700/50">
            <div className="text-gray-500 text-xs mb-1">Concluídas</div>
            <div className="text-xl font-bold text-[#4CAF50]">{stats.done}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#282c34] rounded-lg p-4 border border-gray-700/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Prioridade:</label>
              <select
                value={filtroPrioridade}
                onChange={(e) => setFiltroPrioridade(e.target.value)}
                className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              >
                <option value="todas">Todas</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Responsável:</label>
              <select
                value={filtroResponsavel}
                onChange={(e) => setFiltroResponsavel(e.target.value)}
                className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
              >
                <option value="todos">Todos</option>
                <option value="sem-responsavel">Sem responsável</option>
                {users.map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </div>
            {(filtroPrioridade !== 'todas' || filtroResponsavel !== 'todos') && (
              <button
                onClick={() => {
                  setFiltroPrioridade('todas');
                  setFiltroResponsavel('todos');
                }}
                className="text-sm text-gray-400 hover:text-white transition ml-auto"
              >
                Limpar filtros
              </button>
            )}
            {stats.atrasadas > 0 && (
              <div className="ml-auto flex items-center gap-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{stats.atrasadas} atrasadas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATUS_COLUMNS.map((column) => {
          const columnTarefas = getTarefasByStatus(column.id as Tarefa['status']);

          return (
            <div
              key={column.id}
              className="bg-[#282c34] rounded-xl p-5 min-h-[600px] border border-gray-700/50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id as Tarefa['status'])}
            >
              <div className={`${column.color} text-white px-4 py-3 rounded-lg mb-5 flex items-center justify-between shadow-lg`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={column.icon} />
                  </svg>
                  <span className="font-semibold">{column.label}</span>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                  {columnTarefas.length}
                </span>
              </div>

              <div className="space-y-4">
                {columnTarefas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Nenhuma tarefa
                  </div>
                ) : (
                  columnTarefas.map((tarefa) => {
                    const prazoDate = formatDate(tarefa.prazo);
                    const overdue = isOverdue(tarefa.prazo);

                    return (
                      <div
                        key={tarefa._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tarefa)}
                        className="group bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-xl p-5 cursor-move hover:from-gray-700 hover:to-gray-700/80 transition-all border border-gray-700/50 hover:border-gray-600 shadow-lg hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden"
                      >
                        {/* Decorative accent based on priority */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${
                          tarefa.prioridade === 'urgente' ? 'bg-[#4CAF50]' :
                          tarefa.prioridade === 'alta' ? 'bg-gray-600' :
                          tarefa.prioridade === 'media' ? 'bg-gray-600' :
                          'bg-gray-700'
                        }`}></div>

                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-white text-base flex-1 leading-tight pr-2 group-hover:text-[#4CAF50] transition-colors">{tarefa.titulo}</h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {user?.nivelAcesso !== 'suporte' && (
                              <button
                                onClick={() => handleEdit(tarefa)}
                                className="text-gray-400 hover:text-[#4CAF50] hover:bg-[#4CAF50]/10 transition p-1.5 rounded-lg"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {user?.username === tarefa.criadoPor && (
                              <button
                                onClick={() => handleDelete(tarefa._id)}
                                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition p-1.5 rounded-lg"
                                title="Excluir"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {tarefa.descricao && (
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{tarefa.descricao}</p>
                        )}

                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-2 ${PRIORIDADE_COLORS[tarefa.prioridade]}`}>
                            {tarefa.prioridade}
                          </span>
                          {tarefa.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {tarefa.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="bg-gray-700/70 text-gray-300 px-2.5 py-1 rounded-lg text-xs border border-gray-600/50 font-medium">
                                  {tag}
                                </span>
                              ))}
                              {tarefa.tags.length > 2 && (
                                <span className="text-gray-500 text-xs font-medium">+{tarefa.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2.5 pt-3 border-t border-gray-700/50">
                          {tarefa.responsavel && (
                            <div className="text-gray-300 text-sm flex items-center gap-2 font-medium">
                              <div className="w-6 h-6 rounded-full bg-gray-700/50 border border-gray-600/50 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <span>{users.find(u => u.username === tarefa.responsavel)?.fullName || tarefa.responsavel}</span>
                            </div>
                          )}

                          {prazoDate && (
                            <div className={`text-sm flex items-center gap-2 font-medium ${overdue ? 'text-gray-300' : 'text-gray-400'}`}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-700/50 border border-gray-600/50">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span>{prazoDate}</span>
                              {overdue && <span className="ml-2 px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs font-medium border border-gray-600/50">Atrasado</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#282c34] rounded-xl p-6 w-full max-w-lg border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent h-28 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Tarefa['status'] })}
                    className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  >
                    {STATUS_COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Prioridade</label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as Tarefa['prioridade'] })}
                    className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Responsável</label>
                <select
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                >
                  <option value="">Nenhum</option>
                  {users.map((user) => (
                    <option key={user.username} value={user.username}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Prazo</label>
                <input
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="ex: urgente, frontend, bug"
                  className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-gray-800/50 text-gray-300 px-4 py-3 rounded-lg text-sm border border-gray-700/50">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white px-4 py-2.5 rounded-lg transition font-medium shadow-lg"
                >
                  {editingTarefa ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
