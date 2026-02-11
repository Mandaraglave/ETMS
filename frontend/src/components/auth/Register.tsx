import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as 'admin' | 'employee',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create Account
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
          Sign up for ETMS
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            margin="normal"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            name="email"
            margin="normal"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            name="password"
            margin="normal"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            margin="normal"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={isLoading}
          />

          <TextField
            fullWidth
            select
            label="Role"
            name="role"
            margin="normal"
            value={formData.role}
            onChange={handleChange}
            disabled={isLoading}
            SelectProps={{
              native: true,
            }}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </TextField>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              Already have an account?{' '}
              <MuiLink component={Link} to="/login">
                Sign In
              </MuiLink>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default Register;
