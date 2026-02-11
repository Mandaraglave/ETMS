const Task = require('../models/Task');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Helper: build employee performance data for a date range
const buildEmployeePerformance = async (startDate, endDate) => {
  const performance = await Task.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'employee'
      }
    },
    { $unwind: '$employee' },
    {
      $group: {
        _id: '$assignedTo',
        employeeName: { $first: '$employee.name' },
        employeeEmail: { $first: '$employee.email' },
        department: { $first: '$employee.department' },
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        approvedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        rejectedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress' },
        highPriorityTasks: {
          $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        employeeId: '$_id',
        employeeName: 1,
        employeeEmail: 1,
        department: 1,
        totalTasks: 1,
        completedTasks: 1,
        approvedTasks: 1,
        rejectedTasks: 1,
        averageProgress: { $round: ['$averageProgress', 2] },
        highPriorityTasks: 1,
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
            2
          ]
        },
        approvalRate: {
          $round: [
            { $multiply: [{ $divide: ['$approvedTasks', '$totalTasks'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { completionRate: -1 } }
  ]);

  return performance;
};

// Helper: build daily summary for a single date
const buildDailySummary = async (date) => {
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const tasksAssigned = await Task.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const tasksCompleted = await Task.countDocuments({
    completedAt: { $gte: startOfDay, $lte: endOfDay }
  });

  return { date: targetDate, tasksAssigned, tasksCompleted };
};

// Get daily reports
const getDailyReports = async (req, res) => {
  try {
    const { date = new Date() } = req.query;
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Tasks assigned vs completed on the specific date
    const tasksAssigned = await Task.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const tasksCompleted = await Task.countDocuments({
      completedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Employee-wise performance
    const employeePerformance = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $group: {
          _id: '$assignedTo',
          employeeName: { $first: '$employee.name' },
          employeeEmail: { $first: '$employee.email' },
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          employeeId: '$_id',
          employeeName: 1,
          employeeEmail: 1,
          totalTasks: 1,
          completedTasks: 1,
          inProgressTasks: 1,
          pendingTasks: 1,
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
              2
            ]
          }
        }
      }
    ]);

    res.json({
      date: targetDate,
      tasksAssigned,
      tasksCompleted,
      employeePerformance
    });
  } catch (error) {
    console.error('Get daily reports error:', error);
    res.status(500).json({ message: 'Server error fetching daily reports' });
  }
};

// Get monthly reports
const getMonthlyReports = async (req, res) => {
  try {
    const { month = new Date().getMonth(), year = new Date().getFullYear() } = req.query;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Productivity trends - tasks per day for the month
    const productivityTrends = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          tasksAssigned: { $sum: 1 },
          tasksCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Delay analysis
    const delayAnalysis = await Task.aggregate([
      {
        $match: {
          dueDate: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'approved'] }
        }
      },
      {
        $addFields: {
          daysOverdue: {
            $max: [
              0,
              {
                $divide: [
                  { $subtract: ['$completedAt', '$dueDate'] },
                  1000 * 60 * 60 * 24 // Convert milliseconds to days
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          onTimeTasks: {
            $sum: { $cond: [{ $lte: ['$daysOverdue', 0] }, 1, 0] }
          },
          delayedTasks: {
            $sum: { $cond: [{ $gt: ['$daysOverdue', 0] }, 1, 0] }
          },
          averageDelayDays: { $avg: '$daysOverdue' }
        }
      }
    ]);

    // Average completion time
    const avgCompletionTime = await Task.aggregate([
      {
        $match: {
          completedAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'approved'] }
        }
      },
      {
        $addFields: {
          completionDays: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageCompletionDays: { $avg: '$completionDays' },
          minCompletionDays: { $min: '$completionDays' },
          maxCompletionDays: { $max: '$completionDays' }
        }
      }
    ]);

    // Priority distribution
    const priorityDistribution = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      month,
      year,
      productivityTrends,
      delayAnalysis: delayAnalysis[0] || {},
      avgCompletionTime: avgCompletionTime[0] || {},
      priorityDistribution
    });
  } catch (error) {
    console.error('Get monthly reports error:', error);
    res.status(500).json({ message: 'Server error fetching monthly reports' });
  }
};

