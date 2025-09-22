import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, Calendar, Bell, Share2, Filter, Plus, MoreHorizontal, MessageCircle, Paperclip, Users } from 'lucide-react';
import './Home.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { byPrefixAndName } from '@fortawesome/free-solid-svg-icons';


const API_BASE_URL = 'http://localhost:5000/api';

// API functions
const api = {
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/tasks?${params}`);
    return response.json();
  },
  
  createTask: async (task) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return response.json();
  },
  
  updateTask: async (id, task) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return response.json();
  },
  
  updateTaskStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  },
  
  deleteTask: async (id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    return response.json();
  }
};

// Avatar Component
const Avatar = ({ name, color = '#6366f1', size = 'sm' }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  
  return (
    <div 
      className={`avatar avatar-${size}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onStatusChange, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  
  const priorityColors = {
    low: '#f59e0b',
    medium: '#3b82f6',
    high: '#ef4444'
  };
  
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'inprogress', label: 'In Progress' },
    { value: 'done', label: 'Done' }
  ];
  
  const avatarColors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  
  return (
    <div className="task-card">
      <div className="task-card-header">
        <div className="task-priority">
          <div 
            className="priority-dot"
            style={{ backgroundColor: priorityColors[task.priority] }}
          />
          <span className="priority-text">
            {task.priority}
          </span>
        </div>
        <div className="task-actions">
          <button 
            onClick={() => setShowActions(!showActions)}
            className="actions-button"
          >
            <MoreHorizontal className="icon-small" />
          </button>
          {showActions && (
            <div className="actions-dropdown">
              <select 
                value={task.status}
                onChange={(e) => {
                  onStatusChange(task.id, e.target.value);
                  setShowActions(false);
                }}
                className="status-select"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => {
                  onDelete(task.id);
                  setShowActions(false);
                }}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="task-title">{task.title}</h3>
      <p className="task-description">{task.description}</p>
      
      <div className="task-footer">
        <div className="task-assignees">
          {task.assignees && task.assignees.slice(0, 3).map((assignee, index) => (
            <Avatar 
              key={index} 
              name={assignee} 
              color={avatarColors[index % avatarColors.length]}
              size="sm"
            />
          ))}
          {task.assignees && task.assignees.length > 3 && (
            <div className="assignee-count">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
        
        <div className="task-metadata">
          {task.comments > 0 && (
            <div className="metadata-item">
              <MessageCircle className="icon-small" />
              <span className="metadata-text">{task.comments}</span>
            </div>
          )}
          {task.files > 0 && (
            <div className="metadata-item">
              <Paperclip className="icon-small" />
              <span className="metadata-text">{task.files}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Task Modal
const AddTaskModal = ({ isOpen, onClose, onAdd, status }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: status || 'todo',
    priority: 'medium',
    category: 'work',
    assignees: []
  });

  console.log(formData);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onAdd(formData);
      setFormData({
        title: '',
        description: '',
        status: status || 'todo',
        priority: 'medium',
        category: 'work',
        assignees: []
      });
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows="3"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group-half">
              <label className="form-label">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="form-group-half">
              <label className="form-label">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="urgent">Urgent</option>
                <option value="research">Research</option>
                <option value="design">Design</option>
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Column Component
const Column = ({ 
  title, 
  status, 
  tasks, 
  count, 
  color, 
  onAddTask, 
  onStatusChange, 
  onEdit, 
  onDelete,
  isAddModalOpen,
  onOpenAddModal,
  onCloseAddModal
}) => {
  return (
    <div className="column width">
      <div className="column-header">
        <div className="column-title-group">
          <div className="column-indicator" style={{display: 'flex', alignItems: 'center'}} />
          <h2 className="column-title">{title}</h2> 
        </div>
        <span className="task-count">
          {count}
        </span>
        <button 
          onClick={() => onOpenAddModal(status)}
          className="add-task-button"
        >
          <Plus className="icon-small" />
        </button>
      </div>
      
      <div className="tasks-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        
        {/* <button 
          className="add-task-card"
          onClick={() => onOpenAddModal(status)}
        >
          <Plus className="icon-small" />
          <span>Add a card</span>
        </button> */}
      </div>
      
      <AddTaskModal
        isOpen={isAddModalOpen === status}
        onClose={onCloseAddModal}
        onAdd={(task) => {
          onAddTask({ ...task, status });
          onCloseAddModal();
        }}
        status={status}
      />
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ todo: 0, inprogress: 0, done: 0 });
  const [activeModal, setActiveModal] = useState(null); 
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    loadTasks();
    loadStats();
  }, [filters]);
  
  const loadTasks = async () => {
    try {
      const data = await api.getTasks(filters);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  const handleAddTask = async (taskData) => {
    try {
      const newTask = await api.createTask(taskData);
      setTasks([newTask, ...tasks]);
      loadStats();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };
  
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      loadStats();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };
  
  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      loadStats();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const todoTasks = filteredTasks.filter(task => task.status === 'todo');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'inprogress');
  const doneTasks = filteredTasks.filter(task => task.status === 'done');
  
  const projects = [
    { name: 'Mobile App', color: '#6366f1', active: true },
    { name: 'Website Redesign', color: '#f59e0b', active: false },
    { name: 'Design System', color: '#8b5cf6', active: false },
    { name: 'Wireframes', color: '#10b981', active: false }
  ];
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="project-info">
            <div className="project-icon">
              <span className="project-initials">PM</span>
            </div>
            <span className="project-name">Project M.</span>
            <ChevronLeft className="chevron-icon" />
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <a href="#" className="nav-item">
              <div className="nav-icon"></div>
              <span>Home</span>
            </a>
            <a href="#" className="nav-item">
              <MessageCircle className="icon-medium" />
              <span>Messages</span>
            </a>
            <a href="#" className="nav-item nav-item-active">
              <div className="nav-icon nav-icon-active"></div>
              <span>Tasks</span>
            </a>
            <a href="#" className="nav-item">
              <Users className="icon-medium" />
              <span>Members</span>
            </a>
          </div>
          
          <div className="projects-section">
            <h3 className="section-title">
              MY PROJECTS
            </h3>
            <div className="projects-list">
              {projects.map((project, index) => (
                <a 
                  key={index}
                  href="#" 
                  className={`project-item ${project.active ? 'project-item-active' : ''}`}
                >
                  <div className="project-info-row">
                    <div className="project-color-indicator" style={{ backgroundColor: project.color }} />
                    <span>{project.name}</span>
                  </div>
                  <MoreHorizontal className="icon-small" />
                </a>
              ))}
            </div>
          </div>
        </nav>
        
        <div className="sidebar-footer">
          <div className="thoughts-card">
            <div className="thoughts-icon">
              💡
            </div>
            <h4 className="thoughts-title">Thoughts Time</h4>
            <p className="thoughts-description">
              We don't have any notice for you, till then you can share your thoughts with your peers.
            </p>
            <button className="thoughts-button">
              Write a message
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#f9fafb'}}> 
      <div className="search-container">
                <Search className="search-icon" style={{height: '25px', width: '25px'}} />
                <input
                  type="text"
                  placeholder="Search for anything..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="header-right" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              
              <button className="header-action-button">
                <Calendar className="icon-medium" />
              </button>
              <button className="header-action-button">
                <Bell className="icon-medium" />
              </button>
              <button className="header-action-button">
                ?
              </button>
              <div className="user-info">
                {/* <Avatar name="Palak Jain" size="md" /> */}
                <div className="user-details">
                  <div className="user-name">Palak Jain</div>
                  <div className="user-location">Rajasthan, India</div>
                </div>
              </div>
            </div>
            </div>
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '1rem'}}>
              <div className="page-title-group">
                <h1 className="page-title">Mobile App</h1>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}> 
                {/* <FontAwesomeIcon icon={byPrefixAndName.fas['pencil']} />
                <FontAwesomeIcon icon={byPrefixAndName.fas['expand']} /> */}
                </div>
                {/* <div className="title-icon title-icon-blue"></div>
                <div className="title-icon title-icon-gray"></div> */}
              </div>

              <div className='images-container'>
              <button className="invite-button">
                <Plus className="icon-small" />
                <span>Invite</span>
              </button>
              <div className="team-avatars">
                <Avatar style={{height: '2rem', width: '2rem', marginRight: '10px'}} className="avatar-image" name="John Doe" color="#6366f1" />
                <Avatar style={{height: '2rem', width: '2rem', marginRight: '10px'}} className="avatar-image" name="Jane Smith" color="#8b5cf6" />
                <Avatar style={{height: '2rem', width: '2rem', marginRight: '10px'}} className="avatar-image" name="Mike Johnson" color="#10b981" />
                <Avatar style={{height: '2rem', width: '2rem', marginRight: '10px'}} className="avatar-image" name="Sarah Wilson" color="#f59e0b" />
                <div className="avatar-count">
                  +2
                </div>
              </div>
              </div>
             
            </div>
            
          
          </div>
        </header>
        
        {/* Filters and Actions */}
        <div className="toolbar">
          <div className="toolbar-content">
            <div className="toolbar-left">
              <button className="toolbar-button">
                <Filter className="icon-small" />
                <span>Filter</span>
              </button>
              <button className="toolbar-button">
                <Calendar className="icon-small" />
                <span>Today</span>
              </button>
            </div>
            
            <div className="toolbar-right">
              <button className="toolbar-button">
                <Share2 className="icon-small" />
                <span>Share</span>
              </button>
              <div className="toolbar-divider"></div>
              <button className="primary-action-button">
                <div className="action-icon"></div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Kanban Board */}
        <div className="board-container">
          <div className="board">
            <Column
              title="To Do"
              status="todo"
              tasks={todoTasks}
              count={stats.todo}
              color="#3b82f6"
              onAddTask={handleAddTask}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
              isAddModalOpen={activeModal}
              onOpenAddModal={setActiveModal}
              onCloseAddModal={() => setActiveModal(null)}
            />
            
            <Column
              title="On Progress"
              status="inprogress"
              tasks={inProgressTasks}
              count={stats.inprogress}
              color="#f59e0b"
              onAddTask={handleAddTask}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
              isAddModalOpen={activeModal}
              onOpenAddModal={setActiveModal}
              onCloseAddModal={() => setActiveModal(null)}
            />
            
            <Column
              title="Done"
              status="done"
              tasks={doneTasks}
              count={stats.done}
              color="#10b981"
              onAddTask={handleAddTask}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
              isAddModalOpen={activeModal}
              onOpenAddModal={setActiveModal}
              onCloseAddModal={() => setActiveModal(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;