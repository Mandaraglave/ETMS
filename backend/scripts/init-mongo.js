// MongoDB initialization script
db = db.getSiblingDB('etms');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password', 'role'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'must be a valid email address and is required'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'must be a string with at least 6 characters and is required'
        },
        role: {
          enum: ['admin', 'employee'],
          description: 'must be either admin or employee and is required'
        }
      }
    }
  }
});

db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'assignedTo', 'assignedBy', 'status', 'priority', 'dueDate', 'estimatedTime'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        description: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        assignedTo: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId and is required'
        },
        assignedBy: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId and is required'
        },
        status: {
          enum: ['assigned', 'in_progress', 'on_hold', 'completed', 'approved', 'rejected'],
          description: 'must be one of the valid status values and is required'
        },
        priority: {
          enum: ['low', 'medium', 'high'],
          description: 'must be one of the valid priority values and is required'
        },
        dueDate: {
          bsonType: 'date',
          description: 'must be a date and is required'
        },
        estimatedTime: {
          bsonType: 'number',
          minimum: 0,
          description: 'must be a positive number and is required'
        },
        progress: {
          bsonType: 'number',
          minimum: 0,
          maximum: 100,
          description: 'must be a number between 0 and 100'
        }
      }
    }
  }
});

db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['recipient', 'title', 'message', 'type'],
      properties: {
        recipient: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId and is required'
        },
        title: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        message: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        type: {
          enum: ['task_assigned', 'task_updated', 'task_completed', 'task_approved', 'task_rejected', 'deadline_reminder', 'system'],
          description: 'must be one of the valid notification types and is required'
        },
        isRead: {
          bsonType: 'bool',
          description: 'must be a boolean'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });

db.tasks.createIndex({ assignedTo: 1, status: 1 });
db.tasks.createIndex({ assignedBy: 1, createdAt: -1 });
db.tasks.createIndex({ dueDate: 1 });
db.tasks.createIndex({ status: 1 });

db.notifications.createIndex({ recipient: 1, isRead: 1, createdAt: -1 });
db.notifications.createIndex({ createdAt: -1 });

// Insert initial admin user (password: admin123)
db.users.insertOne({
  name: 'System Administrator',
  email: 'admin@etms.com',
  password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
  role: 'admin',
  employeeId: 'ADMIN001',
  designation: 'System Administrator',
  department: 'IT',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialization completed successfully!');
