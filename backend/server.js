const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and local network IPs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002'
    ];
    
    // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const localNetworkPattern = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}):\d{4}$/;
    
    if (allowedOrigins.includes(origin) || localNetworkPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for development
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB Connected');
    } else {
      console.log('MongoDB URI not provided - running without database');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
};

connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to HealthMandala API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// OTP Routes
app.use('/api/otp', require('./src/routes/otp'));

// Auth Routes
app.use('/api/auth', require('./src/routes/auth'));

// Patient Registration Routes
app.use('/api/patient', require('./src/routes/patientRegistration'));

// Doctor Registration Routes
app.use('/api/doctor', require('./src/routes/doctorRegistration'));

// Appointments Routes
app.use('/api/appointments', require('./src/routes/appointments'));

// Prescriptions Routes
app.use('/api/prescriptions', require('./src/routes/prescriptions'));

// Hospital Partner Routes
app.use('/api/partner', require('./src/routes/hospitalPartner'));

// Hospital Dashboard Routes
app.use('/api/hospital-dashboard', require('./src/routes/hospitalDashboard'));

// Doctor Auth Routes
app.use('/api/doctor-auth', require('./src/routes/doctorAuth'));

// Staff Auth Routes
app.use('/api/staff-auth', require('./src/routes/staffAuth'));

// Khalti Payment Routes
app.use('/api/khalti', require('./src/routes/khalti'));

// Notifications Routes
app.use('/api/notifications', require('./src/routes/notifications'));

// Issues Routes
app.use('/api/issues', require('./src/routes/issues'));

// Inventory Routes
app.use('/api/inventory', require('./src/routes/inventory'));

// ── Appointment reminder scheduler ──────────────────────────────────────────
// Runs every 15 minutes to check for upcoming appointments and send reminders.
const scheduleReminders = () => {
  const { createNotification } = require('./src/routes/notifications');
  const Appointment = require('./src/models/Appointment');
  const Notification = require('./src/models/Notification');

  const check = async () => {
    try {
      const now = new Date();

      // 24-hour reminder window: appointments starting between 23h45m and 24h15m from now
      const h24start = new Date(now.getTime() + 23 * 60 * 60 * 1000 + 45 * 60 * 1000);
      const h24end   = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000);

      // 12-hour reminder window: appointments starting between 11h45m and 12h15m from now
      const h12start = new Date(now.getTime() + 11 * 60 * 60 * 1000 + 45 * 60 * 1000);
      const h12end   = new Date(now.getTime() + 12 * 60 * 60 * 1000 + 15 * 60 * 1000);

      // 2-hour reminder window: appointments starting between 1h45m and 2h15m from now
      const h2start  = new Date(now.getTime() +  1 * 60 * 60 * 1000 + 45 * 60 * 1000);
      const h2end    = new Date(now.getTime() +  2 * 60 * 60 * 1000 + 15 * 60 * 1000);

      const upcoming = await Appointment.find({
        appointmentDate: { $gte: h2start, $lte: h24end },
        status: { $in: ['pending', 'confirmed', 'checked_in', 'prescribed'] },
        patientId: { $ne: null },
      });

      for (const apt of upcoming) {
        const aptDateTime = new Date(apt.appointmentDate);
        // Combine date with appointmentTime if available
        if (apt.appointmentTime) {
          const [h, m] = apt.appointmentTime.split(':').map(Number);
          aptDateTime.setUTCHours(h, m, 0, 0);
        }

        const msUntil = aptDateTime.getTime() - now.getTime();
        const is24h = msUntil >= h24start.getTime() - now.getTime() && msUntil <= h24end.getTime() - now.getTime();
        const is12h = msUntil >= h12start.getTime() - now.getTime() && msUntil <= h12end.getTime() - now.getTime();
        const is2h  = msUntil >= h2start.getTime()  - now.getTime() && msUntil <= h2end.getTime()  - now.getTime();

        const timeStr = apt.appointmentTime
          ? (() => { const [h, m] = apt.appointmentTime.split(':').map(Number); const p = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; return `${h12}:${String(m).padStart(2,'0')} ${p}`; })()
          : 'your scheduled time';

        if (is24h) {
          // Check if we already sent a 24h reminder for this appointment
          const exists = await Notification.findOne({ appointmentId: apt._id, type: 'reminder_24h' });
          if (!exists) {
            await createNotification({
              userId: apt.patientId,
              type: 'reminder_24h',
              title: '⏰ Appointment Tomorrow',
              detail: `Reminder: You have an appointment tomorrow at ${timeStr} with ${apt.doctorName}. Please bring your digital patient card.`,
              appointmentId: apt._id,
            });
          }
        }

        if (is12h) {
          const exists = await Notification.findOne({ appointmentId: apt._id, type: 'reminder_12h' });
          if (!exists) {
            await createNotification({
              userId: apt.patientId,
              type: 'reminder_12h',
              title: '🕛 Appointment in 12 Hours',
              detail: `Your appointment with ${apt.doctorName} at ${apt.hospital} is in about 12 hours at ${timeStr}. Make sure you have your digital patient card ready.`,
              appointmentId: apt._id,
            });
          }
        }

        if (is2h) {
          const exists = await Notification.findOne({ appointmentId: apt._id, type: 'reminder_2h' });
          if (!exists) {
            await createNotification({
              userId: apt.patientId,
              type: 'reminder_2h',
              title: '🚦 Appointment Today',
              detail: `Your appointment is today at ${timeStr} with ${apt.doctorName} at ${apt.hospital}.`,
              appointmentId: apt._id,
            });
          }
        }
      }
    } catch (err) {
      console.error('Reminder scheduler error:', err.message);
    }
  };

  // Run immediately on startup, then every 15 minutes
  check();
  setInterval(check, 15 * 60 * 1000);
};

// Start scheduler after DB connects (give it 3 seconds)
setTimeout(scheduleReminders, 3000);

// Import routes (to be created)
// app.use('/api/users', require('./routes/users'));
// app.use('/api/doctors', require('./routes/doctors'));
// app.use('/api/appointments', require('./routes/appointments'));

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// ── WebSocket server (real-time check-in notifications for doctor dashboard) ──
const http = require('http');
const WebSocket = require('ws');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Broadcast a message to all connected WebSocket clients
const broadcast = (data) => {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};

// Attach broadcast so routes can use it
app.set('broadcast', broadcast);

wss.on('connection', (ws) => {
  ws.on('error', () => {});
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://YOUR_IP:${PORT}`);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});