// Get employee performance report
const getEmployeePerformance = async (req, res) => {
  try {
    const { 
      startDate = new Date(new Date().setDate(new Date().getDate() - 30)), 
      endDate = new Date() 
    } = req.query;

    const performance = await buildEmployeePerformance(startDate, endDate);

    res.json({ performance });
  } catch (error) {
    console.error('Get employee performance error:', error);
    res.status(500).json({ message: 'Server error fetching employee performance' });
  }
};

// Helper: build monthly attendance summary for salary (per employee: days present, total hours)
const buildAttendanceMonthlySummary = async (month, year) => {
  const start = moment().year(year).month(month).startOf('month').toDate();
  const end = moment().year(year).month(month).endOf('month').toDate();

  const summary = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lte: end }, status: 'present' } },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDoc'
      }
    },
    { $unwind: '$userDoc' },
    { $match: { 'userDoc.role': 'employee' } },
    {
      $group: {
        _id: '$user',
        employeeName: { $first: '$userDoc.name' },
        employeeEmail: { $first: '$userDoc.email' },
        department: { $first: '$userDoc.department' },
        daysPresent: { $sum: 1 },
        totalMinutes: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ['$checkInTime', null] }, { $ne: ['$checkOutTime', null] }] },
              { $divide: [{ $subtract: ['$checkOutTime', '$checkInTime'] }, 60000] },
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        employeeId: '$_id',
        employeeName: 1,
        employeeEmail: 1,
        department: 1,
        daysPresent: 1,
        totalHours: { $round: [{ $divide: ['$totalMinutes', 60] }, 2] }
      }
    },
    { $sort: { employeeName: 1 } }
  ]);

  return summary;
};

// Get monthly attendance report (for salary) - admin only
const getAttendanceMonthlyReport = async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (isNaN(month) || month < 0 || month > 11 || isNaN(year)) {
      return res.status(400).json({ message: 'Valid month (0-11) and year required' });
    }
    const summary = await buildAttendanceMonthlySummary(month, year);
    res.json({ summary, month, year });
  } catch (error) {
    console.error('Attendance monthly report error:', error);
    res.status(500).json({ message: 'Server error fetching attendance report' });
  }
};

