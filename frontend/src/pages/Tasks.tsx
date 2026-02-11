import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Assignment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

interface Task {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  dueDate: string;
  progress: number;
  createdAt: string;
}

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchTasks();
  }, [searchTerm, statusFilter, priorityFilter, assignedToFilter, dateFilter, sortBy, sortOrder]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;
      if (assignedToFilter) filters.assignedTo = assignedToFilter;
      if (dateFilter) filters.date = dateFilter;
      // backend supports sortBy and sortOrder (createdAt, dueDate, priority, status)
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;

      const response = await apiService.getTasks(filters);
      console.log('=== API RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response tasks:', response.tasks);
      console.log('Response type:', typeof response);
      
      const fetchedTasks = response.tasks || response;
      console.log('Fetched tasks:', fetchedTasks);
      console.log('Fetched tasks length:', fetchedTasks?.length);

      // Apply client-side search across title/description/assignee text
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const filtered = normalizedSearch
        ? fetchedTasks.filter((task: any) => {
            const title = task.title?.toLowerCase() || '';
            const description = task.description?.toLowerCase() || '';
            const assignedTo =
              typeof task.assignedTo === 'string'
                ? task.assignedTo.toLowerCase()
                : (task.assignedTo?.name || '').toLowerCase();
            return (
              title.includes(normalizedSearch) ||
              description.includes(normalizedSearch) ||
              assignedTo.includes(normalizedSearch)
            );
          })
        : fetchedTasks;

      const normalizedTasks: Task[] = filtered.map((task: any) => ({
        id: task._id || task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo:
          typeof task.assignedTo === 'string'
            ? task.assignedTo
            : task.assignedTo?.name || 'Unassigned',
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
        progress: task.progress ?? 0,
        createdAt: task.createdAt,
      }));

      setTasks(normalizedTasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !selectedTask._id) return;
    
    try {
      await apiService.deleteTask(selectedTask._id);
      setSuccess('Task deleted successfully');
      fetchTasks();
    } catch (err: any) {
      console.error('Failed to delete task', err);
      setError(err?.response?.data?.message || 'Failed to delete task');
    }
    
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'assigned': return 'info';
      case 'on_hold': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Tasks Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Task
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
          />
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            SelectProps={{ native: true }}
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </TextField>
          <TextField
            select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            SelectProps={{ native: true }}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </TextField>
          <TextField
            label="Employee (ID or name)"
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            sx={{ minWidth: 220 }}
            placeholder="Filter by employee"
          />
          <TextField
            label="Due Date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <TextField
            select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'status')}
            sx={{ minWidth: 180 }}
            SelectProps={{ native: true }}
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </TextField>
          <TextField
            select
            label="Order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            sx={{ minWidth: 150 }}
            SelectProps={{ native: true }}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </TextField>
        </Box>
      </Paper>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" sx={{ py: 4 }}>
                      No tasks found. Try adjusting your filters or create a new task.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task, index) => {
                  console.log(`=== TASK ${index} ===`);
                  console.log('Task object keys:', Object.keys(task));
                  console.log('Task object:', JSON.stringify(task, null, 2));
                  console.log('Task _id:', task._id, typeof task._id);
                  console.log('Task id:', task.id, typeof task.id);
                  
                  return (
                  <TableRow 
                    key={task._id || task.id || `task-${index}`}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    onClick={() => {
                      const taskId = task._id || task.id;
                      console.log('=== NAVIGATING TO TASK ===');
                      console.log('Task _id being used:', taskId);
                      console.log('Navigation URL:', `/tasks/${taskId}`);
                      if (taskId) {
                        navigate(`/tasks/${taskId}`);
                      } else {
                        console.error('❌ No valid task ID found');
                      }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{task.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {task.description.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{task.assignedTo}</TableCell>
                    <TableCell>
                      <Chip
                        label={task.status.replace('_', ' ')}
                        color={getStatusColor(task.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <Box
                            sx={{
                              height: 8,
                              backgroundColor: 'grey.300',
                              borderRadius: 4,
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                backgroundColor: 'primary.main',
                                borderRadius: 4,
                                width: `${task.progress}%`,
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2">{task.progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, task);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedTask && selectedTask._id) {
            console.log('=== MENU NAVIGATING TO TASK ===');
            console.log('Selected task _id:', selectedTask._id);
            navigate(`/tasks/${selectedTask._id}`);
          }
          handleMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} /> Edit Task
        </MenuItem>
        <MenuItem onClick={handleDeleteTask}>
          <Delete sx={{ mr: 1 }} /> Delete Task
        </MenuItem>
      </Menu>

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Typography>
            This will redirect you to the Create Task page where you can fill in all the details.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setCreateDialogOpen(false);
              window.location.href = '/tasks/create';
            }}
          >
            Go to Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Tasks;
