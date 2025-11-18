import React, { useState, useEffect } from 'react';
import {
  Trash2, Plus, CheckCircle2, Circle, AlertCircle, Calendar,
  Clock, Users, Save, RefreshCw, Settings, Filter,
  ChevronDown, Edit2, Eye, EyeOff, Send
} from 'lucide-react';
import './Page.css';

interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'set priority' | 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  dueDate?: string;
  assignee?: string;
  category?: string;
  tags?: string[];
  attachments?: string[];
  comments?: Comment[];
  estimatedHours?: number;
  actualHours?: number;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  subtasks?: Subtask[];
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

const Page: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState< 'set priority' | 'low' | 'medium' | 'high' | 'urgent'>('set priority');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'review' | 'done'>('todo');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
  const [showN8nSettings, setShowN8nSettings] = useState(false);
  const [n8nEvents, setN8nEvents] = useState({
    onCreate: true,
    onUpdate: true,
    onDelete: true,
    onStatusChange: true,
    onAssign: true,
    onComment: true,
  });
  const [selectedTodo, setSelectedTodo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');

  useEffect(() => {
    const stored = localStorage.getItem('smartTodos');
    const webhook = localStorage.getItem('n8nWebhook');
    const events = localStorage.getItem('n8nEvents');
    
    if (stored) {
      try {
        setTodos(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load todos:', e);
      }
    }
    if (webhook) setN8nWebhookUrl(webhook);
    if (events) setN8nEvents(JSON.parse(events));
  }, []);

  useEffect(() => {
    localStorage.setItem('smartTodos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('n8nWebhook', n8nWebhookUrl);
    localStorage.setItem('n8nEvents', JSON.stringify(n8nEvents));
  }, [n8nWebhookUrl, n8nEvents]);

  const sendToN8N = async (event: string, data: any) => {
    if (!n8nWebhookUrl) return;

    const eventEnabled = n8nEvents[event as keyof typeof n8nEvents];
    if (!eventEnabled) return;

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
          source: 'smart-todo-list',
        }),
      });

      if (!response.ok) {
        console.warn('n8n webhook error:', response.status);
      }
    } catch (err) {
      console.error('Failed to send to n8n:', err);
    }
  };

  const handleAddTodo = async () => {
    if (!input.trim()) {
      setError('Please enter a task title');
      return;
    }

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: input,
      description,
      completed: false,
      priority,
      status,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      category: category || undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      subtasks: [],
      comments: [],
      tags: [],
    };

    setTodos([newTodo, ...todos]);
    await sendToN8N('onCreate', newTodo);
    
    setInput('');
    setDescription('');
    setPriority('set priority');
    setDueDate('');
    setAssignee('');
    setCategory('');
    setEstimatedHours('');
    setStatus('todo');
    setError(null);
  };

  const handleToggle = async (id: string) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updated);
    const updatedTodo = updated.find((t) => t.id === id)!;
    await sendToN8N('onUpdate', updatedTodo);
  };

  const handleStatusChange = async (id: string, newStatus: Todo['status']) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, status: newStatus } : todo
    );
    setTodos(updated);
    const updatedTodo = updated.find((t) => t.id === id)!;
    await sendToN8N('onStatusChange', { id, status: newStatus, todo: updatedTodo });
  };

  const handleDelete = async (id: string) => {
    const todo = todos.find((t) => t.id === id)!;
    setTodos(todos.filter((t) => t.id !== id));
    await sendToN8N('onDelete', { id, deletedTodo: todo });
  };

  const handleAddComment = async (todoId: string) => {
    if (!newComment.trim()) return;

    const updated = todos.map((todo) =>
      todo.id === todoId
        ? {
            ...todo,
            comments: [
              ...(todo.comments || []),
              {
                id: Date.now().toString(),
                author: 'You',
                text: newComment,
                timestamp: new Date().toISOString(),
              },
            ],
          }
        : todo
    );
    setTodos(updated);
    const updatedTodo = updated.find((t) => t.id === todoId)!;
    await sendToN8N('onComment', { id: todoId, comment: newComment, todo: updatedTodo });
    setNewComment('');
  };

  const handleAssign = async (id: string, newAssignee: string) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, assignee: newAssignee } : todo
    );
    setTodos(updated);
    const updatedTodo = updated.find((t) => t.id === id)!;
    await sendToN8N('onAssign', { id, assignee: newAssignee, todo: updatedTodo });
  };

  const filteredTodos = todos
    .filter((todo) => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter((todo) =>
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    active: todos.filter((t) => !t.completed).length,
    inProgress: todos.filter((t) => t.status === 'in-progress').length,
    highpriority: todos.filter((t) => t.priority === 'high' || t.priority === 'urgent').length,
  };

  const statusCounts = {
    todo: todos.filter((t) => t.status === 'todo').length,
    'in-progress': todos.filter((t) => t.status === 'in-progress').length,
    review: todos.filter((t) => t.status === 'review').length,
    done: todos.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">Smart Todo Manager</h1>
            <p className="app-subtitle">Advanced Task Management with n8n Integration</p>
          </div>
          <div className="header-right">
            <button
              onClick={() => setShowN8nSettings(!showN8nSettings)}
              className="btn-settings"
              title="n8n Settings"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>

        {showN8nSettings && (
          <div className="n8n-settings-panel">
            <div className="settings-content">
              <h3>n8n Webhook Configuration</h3>
              <input
                type="text"
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                placeholder="Enter your n8n webhook URL..."
                className="webhook-input"
              />
              
              <div className="event-toggles">
                <h4>Enable Event Triggers:</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={n8nEvents.onCreate}
                    onChange={(e) => setN8nEvents({ ...n8nEvents, onCreate: e.target.checked })}
                  />
                  Task Created
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={n8nEvents.onUpdate}
                    onChange={(e) => setN8nEvents({ ...n8nEvents, onUpdate: e.target.checked })}
                  />
                  Task Updated
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={n8nEvents.onDelete}
                    onChange={(e) => setN8nEvents({ ...n8nEvents, onDelete: e.target.checked })}
                  />
                  Task Deleted
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={n8nEvents.onStatusChange}
                    onChange={(e) => setN8nEvents({ ...n8nEvents, onStatusChange: e.target.checked })}
                  />
                  Status Changed
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={n8nEvents.onAssign}
                    onChange={(e) => setN8nEvents({ ...n8nEvents, onAssign: e.target.checked })}
                  />
                  Task Assigned
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={n8nEvents.onComment}
                    onChange={(e) => setN8nEvents({ ...n8nEvents, onComment: e.target.checked })}
                  />
                  Comment Added
                </label>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="app-main">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <div className="stat-details">
              <span className="stat-label">Total</span>
              <span className="stat-number">{stats.total}</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">✅</span>
            <div className="stat-details">
              <span className="stat-label">Completed</span>
              <span className="stat-number">{stats.completed}</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⚡</span>
            <div className="stat-details">
              <span className="stat-label">In Progress</span>
              <span className="stat-number">{stats.inProgress}</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔥</span>
            <div className="stat-details">
              <span className="stat-label">High priority</span>
              <span className="stat-number">{stats.highpriority}</span>
            </div>
          </div>
        </div>

        <div className="layout-wrapper">
          <aside className="sidebar">
            <div className="sidebar-section">
              <h3>Status</h3>
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="sidebar-item">
                  <span>{status.replace('-', ' ')}</span>
                  <span className="badge">{count}</span>
                </div>
              ))}
            </div>

            <div className="sidebar-section">
              <h3>View Mode</h3>
              <div className="view-buttons">
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📋
                </button>
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  📦
                </button>
                <button
                  className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                  onClick={() => setViewMode('kanban')}
                >
                  📊
                </button>
              </div>
            </div>
          </aside>

          

            {error && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-card">
              <h2>New Task</h2>
              <div className="form-grid">
                <div className="form-column-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                    placeholder="Task title..."
                    className="form-input-large"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task description..."
                    className="form-textarea"
                    rows={4}
                  />
                </div>

                <div className="form-column-2">
                  <div className="form-group">
                    <label>priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="form-select">
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                      <option value="urgent">🚨 Urgent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="form-select">
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="form-input" />
                  </div>

                  <div className="form-group">
                    <label>Assignee</label>
                    <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name..." className="form-input" />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category..." className="form-input" />
                  </div>

                  <div className="form-group">
                    <label>Est. Hours</label>
                    <input type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="Hours..." className="form-input" />
                  </div>
                </div>
              </div>

              <button onClick={handleAddTodo} className="btn-primary">
                <Plus size={20} />
                Create Task
              </button>

              <div className="main-content">
            <div className="controls-section">
              <div className="search-box">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Search tasks..."
                  className="search-input"
                />
              </div>

              <div className="filter-controls">
                {(['all', 'active', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            </div>

            

            <div className={`todos-container ${viewMode}`}>
              {filteredTodos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No tasks found</p>
                </div>
              ) : (
                filteredTodos.map((todo) => (
                  <div key={todo.id} className={`todo-card ${todo.status}`}>
                    <div className="todo-header">
                      <button
                        onClick={() => handleToggle(todo.id)}
                        className="checkbox-btn"
                      >
                        {todo.completed ? (
                          <CheckCircle2 size={24} className="checked" />
                        ) : (
                          <Circle size={24} />
                        )}
                      </button>
                      <div className="todo-title-section">
                        <h3 className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                          {todo.title}
                        </h3>
                        {todo.category && <span className="category-badge">{todo.category}</span>}
                      </div>
                      <button onClick={() => handleDelete(todo.id)} className="btn-delete-small">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {todo.description && (
                      <p className="todo-description">{todo.description}</p>
                    )}

                    <div className="todo-meta">
                      <div className="meta-item">
                        <span className={`priority-badge ${todo.priority}`}>{todo.priority}</span>
                      </div>
                      {todo.dueDate && (
                        <div className="meta-item">
                          <Calendar size={14} />
                          <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {todo.assignee && (
                        <div className="meta-item">
                          <Users size={14} />
                          <span>{todo.assignee}</span>
                        </div>
                      )}
                      {todo.estimatedHours && (
                        <div className="meta-item">
                          <Clock size={14} />
                          <span>{todo.estimatedHours}h</span>
                        </div>
                      )}
                    </div>

                    <div className="todo-status-selector">
                      <select
                        value={todo.status}
                        onChange={(e) => handleStatusChange(todo.id, e.target.value as any)}
                        className="status-select"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div className="todo-comments">
                      {(todo.comments || []).length > 0 && (
                        <div className="comments-list">
                          {todo.comments.map((comment) => (
                            <div key={comment.id} className="comment">
                              <strong>{comment.author}:</strong> {comment.text}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="add-comment">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          className="comment-input"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setNewComment((e.target as any).value);
                              handleAddComment(todo.id);
                              (e.target as any).value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;
