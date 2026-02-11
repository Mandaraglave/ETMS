import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
import { CameraAlt } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import apiService, { getAvatarUrl } from '../services/api';

const Profile: React.FC = () => {
  const { user, updateProfile, syncUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [phone, setPhone] = useState(user?.contactDetails?.phone || '');
  const [address, setAddress] = useState(user?.contactDetails?.address || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiService.getProfile();
        const profile = response.user;
        setName(profile.name || '');
        setDesignation(profile.designation || '');
        setDepartment(profile.department || '');
        setPhone(profile.contactDetails?.phone || '');
        setAddress(profile.contactDetails?.address || '');
      } catch (err) {
        // non-fatal; user context still has basic data
        console.error('Failed to load profile', err);
      }
    };
    loadProfile();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { user: updatedUser } = await apiService.uploadProfilePicture(file);
      syncUser(updatedUser);
      setSuccess('Profile picture updated');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        name,
        designation,
        department,
        contactDetails: {
          phone,
          address,
        },
      });
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">You need to be logged in to view this page.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
          }}
        >
          <Box sx={{ flex: '0 0 240px', maxWidth: 280 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={getAvatarUrl(user.profilePicture)}
                  sx={{ width: 72, height: 72 }}
                >
                  {name ? name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  hidden
                  onChange={handleAvatarUpload}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <CameraAlt fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {user.role === 'admin' ? 'Administrator' : 'Employee'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Employee ID: {user.employeeId || 'N/A'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: '1 1 260px', minWidth: 260 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField label="Email" fullWidth value={user.email} disabled />
              <TextField
                label="Designation"
                fullWidth
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
              <TextField
                label="Department"
                fullWidth
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              <TextField
                label="Phone"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}>
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  minRows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Box>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button variant="contained" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

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

export default Profile;

