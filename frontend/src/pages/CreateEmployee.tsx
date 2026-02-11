import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const CreateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: '',
    department: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<typeof formData>>({});

  const validateForm = (): boolean => {
    const errors: Partial<typeof formData> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== CREATE EMPLOYEE SUBMIT ===');
    console.log('Form data:', formData);
    console.log('Form validation result:', validateForm());
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      
      console.log('Sending API request to create employee...');
      
      const response = await apiService.createEmployee(formData);
      console.log('✅ API response:', response);
      
      // Show success message and redirect
      alert('Employee created successfully!');
      navigate('/users');
    } catch (err: any) {
      console.error('❌ Create employee error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Create New Employee
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} sx={{ mt: 1, width: '100%' }}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                margin="normal"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                margin="normal"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                margin="normal"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={!!formErrors.password}
                helperText={formErrors.password}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Designation"
                name="designation"
                margin="normal"
                value={formData.designation}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                error={!!formErrors.designation}
                helperText={formErrors.designation}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Department"
                name="department"
                margin="normal"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                error={!!formErrors.department}
                helperText={formErrors.department}
                sx={{ mb: 2 }}
              />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  Creating...
                </Box>
              ) : (
                'Create Employee'
              )}
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/users')}
              sx={{ mb: 2 }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateEmployee;
