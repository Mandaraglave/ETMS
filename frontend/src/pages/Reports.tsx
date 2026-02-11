import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PictureAsPdf,
  Description,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface ReportData {
  id: string;
  employeeName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  avgTimeToComplete: number;
  overdueTasks: number;
}

interface MonthlyReportData {
  productivityTrends: { _id: string; tasksAssigned: number; tasksCompleted: number }[];
  delayAnalysis: { totalTasks?: number; onTimeTasks?: number; delayedTasks?: number; averageDelayDays?: number };
  avgCompletionTime: { averageCompletionDays?: number; minCompletionDays?: number; maxCompletionDays?: number };
  priorityDistribution: { _id: string; count: number; completed: number }[];
}

interface AttendanceMonthlyRow {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department?: string;
  daysPresent: number;
  totalHours: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('employee_performance');
  const [dateRange, setDateRange] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData | null>(null);
  const [attendanceMonthlyData, setAttendanceMonthlyData] = useState<AttendanceMonthlyRow[]>([]);
  const [monthSelect, setMonthSelect] = useState(new Date().getMonth() + 1);
  const [yearSelect, setYearSelect] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dateRange, startDate, endDate, monthSelect, yearSelect]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    setMonthlyData(null);
    setAttendanceMonthlyData([]);

    try {
      if (reportType === 'employee_performance') {
        const res = await apiService.getEmployeePerformance(startDate, endDate);
        const perf = res.performance || [];
        const mapped: ReportData[] = perf.map((row: any) => ({
          id: row.employeeId || row._id,
          employeeName: row.employeeName,
          totalTasks: row.totalTasks,
          completedTasks: row.completedTasks,
          pendingTasks: (row.totalTasks || 0) - (row.completedTasks || 0),
          completionRate: row.completionRate ?? 0,
          avgTimeToComplete: row.averageCompletionDays ?? 0,
          overdueTasks: row.rejectedTasks ?? 0,
        }));
        setReportData(mapped);
      } else if (reportType === 'daily') {
        const dailyData = await apiService.getDailyReports(dateRange === 'custom' ? startDate : undefined);
        const totalTasks = dailyData.tasksAssigned ?? dailyData.tasksAssignedToday ?? 0;
        const completed = dailyData.tasksCompleted ?? 0;
        const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
        setReportData([
          {
            id: 'daily',
            employeeName: 'All Employees',
            totalTasks,
            completedTasks: completed,
            pendingTasks: totalTasks - completed,
            completionRate,
            avgTimeToComplete: 0,
            overdueTasks: 0,
          },
        ]);
      } else if (reportType === 'monthly') {
        const res = await apiService.getMonthlyReports(monthSelect - 1, yearSelect);
        setMonthlyData({
          productivityTrends: res.productivityTrends || [],
          delayAnalysis: res.delayAnalysis || {},
          avgCompletionTime: res.avgCompletionTime || {},
          priorityDistribution: res.priorityDistribution || [],
        });
      } else if (reportType === 'attendance_monthly') {
        const res = await apiService.getAttendanceMonthlyReport(monthSelect - 1, yearSelect);
        const summary = res.summary || [];
        setAttendanceMonthlyData(summary.map((row: any) => ({
          employeeId: row.employeeId || row._id,
          employeeName: row.employeeName || '—',
          employeeEmail: row.employeeEmail || '—',
          department: row.department,
          daysPresent: row.daysPresent ?? 0,
          totalHours: row.totalHours ?? 0,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const monthParam = reportType === 'attendance_monthly' ? monthSelect - 1 : undefined;
      const yearParam = reportType === 'attendance_monthly' ? yearSelect : undefined;
      const res = await apiService.exportData(reportType, 'pdf', startDate, endDate, monthParam, yearParam);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ETMS_${reportType}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const monthParam = reportType === 'attendance_monthly' ? monthSelect - 1 : undefined;
      const yearParam = reportType === 'attendance_monthly' ? yearSelect : undefined;
      const res = await apiService.exportData(reportType, 'excel', startDate, endDate, monthParam, yearParam);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ETMS_${reportType}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Failed to export Excel');
    }
  };

  // Only allow admins to access this page
  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Access Denied: Only administrators can view reports.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>

      {/* Report Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              label="Report Type"
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="employee_performance">Employee Performance</MenuItem>
              <MenuItem value="daily">Daily Reports</MenuItem>
              <MenuItem value="monthly">Monthly Reports</MenuItem>
              <MenuItem value="attendance_monthly">Monthly Attendance (Salary)</MenuItem>
            </Select>
          </FormControl>

          {(reportType === 'monthly' || reportType === 'attendance_monthly') && (
            <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={monthSelect}
                  label="Month"
                  onChange={(e) => setMonthSelect(Number(e.target.value))}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <MenuItem key={name} value={i + 1}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={yearSelect}
                  label="Year"
                  onChange={(e) => setYearSelect(Number(e.target.value))}
                >
                  {Array.from({ length: 6 }, (_, i) => yearSelect - 4 + i).map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          {reportType !== 'monthly' && reportType !== 'attendance_monthly' && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="this_week">This Week</MenuItem>
              <MenuItem value="this_month">This Month</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          )}

          {dateRange === 'custom' && reportType !== 'monthly' && reportType !== 'attendance_monthly' && (
            <>
              <TextField
                type="date"
                label="Start Date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                label="End Date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          <Button variant="outlined" onClick={fetchReportData}>
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Export Options - for performance, daily, and attendance monthly (salary) */}
      {reportType !== 'monthly' && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={exportToPDF}
            disabled={loading}
          >
            Export to PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<Description />}
            onClick={exportToExcel}
            disabled={loading}
          >
            Export to Excel
          </Button>
        </Box>
      )}

      {/* Report Content */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : reportType === 'monthly' && monthlyData ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Productivity Trends ({MONTH_NAMES[monthSelect - 1]} {yearSelect})
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Tasks Assigned</TableCell>
                  <TableCell>Tasks Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyData.productivityTrends.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{row._id}</TableCell>
                    <TableCell>{row.tasksAssigned}</TableCell>
                    <TableCell>{row.tasksCompleted}</TableCell>
                  </TableRow>
                ))}
                {monthlyData.productivityTrends.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No data for this month</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, flex: '1 1 200px' }}>
              <Typography variant="subtitle1" gutterBottom>Delay Analysis</Typography>
              <Typography variant="body2">Total Tasks: {monthlyData.delayAnalysis.totalTasks ?? 0}</Typography>
              <Typography variant="body2">On Time: {monthlyData.delayAnalysis.onTimeTasks ?? 0}</Typography>
              <Typography variant="body2">Delayed: {monthlyData.delayAnalysis.delayedTasks ?? 0}</Typography>
              <Typography variant="body2">Avg Delay (days): {monthlyData.delayAnalysis.averageDelayDays?.toFixed(1) ?? '-'}</Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: '1 1 200px' }}>
              <Typography variant="subtitle1" gutterBottom>Avg Completion Time</Typography>
              <Typography variant="body2">Average: {monthlyData.avgCompletionTime.averageCompletionDays?.toFixed(1) ?? '-'} days</Typography>
              <Typography variant="body2">Min: {monthlyData.avgCompletionTime.minCompletionDays?.toFixed(1) ?? '-'} days</Typography>
              <Typography variant="body2">Max: {monthlyData.avgCompletionTime.maxCompletionDays?.toFixed(1) ?? '-'} days</Typography>
            </Paper>
          </Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Priority Distribution</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Priority</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyData.priorityDistribution.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{row._id}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{row.completed}</TableCell>
                  </TableRow>
                ))}
                {monthlyData.priorityDistribution.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      ) : reportType === 'attendance_monthly' ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Monthly Attendance Summary — {MONTH_NAMES[monthSelect - 1]} {yearSelect} (for salary)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Days Present</TableCell>
                <TableCell>Total Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceMonthlyData.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>{row.employeeEmail}</TableCell>
                  <TableCell>{row.department || '—'}</TableCell>
                  <TableCell>{row.daysPresent}</TableCell>
                  <TableCell>{row.totalHours}</TableCell>
                </TableRow>
              ))}
              {attendanceMonthlyData.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No attendance data for this month</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Total Tasks</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>Completion Rate</TableCell>
                <TableCell>Avg Time (days)</TableCell>
                <TableCell>Overdue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>{row.totalTasks}</TableCell>
                  <TableCell>{row.completedTasks}</TableCell>
                  <TableCell>{row.pendingTasks}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${row.completionRate}%`}
                      color={row.completionRate >= 80 ? 'success' : row.completionRate >= 50 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.avgTimeToComplete}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.overdueTasks}
                      color={row.overdueTasks > 0 ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Reports;
