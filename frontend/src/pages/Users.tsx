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
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string;
  tasksCount: number;
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiService.getUsers();
        const apiUsers = response.users || response;

        const transformedUsers = apiUsers.map((user: any) => ({
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || 'Not Assigned',
          status: user.status || 'active',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
          tasksCount: 0,
        }));

        setUsers(transformedUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        // Set empty array on error to prevent undefined issues
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'employee': return 'primary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own account while logged in as admin.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${user.name}?`);
    if (!confirmed) return;

    try {
      setIsDeleting(user.id);
      await apiService.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error?.response?.data?.message || 'Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Only allow admins to access this page
  if (currentUser?.role !== 'admin') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Access Denied: Only administrators can manage users.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Users Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/employees/create')}
        >
          Create Employee
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, flex: '1 1 200px' }}>
          <Typography variant="h6">{users.length}</Typography>
          <Typography variant="body2" color="textSecondary">Total Users</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: '1 1 200px' }}>
          <Typography variant="h6">
            {users.filter(u => u.status === 'active').length}
          </Typography>
          <Typography variant="body2" color="textSecondary">Active Users</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: '1 1 200px' }}>
          <Typography variant="h6">
            {users.filter(u => u.role === 'admin').length}
          </Typography>
          <Typography variant="body2" color="textSecondary">Administrators</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: '1 1 200px' }}>
          <Typography variant="h6">
            {users.filter(u => u.role === 'employee').length}
          </Typography>
          <Typography variant="body2" color="textSecondary">Employees</Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search users..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            label="Filter by Role"
            variant="outlined"
            size="small"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
          </TextField>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Tasks</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>{user.name.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="subtitle2">{user.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    color={getRoleColor(user.role) as any}
                  />
                </TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={getStatusColor(user.status) as any}
                  />
                </TableCell>
                <TableCell>{user.lastLogin}</TableCell>
                <TableCell>{user.tasksCount}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" disabled>
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" disabled>
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteUser(user)}
                      disabled={isDeleting === user.id}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Users;
