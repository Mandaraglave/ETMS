const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email notification
const sendEmail = async (to, subject, html, text = '') => {
  try {
    console.log('=== EMAIL SENDING STARTED ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Email config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      passExists: !!process.env.EMAIL_PASS
    });
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html,
      text: text
    };

    console.log('📧 Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending error details:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Common email errors and their meanings
    if (error.code === 'EAUTH') {
      console.error('❌ Authentication failed - Check EMAIL_USER and EMAIL_PASS');
    } else if (error.code === 'ECONNECTION') {
      console.error('❌ Connection failed - Check EMAIL_HOST and EMAIL_PORT');
    } else if (error.code === 'ENOTFOUND') {
      console.error('❌ Host not found - Check EMAIL_HOST');
    }
    
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  taskAssigned: (task, employeeName) => ({
    subject: `New Task Assigned: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Task Assigned</h2>
        <p>Hello ${employeeName},</p>
        <p>You have been assigned a new task:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>${task.title}</h3>
          <p><strong>Description:</strong> ${task.description}</p>
          <p><strong>Priority:</strong> ${task.priority}</p>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Estimated Time:</strong> ${task.estimatedTime} hours</p>
        </div>
        <p>Please log in to your dashboard to view the task details and start working on it.</p>
        <p>Best regards,<br>ETMS Team</p>
      </div>
    `
  }),

  taskCompleted: (task, adminName) => ({
    subject: `Task Completed: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Task Completed</h2>
        <p>Hello ${adminName},</p>
        <p>A task has been completed by ${task.assignedTo.name}:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>${task.title}</h3>
          <p><strong>Description:</strong> ${task.description}</p>
          <p><strong>Completed At:</strong> ${new Date(task.completedAt).toLocaleDateString()}</p>
          <p><strong>Progress:</strong> ${task.progress}%</p>
        </div>
        <p>Please log in to review and approve the task.</p>
        <p>Best regards,<br>ETMS Team</p>
      </div>
    `
  }),

  loginOtp: (email, otp) => ({
    subject: 'Your ETMS Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">ETMS Login Verification</h2>
        <p>You requested a one-time password to sign in to ETMS.</p>
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 0;">${otp}</p>
        </div>
        <p style="color: #666;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>ETMS Team</p>
      </div>
    `
  }),

  deadlineReminder: (task, employeeName) => ({
    subject: `Task Deadline Reminder: ${task.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Deadline Reminder</h2>
        <p>Hello ${employeeName},</p>
        <p>This is a reminder that your task is due soon:</p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>${task.title}</h3>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Current Progress:</strong> ${task.progress}%</p>
        </div>
        <p>Please ensure you complete the task before the deadline.</p>
        <p>Best regards,<br>ETMS Team</p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};
