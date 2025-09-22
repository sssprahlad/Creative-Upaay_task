const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./tasks.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'work',
    dueDate TEXT,
    comments INTEGER DEFAULT 0,
    files INTEGER DEFAULT 0,
    assignees TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert sample data
  db.run(`INSERT OR IGNORE INTO projects (id, name, color) VALUES 
    (1, 'Mobile App', '#6366f1'),
    (2, 'Website Redesign', '#f59e0b'),
    (3, 'Design System', '#8b5cf6'),
    (4, 'Wireframes', '#10b981')
  `);

  // Insert sample tasks
  const sampleTasks = [
    {
      title: 'Brainstorming',
      description: 'Brainstorming brings team members diverse experience into play.',
      status: 'todo',
      priority: 'low',
      category: 'work',
      comments: 12,
      files: 0,
      assignees: JSON.stringify(['user1', 'user2', 'user3'])
    },
    {
      title: 'Research',
      description: 'User research helps you to create an optimal product for users.',
      status: 'todo',
      priority: 'high',
      category: 'research',
      comments: 10,
      files: 3,
      assignees: JSON.stringify(['user1', 'user2'])
    },
    {
      title: 'Wireframes',
      description: 'Low fidelity wireframes include the most basic content and visuals.',
      status: 'todo',
      priority: 'high',
      category: 'design',
      comments: 12,
      files: 15,
      assignees: JSON.stringify(['user1', 'user2', 'user3'])
    },
    {
      title: 'Brainstorming',
      description: 'Brainstorming brings team members diverse experience into play.',
      status: 'inprogress',
      priority: 'low',
      category: 'work',
      comments: 12,
      files: 0,
      assignees: JSON.stringify(['user1', 'user2', 'user3'])
    },
    {
      title: 'Brainstorming',
      description: 'Brainstorming brings team members diverse experience into play.',
      status: 'inprogress',
      priority: 'low',
      category: 'work',
      comments: 12,
      files: 0,
      assignees: JSON.stringify(['user1', 'user2', 'user3'])
    },
    {
      title: 'Brainstorming',
      description: 'Brainstorming brings team members diverse experience into play.',
      status: 'done',
      priority: 'low',
      category: 'work',
      comments: 12,
      files: 0,
      assignees: JSON.stringify(['user1', 'user2', 'user3'])
    },
    {
      title: 'Design System',
      description: 'It just needs to adapt the UI from what you did before.',
      status: 'done',
      priority: 'medium',
      category: 'design',
      comments: 12,
      files: 15,
      assignees: JSON.stringify(['user1', 'user2', 'user3'])
    }
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO tasks (title, description, status, priority, category, comments, files, assignees) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  sampleTasks.forEach(task => {
    stmt.run(task.title, task.description, task.status, task.priority, task.category, task.comments, task.files, task.assignees);
  });
  stmt.finalize();
});

// API Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const { status, priority, category } = req.query;
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Parse assignees JSON for each task
    const tasks = rows.map(task => ({
      ...task,
      assignees: JSON.parse(task.assignees)
    }));
    
    res.json(tasks);
  });
});

// Get single task
app.get('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    const task = {
      ...row,
      assignees: JSON.parse(row.assignees)
    };
    
    res.json(task);
  });
});

// Create new task
app.post('/api/tasks', (req, res) => {
  const { title, description, status = 'todo', priority = 'medium', category = 'work', dueDate, assignees = [] } = req.body;
  
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const query = `INSERT INTO tasks (title, description, status, priority, category, dueDate, assignees) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [title, description, status, priority, category, dueDate, JSON.stringify(assignees)], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Return the created task
    db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const task = {
        ...row,
        assignees: JSON.parse(row.assignees)
      };
      
      res.status(201).json(task);
    });
  });
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, category, dueDate, assignees } = req.body;
  
  const query = `UPDATE tasks 
                 SET title = ?, description = ?, status = ?, priority = ?, category = ?, dueDate = ?, assignees = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`;
  
  db.run(query, [title, description, status, priority, category, dueDate, JSON.stringify(assignees), id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    // Return updated task
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const task = {
        ...row,
        assignees: JSON.parse(row.assignees)
      };
      
      res.json(task);
    });
  });
});

// Update task status (for drag and drop)
app.patch('/api/tasks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['todo', 'inprogress', 'done'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  
  db.run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    res.json({ message: 'Task status updated successfully' });
  });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    res.json({ message: 'Task deleted successfully' });
  });
});

// Get all projects
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get task statistics
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM tasks', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    stats.total = row.total;
    
    db.get("SELECT COUNT(*) as todo FROM tasks WHERE status = 'todo'", (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      stats.todo = row.todo;
      
      db.get("SELECT COUNT(*) as inprogress FROM tasks WHERE status = 'inprogress'", (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        stats.inprogress = row.inprogress;
        
        db.get("SELECT COUNT(*) as done FROM tasks WHERE status = 'done'", (err, row) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          stats.done = row.done;
          
          res.json(stats);
        });
      });
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});