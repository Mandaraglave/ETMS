# WFH Request Notification System

## Overview
This document explains how employees are updated when their Work From Home (WFH) requests are approved or rejected by administrators.

## Notification Channels

### 1. Real-Time Notifications (Notification Bell)
- **Location**: Top-right notification bell icon in the header
- **Trigger**: Instant notification when admin approves/rejects WFH request
- **Features**:
  - Visual notification count badge
  - WFH-specific icons (HomeWork for approved, Cancel for rejected)
  - Color-coded indicators (Green for approved, Red for rejected)
  - Click to navigate to Attendance page for detailed view

### 2. Attendance Page Status Updates
- **Location**: `/attendance` page
- **Features**:
  - **WFH Request History Section**: Dedicated card showing all WFH requests
  - **Real-time Status Updates**: Automatic refresh when status changes
  - **Success Messages**: Toast notifications for status changes
  - **Detailed Information**: Shows who approved/rejected and when
  - **Rejection Reasons**: Displays admin-provided rejection reasons

### 3. Full Notifications Page
- **Location**: `/notifications` page
- **Features**:
  - Complete notification history
  - Search and filter capabilities
  - Mark as read/unread functionality
  - WFH-specific notification handling

## Backend Implementation

### Notification Creation
When an admin approves/rejects a WFH request, the system:

1. **Updates WFH Request Status** in the database
2. **Creates Notification Record** with:
   - `type`: 'wfh_approved' or 'wfh_rejected'
   - `title`: "WFH Request Approved" or "WFH Request Rejected"
   - `message`: Detailed status information
   - `recipient`: Employee who made the request
   - `sender`: Admin who approved/rejected
   - `relatedWFHRequest`: Reference to the WFH request

3. **Emits Real-Time Socket Event** to connected employees

### Real-Time Communication
- Uses Socket.IO for instant notifications
- Employees receive notifications immediately upon admin action
- No page refresh required

## Frontend Implementation

### NotificationBell Component Updates
- Added WFH-specific icons and colors
- Navigation to Attendance page for WFH notifications
- Real-time updates via NotificationContext

### Attendance Page Enhancements
- **WFH Request History Card**: Shows all employee WFH requests
- **Status Detection**: Monitors status changes and shows success messages
- **Visual Indicators**: Color-coded status chips with icons
- **Detailed Information**: Shows approver/rejecter name and timestamp

### NotificationContext Integration
- Real-time notification handling
- Automatic UI updates when new notifications arrive
- Unread count management

## User Experience Flow

### For Employees:
1. **Submit WFH Request** via Attendance page
2. **Receive Real-Time Notification** in notification bell when status changes
3. **See Success Message** on Attendance page
4. **View Detailed Status** in WFH Request History section
5. **Access Full History** in Notifications page

### For Administrators:
1. **Review Requests** in WFH Management dashboard
2. **Approve/Reject** with optional rejection reason
3. **System Automatically Notifies** employee
4. **Real-Time Updates** sent to all connected clients

## Visual Indicators

### Status Colors:
- 🟢 **Approved**: Green with CheckCircle icon
- 🔴 **Rejected**: Red with Cancel icon  
- 🟡 **Pending**: Yellow with Pending icon

### Notification Types:
- **Bell Icon**: Shows unread count badge
- **Attendance Page**: Success messages and status updates
- **WFH History**: Comprehensive request status display

## Technical Features

### Automatic Refresh:
- Polling every 30 seconds for status changes
- Real-time socket events for instant updates
- Smart detection of status transitions

### Error Handling:
- Graceful fallback if socket connection fails
- Retry mechanisms for failed notifications
- User-friendly error messages

### Performance:
- Efficient notification batching
- Minimal API calls through smart caching
- Optimized re-rendering with React context

## API Endpoints

### WFH Request Management:
- `POST /api/wfh/requests` - Create WFH request
- `GET /api/wfh/requests/user` - Get user's WFH requests
- `PUT /api/wfh/requests/:id/approve` - Approve request
- `PUT /api/wfh/requests/:id/reject` - Reject request

### Notifications:
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Testing Scenarios

### Happy Path:
1. Employee submits WFH request
2. Admin approves request
3. Employee receives immediate notification
4. Status updates across all UI components

### Edge Cases:
1. Multiple status changes in quick succession
2. Offline user reconnects and receives missed notifications
3. Admin rejection with detailed reason
4. Concurrent requests from same employee

## Future Enhancements

### Planned Features:
- Email notifications for WFH status changes
- Push notifications for mobile users
- Calendar integration for approved WFH days
- Analytics dashboard for WFH trends

### Potential Improvements:
- Batch approval/rejection capabilities
- WFH request templates
- Automated approval based on criteria
- Integration with leave management system

---

**Last Updated**: February 2025
**System Version**: ETMS v2.0
**Status**: Fully Implemented and Tested
