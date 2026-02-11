const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Reminder window: tasks due within this many hours
const REMINDER_HOURS = parseInt(process.env.DEADLINE_REMINDER_HOURS) || 24;

/**
 * Find tasks due soon and send notifications + emails
 */
const runDeadlineReminders = async (io) => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_HOURS * 60 * 60 * 1000);

    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: windowEnd },
      status: { $nin: ['completed', 'approved', 'rejected'] },
    })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .lean();

    if (tasks.length === 0) {
      return;
    }

    const notifiedTaskIds = new Set();

    for (const task of tasks) {
      if (!task.assignedTo || notifiedTaskIds.has(task._id.toString())) {
        continue;
      }

      // Check if we already sent a reminder for this task today
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const existingReminder = await Notification.findOne({
        relatedTask: task._id,
        type: 'deadline_reminder',
        createdAt: { $gte: todayStart },
      });

      if (existingReminder) {
        continue;
      }

      const recipientId = task.assignedTo._id?.toString?.() || task.assignedTo.toString();
      const assigneeName = task.assignedTo.name || 'Employee';

      const notification = new Notification({
        recipient: recipientId,
        sender: task.assignedBy?._id || task.assignedBy,
        title: 'Deadline Reminder',
        message: `Task "${task.title}" is due soon (${new Date(task.dueDate).toLocaleString()})`,
        type: 'deadline_reminder',
        relatedTask: task._id,
      });
      await notification.save();

      if (io) {
        io.to(recipientId).emit('notification', {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
        });
      }

      try {
        const emailTemplate = emailTemplates.deadlineReminder(task, assigneeName);
        await sendEmail(task.assignedTo.email, emailTemplate.subject, emailTemplate.html);
      } catch (emailError) {
        console.error('Deadline reminder email failed:', emailError);
      }

      notifiedTaskIds.add(task._id.toString());
    }

    if (notifiedTaskIds.size > 0) {
      console.log(`[Deadline Reminder] Sent ${notifiedTaskIds.size} reminder(s)`);
    }
  } catch (err) {
    console.error('[Deadline Reminder] Error:', err);
  }
};

/**
 * Start the deadline reminder cron job
 * Runs every hour by default
 */
const startDeadlineReminderJob = (io) => {
  const schedule = process.env.DEADLINE_REMINDER_CRON || '0 * * * *'; // Every hour at :00

  cron.schedule(schedule, () => {
    runDeadlineReminders(io);
  });

  console.log(`[Deadline Reminder] Cron job scheduled: ${schedule}`);
};

module.exports = {
  runDeadlineReminders,
  startDeadlineReminderJob,
};
