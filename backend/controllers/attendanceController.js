 const Attendance = require('../models/Attendance');
const User = require('../models/User');
const OFFICE_LOCATION = require('../config/officeLocation');
// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

// Helper function to get date range for queries
const getDateRange = (dateString) => {
  const date = new Date(dateString);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Get user's IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Get browser information
const getBrowserInfo = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};

// Check-in with location validation
const checkIn = async (req, res) => {
  try {
    console.log('=== LOCATION-BASED CHECK-IN ===');
    
    const { latitude, longitude, accuracy, address } = req.body;
    const userId = req.user.id;
    
    // Get user's office location
    const officeCoords = OFFICE_LOCATION.coordinates;

    // const user = await User.findById(userId);
    // if (!user || !user.officeLocation) {
    //   return res.status(400).json({ 
    //     message: 'Office location not configured for this user' 
    //   });
    // }

    // const officeCoords = user.officeLocation.coordinates;
    const userCoords = { latitude, longitude };
    
    // Calculate distance from office
    const distance = calculateDistance(
      officeCoords.latitude, 
      officeCoords.longitude, 
      parseFloat(latitude), 
      parseFloat(longitude)
    );

    // Check if distance is valid
    if (isNaN(distance)) {
      return res.status(400).json({
        message: 'Invalid location coordinates',
        error: 'Distance calculation failed'
      });
    }

    const isWithinOffice = distance <= officeCoords.radius;
    
    // TEMPORARILY DISABLE GEOFENCE RESTRICTIONS FOR TESTING
    // Comment this back in to enable geofence restrictions
    /*
    if (!isWithinOffice) {
  return res.status(403).json({
    message: 'Outside office geofence. Check-in denied.',
    distance: distance
  });
}
    */

    console.log('📍 Location Analysis:', {
      userLocation: userCoords,
      officeLocation: officeCoords,
      distance: `${distance.toFixed(2)}m`,
      radius: `${officeCoords.radius}m`,
      isWithinOffice
    });

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ 
        message: 'Already checked in today' 
      });
    }

    // Create or update attendance record
    const attendanceData = {
      user: userId,
      date: today,
      checkIn: {
        time: new Date(),
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: parseFloat(accuracy),
          address: address || 'Unknown location',
          browser: getBrowserInfo(req),
          ip: getClientIP(req)
        },
        isWithinOffice,
        distanceFromOffice: distance
      },
      status: isWithinOffice ? 'present' : 'late'
    };

    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id, 
        attendanceData, 
        { new: true }
      );
    } else {
      attendance = await Attendance.create(attendanceData);
    }

    console.log('✅ Check-in successful:', {
      isWithinOffice,
      distance: `${distance.toFixed(2)}m`,
      status: attendanceData.status
    });

    res.json({
      message: isWithinOffice ? 
        'Check-in successful from office location' : 
        'You are not at office location. Check-in recorded but marked as late.',
      attendance,
      location: {
        isWithinOffice,
        distance: `${distance.toFixed(2)}m`,
        officeRadius: `${officeCoords.radius}m`,
        message: isWithinOffice ? 
          'You are within office geofence' : 
          `You are ${distance.toFixed(2)}m away from office (outside ${officeCoords.radius}m radius)`
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
};

// Check-out with location validation
const checkOut = async (req, res) => {
  try {
    console.log('=== LOCATION-BASED CHECK-OUT ===');
    
    const { latitude, longitude, accuracy, address } = req.body;
    const userId = req.user.id;
    
    // Get today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ 
        message: 'No check-in record found for today' 
      });
    }

    if (attendance.checkOut && attendance.checkOut.time) {
      return res.status(400).json({ 
        message: 'Already checked out today' 
      });
    }

    // Get user's office location
    const officeCoords = OFFICE_LOCATION.coordinates;

    // const user = await User.findById(userId);
    // const officeCoords = user.officeLocation.coordinates;
    
    // Calculate distance from office
    const distance = calculateDistance(
      officeCoords.latitude, 
      officeCoords.longitude, 
      parseFloat(latitude), 
      parseFloat(longitude)
    );

    const isWithinOffice = distance <= officeCoords.radius;
    
    // TEMPORARILY DISABLE GEOFENCE RESTRICTIONS FOR TESTING
    // Comment this back in to enable geofence restrictions
    /*
    if (!isWithinOffice) {
  return res.status(403).json({
    message: 'Outside office geofence. Check-in denied.',
    distance: distance
  });
}
    */

    console.log('📍 Check-out Location Analysis:', {
      userLocation: { latitude, longitude },
      officeLocation: officeCoords,
      distance: `${distance.toFixed(2)}m`,
      radius: `${officeCoords.radius}m`,
      isWithinOffice
    });

    // Calculate total hours
    const checkInTime = attendance.checkIn.time;
    const checkOutTime = new Date();
    const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    const overtime = Math.max(0, totalHours - 8); // Overtime after 8 hours

    // Update attendance record
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      {
        checkOut: {
          time: checkOutTime,
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            accuracy: parseFloat(accuracy),
            address: address || 'Unknown location',
            browser: getBrowserInfo(req),
            ip: getClientIP(req)
          },
          isWithinOffice,
          distanceFromOffice: distance
        },
        totalHours: parseFloat(totalHours.toFixed(2)),
        overtime: parseFloat(overtime.toFixed(2)),
        status: isWithinOffice ? 'present' : 'early_leave'
      },
      { new: true }
    );

    console.log('✅ Check-out successful:', {
      totalHours: `${totalHours.toFixed(2)}h`,
      overtime: `${overtime.toFixed(2)}h`,
      isWithinOffice,
      distance: `${distance.toFixed(2)}m`
    });

    res.json({
      message: isWithinOffice ? 
        'Check-out successful from office location' : 
        'You are not at office location. Check-out recorded but marked as early leave.',
      attendance: updatedAttendance,
      location: {
        isWithinOffice,
        distance: `${distance.toFixed(2)}m`,
        officeRadius: `${officeCoords.radius}m`,
        message: isWithinOffice ? 
          'You are within office geofence' : 
          `You are ${distance.toFixed(2)}m away from office (outside ${officeCoords.radius}m radius)`
      },
      workHours: {
        total: `${totalHours.toFixed(2)}h`,
        overtime: `${overtime.toFixed(2)}h`
      }
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error during check-out' });
  }
};

// Get attendance records
const getAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, userId } = req.query;
    const query = {};
    
    if (userId) query.user = userId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const { start } = getDateRange(startDate);
        query.date.$gte = start;
      }
      if (endDate) {
        const { end } = getDateRange(endDate);
        query.date.$lte = end;
      }
    }

    const skip = (page - 1) * limit;
    
    const attendance = await Attendance.find(query)
      .populate('user', 'name email employeeId')
      .populate('approvedBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Attendance.countDocuments(query);
    
    res.json({
      attendance,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

// Get today's attendance status
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('user', 'name employeeId');

    if (!attendance) {
      return res.json({
        message: 'No attendance record for today',
        canCheckIn: true,
        canCheckOut: false,
        status: 'not_checked_in'
      });
    }

    const canCheckIn = !attendance.checkIn;
    const canCheckOut = attendance.checkIn && !attendance.checkOut;

    res.json({
      attendance,
      canCheckIn,
      canCheckOut,
      status: attendance.status,
      message: canCheckIn ? 'Ready for check-in' : canCheckOut ? 'Ready for check-out' : 'Already completed'
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getTodayAttendance
};
