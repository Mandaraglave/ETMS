import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Profile Settings */}
        <Box sx={{ flex: '1 1 500px', minWidth: 300 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Settings
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Button variant="outlined">
                Change Avatar
              </Button>
            </Box>

            <TextField
              fullWidth
              label="Full Name"
              defaultValue={user?.name}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              defaultValue={user?.email}
              margin="normal"
              disabled
            />
            <TextField
              fullWidth
              label="Phone"
              margin="normal"
              placeholder="+1 234 567 8900"
            />
            <TextField
              fullWidth
              label="Department"
              margin="normal"
              defaultValue={user?.role === 'admin' ? 'Administration' : 'General'}
            />
            <Button variant="contained" sx={{ mt: 2 }}>
              Save Profile
            </Button>
          </Paper>
        </Box>

        {/* Notification Settings */}
        <Box sx={{ flex: '1 1 500px', minWidth: 300 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email Notifications"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Push Notifications"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Task Assigned"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Task Updates"
            />
            <FormControlLabel
              control={<Switch />}
              label="Daily Summary"
            />
            <FormControlLabel
              control={<Switch />}
              label="Marketing Emails"
            />
            
            <Button variant="contained" sx={{ mt: 2 }}>
              Save Preferences
            </Button>
          </Paper>
        </Box>

        {/* Security Settings */}
        <Box sx={{ flex: '1 1 500px', minWidth: 300 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              margin="normal"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              margin="normal"
            />
            
            <Button variant="contained" sx={{ mt: 2 }}>
              Change Password
            </Button>
            
            <Divider sx={{ my: 3 }} />
            
            <FormControlLabel
              control={<Switch />}
              label="Two-Factor Authentication"
            />
            <Button variant="outlined" sx={{ mt: 1 }}>
              Enable 2FA
            </Button>
          </Paper>
        </Box>

        {/* System Settings */}
        <Box sx={{ flex: '1 1 500px', minWidth: 300 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Dark Mode"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Compact View"
            />
            <FormControlLabel
              control={<Switch />}
              label="Show Tooltips"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Auto-save Drafts"
            />
            
            <TextField
              fullWidth
              label="Language"
              select
              margin="normal"
              defaultValue="en"
              SelectProps={{ native: true }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </TextField>
            
            <TextField
              fullWidth
              label="Timezone"
              select
              margin="normal"
              defaultValue="UTC"
              SelectProps={{ native: true }}
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
            </TextField>
            
            <Button variant="contained" sx={{ mt: 2 }}>
              Save Settings
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