// Export data as PDF or Excel
const exportData = async (req, res) => {
  try {
    const { type, format, startDate, endDate, month, year } = req.query;

    const safeType = type || 'employee_performance';
    const safeFormat = (format || 'excel').toLowerCase();

    let dataRows = [];

    if (safeType === 'employee_performance') {
      const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate || new Date();
      dataRows = await buildEmployeePerformance(start, end);
    } else if (safeType === 'daily') {
      const date = startDate || new Date();
      const summary = await buildDailySummary(date);
      dataRows = [summary];
    } else if (safeType === 'attendance_monthly') {
      const m = month != null ? parseInt(month, 10) : new Date().getMonth();
      const y = year != null ? parseInt(year, 10) : new Date().getFullYear();
      if (isNaN(m) || isNaN(y)) {
        return res.status(400).json({ message: 'Month and year required for attendance export' });
      }
      dataRows = await buildAttendanceMonthlySummary(m, y);
    } else {
      return res.status(400).json({ message: 'Invalid report type for export' });
    }

    const timestamp = moment().format('YYYYMMDD_HHmmss');

    if (safeFormat === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      if (safeType === 'employee_performance') {
        worksheet.columns = [
          { header: 'Employee', key: 'employeeName', width: 25 },
          { header: 'Email', key: 'employeeEmail', width: 30 },
          { header: 'Department', key: 'department', width: 20 },
          { header: 'Total Tasks', key: 'totalTasks', width: 12 },
          { header: 'Completed', key: 'completedTasks', width: 12 },
          { header: 'Approved', key: 'approvedTasks', width: 12 },
          { header: 'Rejected', key: 'rejectedTasks', width: 12 },
          { header: 'Completion Rate (%)', key: 'completionRate', width: 18 },
          { header: 'Approval Rate (%)', key: 'approvalRate', width: 18 },
          { header: 'High Priority Tasks', key: 'highPriorityTasks', width: 18 },
        ];

        dataRows.forEach((row) => worksheet.addRow(row));
      } else if (safeType === 'attendance_monthly') {
        worksheet.columns = [
          { header: 'Employee', key: 'employeeName', width: 25 },
          { header: 'Email', key: 'employeeEmail', width: 30 },
          { header: 'Department', key: 'department', width: 20 },
          { header: 'Days Present', key: 'daysPresent', width: 14 },
          { header: 'Total Hours', key: 'totalHours', width: 14 },
        ];
        dataRows.forEach((row) => worksheet.addRow(row));
      } else {
        worksheet.columns = [
          { header: 'Date', key: 'date', width: 20 },
          { header: 'Tasks Assigned', key: 'tasksAssigned', width: 18 },
          { header: 'Tasks Completed', key: 'tasksCompleted', width: 18 },
        ];

        dataRows.forEach((row) =>
          worksheet.addRow({
            date: moment(row.date).format('YYYY-MM-DD'),
            tasksAssigned: row.tasksAssigned,
            tasksCompleted: row.tasksCompleted,
          })
        );
      }

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ETMS_${safeType}_${timestamp}.xlsx"`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    if (safeFormat === 'pdf') {
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ETMS_${safeType}_${timestamp}.pdf"`
      );
      doc.pipe(res);

      doc.fontSize(18).text('ETMS Reports', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Report type: ${safeType}`, { align: 'left' });
      doc.text(`Generated at: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
      doc.moveDown();

      if (safeType === 'employee_performance') {
        dataRows.forEach((row) => {
          doc.fontSize(12).text(`Employee: ${row.employeeName} (${row.employeeEmail})`);
          doc.text(`Department: ${row.department || 'N/A'}`);
          doc.text(
            `Tasks - Total: ${row.totalTasks}, Completed: ${row.completedTasks}, Approved: ${row.approvedTasks}, Rejected: ${row.rejectedTasks}`
          );
          doc.text(
            `Completion Rate: ${row.completionRate || 0}% | Approval Rate: ${row.approvalRate || 0}% | High Priority: ${row.highPriorityTasks || 0}`
          );
          doc.moveDown();
        });
      } else if (safeType === 'attendance_monthly') {
        doc.fontSize(14).text('Monthly Attendance Summary (Salary)', { underline: true });
        doc.moveDown(0.5);
        dataRows.forEach((row) => {
          doc.fontSize(12).text(`Employee: ${row.employeeName} (${row.employeeEmail})`);
          doc.text(`Department: ${row.department || 'N/A'}`);
          doc.text(`Days Present: ${row.daysPresent || 0} | Total Hours: ${row.totalHours || 0}`);
          doc.moveDown();
        });
      } else {
        dataRows.forEach((row) => {
          doc.fontSize(12).text(`Date: ${moment(row.date).format('YYYY-MM-DD')}`);
          doc.text(`Tasks Assigned: ${row.tasksAssigned}`);
          doc.text(`Tasks Completed: ${row.tasksCompleted}`);
          doc.moveDown();
        });
      }

      doc.end();
      return;
    }

    return res.status(400).json({ message: 'Invalid export format' });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Server error exporting data' });
  }
};

module.exports = {
  getDailyReports,
  getMonthlyReports,
  getEmployeePerformance,
  getAttendanceMonthlyReport,
  exportData
};
