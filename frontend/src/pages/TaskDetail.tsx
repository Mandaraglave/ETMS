import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Slider,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  Assignment,
  Person,
  Schedule,
  Flag,
  Comment,
  CheckCircle,
  Block,
  AttachFile,
  CloudUpload,
  SwapHoriz,
  Download,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface ProgressUpdate {
  progress: number;
  comment: string;
  timestamp: string;
  updatedBy: string | { name?: string };
}

interface TaskAttachment {
  originalName?: string;
  filename?: string;
  size?: number;
  uploadedAt?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  assignedToId?: string;
  assignedBy: string;
  dueDate: string;
  progress: number;
  createdAt: string;
  progressHistory?: ProgressUpdate[];
  attachments?: TaskAttachment[];
}

const TaskDetail: React.FC = () => {
  const params = useParams<{ id: string }>();
  console.log('=== TASK DETAIL DEBUG ===');
  console.log('useParams raw:', params);
  console.log('useParams id:', params.id, typeof params.id);
  console.log('URL:', window.location.href);
  
  const id = params.id;
  console.log('Final id value:', id, typeof id);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [progressComment, setProgressComment] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState('');
  const [employees, setEmployees] = useState<{ id: string; name: string; email: string }[]>([]);
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    console.log('=== TASK DETAIL USEEFFECT ===');
    console.log('ID from params:', id);
    console.log('ID type:', typeof id);
    
    if (id && id !== 'undefined') {
      fetchTask();
    } else if (id === 'undefined' || !id) {
      console.log('❌ Invalid ID detected, redirecting to tasks');
      setError('Invalid task ID - redirecting to tasks list');
      setTimeout(() => {
        navigate('/tasks', { replace: true });
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTask = async () => {
    if (!id || id === 'undefined') {
      console.log('❌ No valid ID provided, skipping fetch');
      setError('Invalid task ID');
      setLoading(false);
      return;
    }

    // Ensure id is a string
    const taskId = typeof id === 'string' ? id : String(id);
    console.log('Fetching task with ID:', taskId, typeof taskId);
    
    setLoading(true);
    setError(null);

    try {
      const { task: apiTask } = await apiService.getTaskById(taskId);
      const normalized = normalizeTask(apiTask);
      setTask(normalized);
      setNewProgress(normalized.progress);
    } catch (err: any) {
      console.error('Fetch task error:', err);
      setError(err?.response?.data?.message || 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const normalizeTask = (apiTask: any): Task => ({
    _id: String(apiTask._id || apiTask.id || ''),
    title: apiTask.title,
    description: apiTask.description,
    status: apiTask.status,
    priority: apiTask.priority,
    assignedTo: typeof apiTask.assignedTo === 'object' ? apiTask.assignedTo?.name || 'Unknown' : apiTask.assignedTo,
    assignedToId: typeof apiTask.assignedTo === 'object' ? String(apiTask.assignedTo?._id || '') : String(apiTask.assignedTo || ''),
    assignedBy: typeof apiTask.assignedBy === 'object' ? apiTask.assignedBy?.name || 'Unknown' : apiTask.assignedBy,
    dueDate: apiTask.dueDate,
    progress: apiTask.progress ?? 0,
    createdAt: apiTask.createdAt,
    progressHistory: (apiTask.updates || []).map((u: any) => ({
      progress: u.progress ?? 0,
      comment: u.comment || '',
      timestamp: u.timestamp || u.createdAt,
      updatedBy: typeof u.updatedBy === 'object' ? u.updatedBy?.name || 'Unknown' : u.updatedBy,
    })),
    attachments: apiTask.attachments || [],
  });

  const handleProgressUpdate = async () => {
    if (!task) return;

    try {
      const comment = progressComment.trim() || `Progress updated to ${newProgress}%`;
      const { task: updatedTask } = await apiService.addTaskUpdate(task._id, comment, newProgress);
      setTask(normalizeTask(updatedTask));
      setSuccess(`Progress updated to ${newProgress}%`);
      setIsEditing(false);
      setProgressComment('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update progress');
    }
  };

  const handleApprove = async () => {
    if (!task) return;
    try {
      const { task: updatedTask } = await apiService.updateTaskStatus(task._id, 'approved');
      setTask(normalizeTask(updatedTask));
      setSuccess('Task approved successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to approve task');
    }
  };

  const handleReject = async () => {
    if (!task) return;
    try {
      const { task: updatedTask } = await apiService.updateTaskStatus(task._id, 'rejected', undefined, rejectReason || 'Task rejected - rework needed');
      setTask(normalizeTask(updatedTask));
      setRejectDialogOpen(false);
      setRejectReason('');
      setSuccess('Task rejected');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reject task');
    }
  };

  const handleReassignOpen = async () => {
    setReassignDialogOpen(true);
    setReassignTo(task?.assignedToId || '');
    try {
      const res = await apiService.getUsers({ role: 'employee', status: 'active' } as any);
      const list = res.users || res;
      setEmployees(list.map((u: any) => ({ id: u._id || u.id, name: u.name, email: u.email })));
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const handleReassign = async () => {
    if (!task || !reassignTo) return;
    setReassigning(true);
    setError(null);
    try {
      const { task: updatedTask } = await apiService.reassignTask(task._id, reassignTo);
      setTask(normalizeTask(updatedTask));
      setReassignDialogOpen(false);
      setSuccess('Task reassigned successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reassign task');
    } finally {
      setReassigning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    setError(null);
    try {
      const resp = await apiService.uploadTaskAttachments(task._id, files);
      const updatedTask = resp?.attachments ? { ...task, attachments: resp.attachments } : task;
      setTask(updatedTask as Task);
      setSuccess(`Uploaded ${files.length} file(s)`);
      e.target.value = '';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading task details...</Typography>
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" component="div">
            {error || 'Task not found'}
          </Typography>
          <Typography variant="body2" component="div">
            Invalid task ID detected. You will be redirected to the tasks list automatically.
          </Typography>
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tasks')}
          sx={{ mt: 2 }}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/tasks')}
          sx={{ mr: 2 }}
        >
          Back to Tasks
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {task.title}
        </Typography>
        <Chip
          label={task.status.replace('_', ' ')}
          color={getStatusColor(task.status) as any}
          sx={{ mr: 1 }}
        />
        <Chip
          label={task.priority}
          color={getPriorityColor(task.priority) as any}
        />
        {user?.role === 'admin' && task.status === 'completed' && (
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleApprove}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Block />}
              onClick={() => setRejectDialogOpen(true)}
            >
              Reject
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Task Details */}
        <Box sx={{ flex: '2 1 600px', minWidth: 300 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Description
              </Typography>
              <Typography variant="body1">
                {task.description}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  <Assignment sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Assigned To
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{task.assignedTo}</Typography>
                  {user?.role === 'admin' && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SwapHoriz />}
                      onClick={handleReassignOpen}
                    >
                      Reassign
                    </Button>
                  )}
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Assigned By
                </Typography>
                <Typography variant="body1">{task.assignedBy}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  <Schedule sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Due Date
                </Typography>
                <Typography variant="body1">{formatDate(task.dueDate)}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  <Flag sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Priority
                </Typography>
                <Chip
                  label={task.priority}
                  color={getPriorityColor(task.priority) as any}
                  size="small"
                />
              </Box>
            </Box>

            {/* Sender's Original Attachments */}
            {(task.attachments || []).length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFile />
                  Task Attachments
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Files sent by the task creator
                </Typography>
                <List dense>
                  {(task.attachments || []).map((att: TaskAttachment, idx: number) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachFile sx={{ fontSize: 20 }} />
                            <Button
                              component="a"
                              href={`http://localhost:5000/uploads/${att.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ 
                                textTransform: 'none',
                                color: 'primary.main',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              {att.originalName || att.filename || 'Attachment'}
                            </Button>
                            <IconButton
                              size="small"
                              component="a"
                              href={`http://localhost:5000/uploads/${att.filename}`}
                              download={att.originalName || att.filename}
                              sx={{ ml: 1 }}
                              title="Download attachment"
                            >
                              <Download sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        }
                        secondary={att.size ? `${(att.size / 1024).toFixed(1)} KB` : undefined}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Created: {formatDate(task.createdAt)}
              </Typography>
            </Box>
          </Paper>

          {/* Progress Tracking */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Progress Tracking
              </Typography>
              {!isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                >
                  Update Progress
                </Button>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Current Progress</Typography>
                <Typography variant="h6">{task.progress}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={task.progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {isEditing && (
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Update Progress
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    New Progress: {newProgress}%
                  </Typography>
                  <Slider
                    value={newProgress}
                    onChange={(_, value) => setNewProgress(value as number)}
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 25, label: '25%' },
                      { value: 50, label: '50%' },
                      { value: 75, label: '75%' },
                      { value: 100, label: '100%' },
                    ]}
                    sx={{ mb: 2 }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Progress Comment (Optional)"
                  multiline
                  rows={3}
                  value={progressComment}
                  onChange={(e) => setProgressComment(e.target.value)}
                  placeholder="Add a comment about this progress update..."
                  sx={{ mb: 2 }}
                />

                {/* Progress Attachments - Only show when editing */}
                <Box sx={{ mb: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachFile sx={{ fontSize: 18 }} />
                    Progress Attachments
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Upload files to send to the task creator
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    sx={{ mb: 2 }}
                  >
                    {uploading ? 'Uploading...' : 'Upload Progress Files'}
                  </Button>
                  {(task.attachments || []).length > 0 && (
                    <List dense>
                      {(task.attachments || []).map((att: TaskAttachment, idx: number) => (
                        <ListItem key={idx}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachFile sx={{ fontSize: 18 }} />
                                <Button
                                  component="a"
                                  href={`http://localhost:5000/uploads/${att.filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ 
                                    textTransform: 'none',
                                    color: 'primary.main',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                >
                                  {att.originalName || att.filename || 'Attachment'}
                                </Button>
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={`http://localhost:5000/uploads/${att.filename}`}
                                  download={att.originalName || att.filename}
                                  sx={{ ml: 1 }}
                                  title="Download attachment"
                                >
                                  <Download sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            }
                            secondary={att.size ? `${(att.size / 1024).toFixed(1)} KB` : undefined}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleProgressUpdate}
                  >
                    Save Progress
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={() => {
                      setIsEditing(false);
                      setNewProgress(task.progress);
                      setProgressComment('');
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Progress History */}
        <Box sx={{ flex: '1 1 400px', minWidth: 300 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Comment sx={{ verticalAlign: 'middle', mr: 1 }} />
              Progress History
            </Typography>
            
            {(task.progressHistory || []).length > 0 ? (
              <List>
                {(task.progressHistory || []).map((update, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="subtitle2">
                              {typeof update.updatedBy === 'string'
                                ? update.updatedBy
                                : (update.updatedBy as { name?: string })?.name ?? 'Unknown'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={update.progress}
                                sx={{ width: 60, height: 6 }}
                              />
                              <Typography variant="body2">
                                {update.progress}%
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            {update.comment && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {update.comment}
                              </Typography>
                            )}
                            <Typography variant="caption" color="textSecondary">
                              {new Date(update.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < (task.progressHistory || []).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                No progress updates yet. Be the first to update the progress!
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialogOpen} onClose={() => setReassignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reassign Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a new employee to assign this task to:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Assigned To</InputLabel>
            <Select
              value={reassignTo}
              label="Assigned To"
              onChange={(e) => setReassignTo(e.target.value)}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReassignDialogOpen(false)} disabled={reassigning}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleReassign} disabled={reassigning || !reassignTo}>
            {reassigning ? 'Reassigning...' : 'Reassign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejection (the employee will be notified):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Additional changes required..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Reject Task
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

export default TaskDetail;
