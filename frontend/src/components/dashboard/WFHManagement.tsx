import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  HomeWork,
  CheckCircle,
  Cancel,
  Pending,
  CalendarToday,
  Person,
  AccessTime,
} from '@mui/icons-material';
import apiService from '../../services/api';

interface WFHRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    employeeId: string;
  };
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    _id: string;
    name: string;
  };
  approvedAt?: string;
  rejectedBy?: {
    _id: string;
    name: string;
  };
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

const WFHManagement: React.FC = () => {
  const [wfhRequests, setWfhRequests] = useState<WFHRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WFHRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadWFHRequests();
  }, [filterStatus]);

  const loadWFHRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllWFHRequests(1, 50, filterStatus !== 'all' ? filterStatus : undefined);
      setWfhRequests(response.data);
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to load WFH requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await apiService.approveWFHRequest(requestId);
      setSuccess('WFH request approved successfully');
      loadWFHRequests();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      await apiService.rejectWFHRequest(selectedRequest._id, rejectionReason);
      setSuccess('WFH request rejected successfully');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadWFHRequests();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to reject request');
    }
  };

  const openRejectDialog = (request: WFHRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Work From Home Requests
        </Typography>
        <TextField
          select
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Requests</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* WFH Requests List */}
      <Paper sx={{ p: 2 }}>
        <List>
          {wfhRequests.map((request) => (
            <ListItem key={request._id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" />
                      <Typography variant="subtitle1">
                        {request.user.name} ({request.user.employeeId})
                      </Typography>
                    </Box>
                    <Chip
                      label={request.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(request.status) as any}
                      icon={request.status === 'pending' ? <Pending /> : 
                            request.status === 'approved' ? <CheckCircle /> : <Cancel />}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2" color="textSecondary">
                        Date: {formatDate(request.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <AccessTime fontSize="small" />
                      <Typography variant="body2" color="textSecondary">
                        Requested: {formatDate(request.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <HomeWork fontSize="small" />
                      <Typography variant="body2" color="textSecondary" sx={{ flex: 1 }}>
                        Reason: {request.reason}
                      </Typography>
                    </Box>
                    
                    {request.status === 'approved' && request.approvedBy && (
                      <Typography variant="body2" color="success.main">
                        Approved by: {request.approvedBy.name} on {formatDate(request.approvedAt!)}
                      </Typography>
                    )}
                    
                    {request.status === 'rejected' && request.rejectedBy && (
                      <Box>
                        <Typography variant="body2" color="error.main">
                          Rejected by: {request.rejectedBy.name} on {formatDate(request.rejectedAt!)}
                        </Typography>
                        {request.rejectionReason && (
                          <Typography variant="body2" color="textSecondary">
                            Reason: {request.rejectionReason}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                }
              />
              
              {/* Action Buttons */}
              {request.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => handleApprove(request._id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => openRejectDialog(request)}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </ListItem>
          ))}
          {wfhRequests.length === 0 && (
            <ListItem>
              <ListItemText primary="No WFH requests found" />
            </ListItem>
          )}
        </List>
      </Paper>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject WFH Request</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Request from: {selectedRequest?.user.name} ({selectedRequest?.user.employeeId})
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Date: {selectedRequest && formatDate(selectedRequest.date)}
            </Typography>
            <TextField
              fullWidth
              label="Rejection Reason"
              multiline
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WFHManagement;
