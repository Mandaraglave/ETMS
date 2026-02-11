import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider
} from '@mui/material';
import {
  LocationOn,
  LocationOff,
  AccessTime,
  ExitToApp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: {
    time: string;
    location: LocationData;
    isWithinOffice: boolean;
    distanceFromOffice: number;
  };
  checkOut?: {
    time: string;
    location: LocationData;
    isWithinOffice: boolean;
    distanceFromOffice: number;
  };
  totalHours: number;
  overtime: number;
  status: string;
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isWithinOffice, setIsWithinOffice] = useState<boolean>(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  // Get current location
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            address: 'Getting address...'
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Get address from coordinates (reverse geocoding)
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/geocoding/reverse-geocode?lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  // Load today's attendance
  const loadTodayAttendance = async () => {
    try {
      const response = await apiService.getTodayAttendance();
      setTodayAttendance(response);
    } catch (error: any) {
      console.error('Error loading today attendance:', error);
      setError(error?.response?.data?.message || 'Failed to load attendance');
    }
  };

  // Load attendance history
  const loadAttendanceHistory = async () => {
    try {
      const response = await apiService.getAttendance();
      setAttendanceHistory(response.attendance || []);
    } catch (error: any) {
      console.error('Error loading attendance history:', error);
      setError(error?.response?.data?.message || 'Failed to load attendance history');
    }
  };

  // Check-in with location validation
  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Automatically get location if not already captured
      let location = currentLocation;
      if (!location) {
        setError('Getting your location...');
        location = await getCurrentLocation();
        
        // Get address for the location
        const address = await getAddressFromCoordinates(
          location.latitude,
          location.longitude
        );
        
        setCurrentLocation({
          ...location,
          address
        });
      }

      // Check if user is within office location before allowing check-in
      const officeLat = user?.officeLocation?.coordinates?.latitude;
      const officeLng = user?.officeLocation?.coordinates?.longitude;
      const radius = user?.officeLocation?.coordinates?.radius || 100;
      
      if (!officeLat || !officeLng) {
        setIsWithinOffice(false);
        return;
      }
      
      // Simple distance calculation
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        officeLat,
        officeLng
      );
      
      const withinOffice = distance <= radius;
      setIsWithinOffice(withinOffice);
      
      if (!withinOffice) {
        setError('You are not at office location. Check-in not allowed.');
        setLoading(false);
        return;
      }

      const response = await apiService.checkIn({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address || await getAddressFromCoordinates(location.latitude, location.longitude)
      });

      setSuccess(response.message);
      
      // Show location validation details if available
      if (response.location && !response.location.isWithinOffice) {
        setError(response.location.message);
      }
      
      if (response.attendance) {
        setTodayAttendance({
          ...response.attendance,
          canCheckIn: false,
          canCheckOut: true
        });
      }
      
      // Reload attendance data
      await loadTodayAttendance();
    } catch (error: any) {
      console.error('Check-in error:', error);
      setError(error?.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Check-out with location validation
  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Automatically get location if not already captured
      let location = currentLocation;
      if (!location) {
        setError('Getting your location...');
        location = await getCurrentLocation();
        
        // Get address for location
        const address = await getAddressFromCoordinates(
          location.latitude,
          location.longitude
        );
        
        setCurrentLocation({
          ...location,
          address
        });
      }
      
      const response = await apiService.checkOut({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address || await getAddressFromCoordinates(location.latitude, location.longitude)
      });

      setSuccess(response.message);
      
      // Show location validation details if available
      if (response.location && !response.location.isWithinOffice) {
        setError(response.location.message);
      }
      
      if (response.attendance) {
        setTodayAttendance({
          ...response.attendance,
          canCheckIn: false,
          canCheckOut: false
        });
      }
      
      // Reload attendance data
      await loadTodayAttendance();
    } catch (error: any) {
      console.error('Check-out error:', error);
      setError(error?.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayAttendance();
    loadAttendanceHistory();
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>

      {/* Today's Attendance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today's Attendance
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Current Location Display */}
          {currentLocation && (
            <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                📍 Current Location Details
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Coordinates:</strong> {currentLocation?.latitude?.toFixed(6) || 'N/A'}, {currentLocation?.longitude?.toFixed(6) || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Address:</strong> {currentLocation?.address || 'Fetching address...'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Accuracy:</strong> ±{currentLocation?.accuracy || 'N/A'}m
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Distance from Office:</strong> {isWithinOffice ? 'Within office' : 'Outside office'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Status:</strong> 
                <Chip 
                  label={isWithinOffice ? 'Within Office' : 'Outside Office'} 
                  color={isWithinOffice ? 'success' : 'warning'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
          )}

          {/* Office Location Display */}
          {user?.officeLocation && (
            <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
              <Typography variant="subtitle2" gutterBottom>
                🏢 Office Location Details
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Name:</strong> {user.officeLocation?.name || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Address:</strong> {user.officeLocation?.address || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Coordinates:</strong> {user.officeLocation.coordinates?.latitude?.toFixed(6) || 'N/A'}, {user.officeLocation.coordinates?.longitude?.toFixed(6) || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Radius:</strong> {user.officeLocation.coordinates?.radius || 'N/A'}m
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Timezone:</strong> {user.officeLocation?.timezone || 'N/A'}
              </Typography>
            </Box>
          )}

          {todayAttendance ? (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '50%', md: '50%' } }}>
                  {!todayAttendance?.checkIn ? (
                    <Button
                      variant="contained"
                      startIcon={<AccessTime />}
                      onClick={handleCheckIn}
                      disabled={loading}
                      sx={{ width: '100%' }}
                    >
                      {loading ? 'Checking In...' : 'Check In'}
                    </Button>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Time: {formatTime(todayAttendance.checkIn.time)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Location: {todayAttendance.checkIn.location.address}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Distance: {todayAttendance.checkIn.distanceFromOffice}m from office
                      </Typography>
                      <Chip
                        label={todayAttendance.checkIn.isWithinOffice ? 'Within Office' : 'Outside Office'}
                        color={todayAttendance.checkIn.isWithinOffice ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '50%', md: '50%' } }}>
                  {todayAttendance?.checkIn && !todayAttendance?.checkOut ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<ExitToApp />}
                      onClick={handleCheckOut}
                      disabled={loading}
                      sx={{ width: '100%' }}
                    >
                      {loading ? 'Checking Out...' : 'Check Out'}
                    </Button>
                  ) : todayAttendance?.checkOut ? (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Time: {formatTime(todayAttendance.checkOut.time)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Location: {todayAttendance.checkOut.location.address}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Distance: {todayAttendance.checkOut.distanceFromOffice}m from office
                      </Typography>
                      <Chip
                        label={todayAttendance.checkOut.isWithinOffice ? 'Within Office' : 'Outside Office'}
                        color={todayAttendance.checkOut.isWithinOffice ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  ) : null}
                </Box>

                {(todayAttendance.totalHours > 0 || todayAttendance.overtime > 0) && (
                  <Box sx={{ flex: 1, minWidth: '100%' }}>
                    <Typography variant="subtitle1">
                      Work Summary
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Hours: {todayAttendance.totalHours}h
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Overtime: {todayAttendance.overtime}h
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No attendance record for today
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Attendance History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Attendance History
          </Typography>
          
          {attendanceHistory.length > 0 ? (
            <List>
              {attendanceHistory.map((record, index) => (
                <div key={record._id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle1" component="span">
                            {formatDate(record.date)}
                          </Typography>
                          <Chip
                            label={record.status}
                            color={
                              record.status === 'present' ? 'success' :
                              record.status === 'late' ? 'warning' :
                              record.status === 'absent' ? 'error' : 'default'
                            }
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary" component="div">
                          <Box>
                            <Typography variant="body2" color="textSecondary" component="span">
                              Check-in: {record.checkIn ? formatTime(record.checkIn.time) : 'N/A'}
                            </Typography>
                            <br />
                            <Typography variant="body2" color="textSecondary" component="span">
                              Check-out: {record.checkOut ? formatTime(record.checkOut.time) : 'N/A'}
                            </Typography>
                            <br />
                            <Typography variant="body2" color="textSecondary" component="span">
                              Total Hours: {record.totalHours}h
                            </Typography>
                            {record.overtime > 0 && (
                              <>
                                <br />
                                <Typography variant="body2" color="textSecondary" component="span">
                                  Overtime: {record.overtime}h
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < attendanceHistory.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No attendance history available
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Attendance;
