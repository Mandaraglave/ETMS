import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Cancel,
  Assignment,
  AttachFile,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  file?: File;
}

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    estimatedTime: '',
    category: '',
    tags: '',
  });
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  React.useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await apiService.getUsers({ role: 'employee', status: 'active' } as any);
        const apiUsers = response.users || response;
        const options: EmployeeOption[] = apiUsers.map((u: any) => ({
          id: u.id || u._id,
          name: u.name,
          email: u.email,
        }));
        setEmployees(options);
      } catch (err) {
        console.error('Failed to load employees', err);
      }
    };
    loadEmployees();
  }, []);

  const handleAddAttachment = () => {
    // Trigger file input click
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      const newAttachment: TaskAttachment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: formatFileSize(file.size),
        file: file,
      };

      setAttachments(prev => [...prev, newAttachment]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const handleSaveTask = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        category: formData.category || undefined,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate,
        estimatedTime: Number(formData.estimatedTime || 0),
      };

      const result = await apiService.createTask(payload as any);

      if (result && result.task) {
        // Upload attachments if any
        if (attachments.length > 0) {
          await uploadAttachments(result.task._id);
        }

        setSuccess('Task created successfully!');
        setConfirmDialogOpen(false);
        
        // Navigate to tasks page after a short delay
        setTimeout(() => {
          navigate('/tasks');
        }, 1500);
      } else {
        setError(result?.message || 'Failed to create task');
      }
    } catch (err: any) {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const uploadAttachments = async (taskId: string) => {
    try {
      const files = attachments
        .filter(att => att.file)
        .map(att => att.file!);
      
      if (files.length === 0) return;

      await apiService.uploadTaskAttachments(taskId, files);
    } catch (error) {
      console.error('Upload error:', error);
      // Don't fail the whole task creation if upload fails
      setError('Task created but some attachments failed to upload');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Create New Task
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/tasks')}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => setConfirmDialogOpen(true)}
            disabled={!formData.title || !formData.assignedTo || !formData.dueDate}
          >
            Create Task
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Task Details
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Title and Priority */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Task Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              sx={{ flex: '2 1 300px' }}
              placeholder="Enter task title..."
            />
            <FormControl sx={{ flex: '1 1 200px' }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <MenuItem value="low">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Low" color="success" size="small" />
                    Low Priority
                  </Box>
                </MenuItem>
                <MenuItem value="medium">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Medium" color="warning" size="small" />
                    Medium Priority
                  </Box>
                </MenuItem>
                <MenuItem value="high">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="High" color="error" size="small" />
                    High Priority
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Description */}
          <TextField
            label="Description"
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Provide detailed description of the task..."
            required
          />

          {/* Assignment and Timing */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ flex: '1 1 250px' }}>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={formData.assignedTo}
                label="Assign To"
                onChange={(e) => handleInputChange('assignedTo', e.target.value as string)}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 200px' }}
              helperText="Optional"
            />
            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 200px' }}
              required
            />
            <TextField
              label="Estimated Time (hours)"
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
              placeholder="e.g., 8"
              sx={{ flex: '1 1 200px' }}
            />
          </Box>

          {/* Category and Tags */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="e.g., Development, Design, Marketing"
              sx={{ flex: '1 1 250px' }}
            />
            <TextField
              label="Tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="e.g., urgent, frontend, bug-fix"
              sx={{ flex: '1 1 250px' }}
              helperText="Separate multiple tags with commas"
            />
          </Box>

          {/* Attachments */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Attachments
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AttachFile />}
                onClick={handleAddAttachment}
              >
                Add Attachment
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              />
            </Box>
            
            {attachments.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {attachments.map((attachment) => (
                  <Box
                    key={attachment.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Assignment />
                      <Box>
                        <Typography variant="body2">{attachment.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {attachment.size}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Task Creation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to create this task? The assigned employee will be notified immediately.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Task Summary:</Typography>
            <Typography variant="body2">• Title: {formData.title}</Typography>
            <Typography variant="body2">• Assigned to: {employees.find(e => e.id === formData.assignedTo)?.name || formData.assignedTo}</Typography>
            <Typography variant="body2">• Priority: {formData.priority}</Typography>
            {formData.startDate && <Typography variant="body2">• Start: {formData.startDate}</Typography>}
            <Typography variant="body2">• Due: {formData.dueDate}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveTask} disabled={loading}>
            {loading ? 'Creating...' : 'Create Task'}
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

export default CreateTask;
