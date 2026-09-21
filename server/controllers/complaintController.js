import { Complaint } from '../models/Complaint.js';
import mongoose from 'mongoose';
import { sendOTPEmail, sendLoginAlertEmail, generateOTP, otpStore } from '../services/emailService.js';

// Kanpur City Seed Locations & Wards
export const KANPUR_WARDS = [
  'Ward 01 - Kakadeo & Geeta Nagar',
  'Ward 02 - Swaroop Nagar & Arya Nagar',
  'Ward 03 - Kalyanpur & IIT Kanpur Zone',
  'Ward 04 - Civil Lines & Mall Road',
  'Ward 05 - Govind Nagar & Fazalganj',
  'Ward 06 - Kidwai Nagar & Yashoda Nagar',
  'Ward 07 - Barra & Gujaini Sector',
  'Ward 08 - Gumti No. 5 & Harsh Nagar',
  'Ward 09 - Parade Market & Naveen Market',
  'Ward 10 - Jajmau & Ganga Barrage Area'
];

export const KANPUR_SEED_COMPLAINTS = [
  {
    ticketId: 'CC-KN-8941',
    citizenUserId: 'KAN-CIT-1042',
    title: 'Severe Municipal Waste Overflow on Main Road',
    category: 'Garbage Overflow',
    severity: 'High',
    priorityScore: 86,
    status: 'In Progress',
    description: 'Large community waste bin overflowing across footpath and road, blocking market traffic.',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: null,
    locationName: 'Near Rave 3 Mall & Gurudev Crossing, Kakadeo, Kanpur',
    ward: 'Ward 01 - Kakadeo & Geeta Nagar',
    city: 'Kanpur',
    lat: 26.4727,
    lng: 80.3012,
    citizenName: 'Aarav Patel',
    citizenPhone: '+91 98765-43210',
    assignedWorkerId: 'w1',
    assignedWorkerName: 'Rajesh Sharma',
    assignedWorkerPhone: '+91 98112-33441',
    tags: ['Plastic Waste', 'Market Traffic Obstruction'],
    wasteVolume: 'Est. 520 kg',
    publicHazard: 'High',
    slaHours: 12,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    ticketId: 'CC-KN-8940',
    citizenUserId: 'KAN-CIT-8832',
    title: 'Open Drain Choked with Sewage Overflow',
    category: 'Blocked Drainage',
    severity: 'Critical',
    priorityScore: 95,
    status: 'Resolved',
    description: 'Choked storm drain causing filthy sewer water stagnation near hospital entry gate.',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    locationName: 'Near Hallet (LLR) Hospital & Swaroop Nagar, Kanpur',
    ward: 'Ward 02 - Swaroop Nagar & Arya Nagar',
    city: 'Kanpur',
    lat: 26.4850,
    lng: 80.3250,
    citizenName: 'Priya Sharma',
    citizenPhone: '+91 98334-12345',
    assignedWorkerId: 'w3',
    assignedWorkerName: 'Anita Devi',
    assignedWorkerPhone: '+91 98334-55663',
    resolutionNotes: 'Suction jetting machine cleared plastic bottle blockages. Drain restored, lime powder sanitized.',
    resolvedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    tags: ['Hospital Zone', 'Sewage Overflow'],
    wasteVolume: 'Stagnant Drain 35m',
    publicHazard: 'Critical',
    slaHours: 4,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    ticketId: 'CC-KN-8939',
    citizenUserId: 'KAN-CIT-5521',
    title: 'Deep Asphalt Pothole on Industrial Route',
    category: 'Pothole & Road Hazard',
    severity: 'High',
    priorityScore: 79,
    status: 'Reported',
    description: 'Hazardous crater near industrial traffic junction causing vehicle tire damage.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: null,
    locationName: 'Dada Nagar Industrial Area, Fazalganj, Kanpur',
    ward: 'Ward 05 - Govind Nagar & Fazalganj',
    city: 'Kanpur',
    lat: 26.4480,
    lng: 80.3080,
    citizenName: 'Rohan Gupta',
    citizenPhone: '+91 98445-98765',
    assignedWorkerId: null,
    assignedWorkerName: null,
    assignedWorkerPhone: null,
    tags: ['Road Hazard', 'Industrial Traffic'],
    wasteVolume: '1.4m crater',
    publicHazard: 'High',
    slaHours: 12,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
  }
];

export const INITIAL_WORKERS = [
  { id: 'w1', name: 'Rajesh Sharma', role: 'Rapid Sanitation Lead', phone: '+91 98112-33441', zone: 'Ward 01 - Kakadeo & Geeta Nagar', city: 'Kanpur', activeTasks: 1, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'w2', name: 'Vikram Singh', role: 'Heavy Waste Compactor Crew', phone: '+91 98223-44552', zone: 'Ward 03 - Kalyanpur & IIT Kanpur Zone', city: 'Kanpur', activeTasks: 0, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  { id: 'w3', name: 'Anita Devi', role: 'Drainage & Sewage Specialist', phone: '+91 98334-55663', zone: 'Ward 02 - Swaroop Nagar & Arya Nagar', city: 'Kanpur', activeTasks: 0, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80' },
  { id: 'w4', name: 'Mohammed Farooq', role: 'Asphalt & Road Patch Unit', phone: '+91 98445-66774', zone: 'Ward 05 - Govind Nagar & Fazalganj', city: 'Kanpur', activeTasks: 1, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
];

let memoryStore = [...KANPUR_SEED_COMPLAINTS];
let memoryWorkers = [...INITIAL_WORKERS];
let memoryUsers = [
  { id: 'u1', userId: 'KAN-CIT-1042', name: 'Aarav Patel', email: 'citizen@cleancity.ai', password: 'password123', role: 'citizen', phone: '+91 98765-43210', address: '124/A, Geeta Nagar, Kakadeo, Kanpur', lastLogin: new Date(Date.now() - 3600000 * 1).toISOString(), registeredAt: '2026-09-18T09:30:00Z', totalReports: 2 },
  { id: 'u2', userId: 'KAN-ADM-0001', name: 'Kanpur Municipal Admin', email: 'admin@cleancity.ai', password: 'admin123', role: 'admin', phone: '+91 99999-88888', address: 'Kanpur Nagar Nigam HQ, Moti Jheel, Kanpur', lastLogin: new Date().toISOString(), registeredAt: '2026-09-15T08:00:00Z', totalReports: 0 },
  { id: 'u3', userId: 'KAN-WRK-0012', name: 'Rajesh Sharma', email: 'rajesh@cleancity.ai', password: 'worker123', role: 'worker', phone: '+91 98112-33441', workerId: 'w1', address: 'Sanitation Depot 4, Kakadeo, Kanpur', lastLogin: new Date(Date.now() - 3600000 * 3).toISOString(), registeredAt: '2026-09-16T10:15:00Z', totalReports: 0 },
  { id: 'u4', userId: 'KAN-CIT-8832', name: 'Priya Sharma', email: 'priya@cleancity.ai', password: 'password123', role: 'citizen', phone: '+91 98334-12345', address: 'Plot 45, Swaroop Nagar, Kanpur', lastLogin: new Date(Date.now() - 3600000 * 6).toISOString(), registeredAt: '2026-09-19T11:00:00Z', totalReports: 1 }
];

const isMongooseConnected = () => mongoose.connection.readyState === 1;

export const calculatePriorityScore = ({ severity, category }) => {
  let score = 45;
  if (severity === 'Critical') score += 35;
  else if (severity === 'High') score += 25;
  else if (severity === 'Medium') score += 15;
  else score += 5;

  if (category === 'Blocked Drainage' || category === 'Hazardous Waste') score += 15;
  else if (category === 'Garbage Overflow' || category === 'Illegal Waste Dumping') score += 12;
  else score += 6;

  return Math.min(99, Math.max(25, score));
};

// --- OTP & EMAIL AUTH CONTROLLERS ---
export const sendOTP = async (req, res) => {
  try {
    const { target, type = 'email', purpose = 'Account Registration' } = req.body;
    if (!target) {
      return res.status(400).json({ success: false, message: 'Target email or mobile number is required' });
    }

    const cleanTarget = target.toString().toLowerCase().trim();
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanTarget, {
      otp,
      expiresAt,
      verified: false,
      type
    });

    if (type === 'email' || cleanTarget.includes('@')) {
      try {
        await sendOTPEmail(cleanTarget, otp, purpose);
        console.log(`[CleanCity Email] Sent OTP ${otp} to ${cleanTarget}`);
        return res.json({
          success: true,
          message: `Verification OTP sent to ${cleanTarget}`,
          expiresInSeconds: 600
        });
      } catch (mailErr) {
        console.error('[CleanCity Email Error]', mailErr);
        // Fallback for offline/network hiccups while maintaining UX
        return res.json({
          success: true,
          message: `OTP generated for ${cleanTarget} (Email relay warning: ${mailErr.message})`,
          otp, // Dev fallback
          expiresInSeconds: 600
        });
      }
    } else {
      console.log(`[CleanCity Mobile OTP] Simulated SMS to ${cleanTarget} with code ${otp}`);
      return res.json({
        success: true,
        message: `OTP sent to mobile ${cleanTarget}`,
        otp,
        expiresInSeconds: 600
      });
    }
  } catch (err) {
    console.error('[sendOTP Exception]', err);
    return res.status(500).json({ success: false, message: 'Failed to dispatch OTP: ' + err.message });
  }
};

export const verifyOTP = (req, res) => {
  const { target, otp } = req.body;
  if (!target || !otp) {
    return res.status(400).json({ success: false, message: 'Target and 6-digit OTP code are required' });
  }

  const cleanTarget = target.toString().toLowerCase().trim();
  const record = otpStore.get(cleanTarget);

  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP requested for this account or it has expired. Please request a new OTP.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanTarget);
    return res.status(400).json({ success: false, message: 'OTP has expired. Please click resend to get a fresh code.' });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP code entered. Please try again.' });
  }

  record.verified = true;
  return res.json({ success: true, message: 'OTP verified successfully' });
};

export const sendTestMail = async (req, res) => {
  try {
    const targetEmail = req.body?.email || 'nitinkumar.passionne@gmail.com';
    const info = await sendOTPEmail(targetEmail, '924185', 'CleanCity AI SMTP Live Verification');
    return res.json({
      success: true,
      message: `Test email sent successfully to ${targetEmail}`,
      messageId: info.messageId
    });
  } catch (err) {
    console.error('[sendTestMail Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to send test email: ' + err.message });
  }
};

// --- AUTH CONTROLLERS ---
export const loginUser = (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = memoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ success: false, message: `Access denied. This account is registered as '${user.role}', not '${role}'.` });
  }

  // Update last login timestamp
  user.lastLogin = new Date().toISOString();

  // Asynchronously send Login Notification Email to user's registered email
  sendLoginAlertEmail(user.email, {
    userName: user.name,
    role: user.role,
    timestamp: user.lastLogin,
    ip: req.ip || req.headers['x-forwarded-for'] || 'Localhost'
  }).then(info => {
    console.log(`[CleanCity Login Alert] Sent security notification to ${user.email} (MessageID: ${info?.messageId})`);
  }).catch(err => {
    console.warn(`[CleanCity Login Alert] Notice email skipped for ${user.email}:`, err.message);
  });

  return res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      lastLogin: user.lastLogin,
      workerId: user.workerId
    }
  });
};

export const registerUser = (req, res) => {
  const { name, email, password, role = 'citizen', phone, customUserId, address, zone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  const existing = memoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'User with this email already exists' });
  }

  const generatedId = customUserId || (
    role === 'admin' ? `KAN-ADM-${Math.floor(1000 + Math.random() * 9000)}` :
      role === 'worker' ? `KAN-WRK-${Math.floor(1000 + Math.random() * 9000)}` :
        `KAN-CIT-${Math.floor(1000 + Math.random() * 9000)}`
  );

  const newUser = {
    id: `u_${Date.now()}`,
    userId: generatedId,
    name,
    email,
    password,
    role,
    phone: phone || '+91 98000-00000',
    address: address || 'Kanpur, Uttar Pradesh',
    lastLogin: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    totalReports: 0,
    workerId: role === 'worker' ? `w_${Date.now()}` : null
  };

  memoryUsers.push(newUser);

  if (role === 'worker') {
    memoryWorkers.push({
      id: newUser.workerId,
      name: newUser.name,
      role: 'Sanitation Field Crew',
      phone: newUser.phone,
      zone: zone || 'Ward 01 - Kakadeo & Geeta Nagar',
      city: 'Kanpur',
      activeTasks: 0,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    });
  }

  // Also send a welcome/login alert for newly registered user
  sendLoginAlertEmail(newUser.email, {
    userName: newUser.name,
    role: newUser.role,
    timestamp: newUser.registeredAt,
    ip: req.ip || req.headers['x-forwarded-for'] || 'Localhost'
  }).catch(err => console.warn('[Welcome Alert Error]', err.message));

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: {
      id: newUser.id,
      userId: newUser.userId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      address: newUser.address,
      lastLogin: newUser.lastLogin,
      workerId: newUser.workerId
    }
  });
};

// --- GET ALL USERS (ADMIN PRIVILEGED AUDIT) ---
export const getAllUsers = (req, res) => {
  const sanitizedUsers = memoryUsers.map(u => ({
    id: u.id,
    userId: u.userId,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    address: u.address,
    lastLogin: u.lastLogin || u.registeredAt,
    registeredAt: u.registeredAt || new Date().toISOString()
  }));
  return res.json({ success: true, count: sanitizedUsers.length, data: sanitizedUsers });
};

// --- COMPLAINTS CONTROLLERS ---
export const getComplaints = async (req, res) => {
  try {
    if (isMongooseConnected()) {
      let complaints = await Complaint.find().sort({ createdAt: -1 });
      if (complaints.length === 0) {
        await Complaint.insertMany(KANPUR_SEED_COMPLAINTS);
        complaints = await Complaint.find().sort({ createdAt: -1 });
      }
      return res.json({ success: true, count: complaints.length, data: complaints });
    } else {
      return res.json({ success: true, count: memoryStore.length, data: memoryStore });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createComplaint = async (req, res) => {
  try {
    const {
      title,
      category,
      severity,
      description,
      imageUrl,
      locationName,
      ward,
      lat,
      lng,
      citizenName,
      citizenPhone,
      citizenUserId,
      city = 'Kanpur'
    } = req.body;

    if (!title || !category || !imageUrl || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const ticketId = `CC-KN-${Math.floor(1000 + Math.random() * 9000)}`;
    const priorityScore = calculatePriorityScore({ severity: severity || 'High', category });
    const slaHours = severity === 'Critical' ? 4 : severity === 'High' ? 12 : 24;

    const payload = {
      ticketId,
      citizenUserId: citizenUserId || 'KAN-CIT-1042',
      title,
      category,
      severity: severity || 'High',
      priorityScore,
      status: 'Reported',
      description: description || 'Citizen reported cleanliness issue in Kanpur.',
      imageUrl,
      afterImageUrl: null,
      locationName: locationName || 'Kakadeo, Kanpur',
      ward: ward || 'Ward 01 - Kakadeo & Geeta Nagar',
      city: city || 'Kanpur',
      lat: Number(lat),
      lng: Number(lng),
      citizenName: citizenName || 'Aarav Patel',
      citizenPhone: citizenPhone || '+91 98765-43210',
      slaHours,
      createdAt: new Date().toISOString()
    };

    // Update user report count
    const foundUser = memoryUsers.find(u => u.userId === citizenUserId || u.email === citizenUserId);
    if (foundUser) {
      foundUser.totalReports = (foundUser.totalReports || 0) + 1;
    }

    if (isMongooseConnected()) {
      const doc = await Complaint.create(payload);
      return res.status(201).json({ success: true, data: doc });
    } else {
      memoryStore.unshift(payload);
      return res.status(201).json({ success: true, data: payload });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignWorker = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { workerId } = req.body;
    const worker = memoryWorkers.find(w => w.id === workerId) || memoryWorkers[0];

    if (isMongooseConnected()) {
      const doc = await Complaint.findOneAndUpdate(
        { ticketId },
        {
          status: 'Assigned',
          assignedWorkerId: worker.id,
          assignedWorkerName: worker.name,
          assignedWorkerPhone: worker.phone
        },
        { new: true }
      );
      return res.json({ success: true, data: doc });
    } else {
      const item = memoryStore.find(c => c.ticketId === ticketId);
      if (item) {
        item.status = 'Assigned';
        item.assignedWorkerId = worker.id;
        item.assignedWorkerName = worker.name;
        item.assignedWorkerPhone = worker.phone;
      }
      return res.json({ success: true, data: item });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (isMongooseConnected()) {
      const doc = await Complaint.findOneAndUpdate(
        { ticketId },
        { status },
        { new: true }
      );
      return res.json({ success: true, data: doc });
    } else {
      const item = memoryStore.find(c => c.ticketId === ticketId);
      if (item) {
        item.status = status;
      }
      return res.json({ success: true, data: item });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveComplaint = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { afterImageUrl, notes } = req.body;

    const updates = {
      status: 'Resolved',
      afterImageUrl: afterImageUrl || 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800&q=80',
      resolutionNotes: notes || 'Kanpur Municipal Sanitation team resolved the issue and disinfected road perimeter.',
      resolvedAt: new Date().toISOString()
    };

    if (isMongooseConnected()) {
      const doc = await Complaint.findOneAndUpdate({ ticketId }, updates, { new: true });
      return res.json({ success: true, data: doc });
    } else {
      const item = memoryStore.find(c => c.ticketId === ticketId);
      if (item) {
        Object.assign(item, updates);
      }
      return res.json({ success: true, data: item });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- WORKER MANAGEMENT ---
export const getWorkers = (req, res) => {
  return res.json({ success: true, data: memoryWorkers });
};

export const addWorker = (req, res) => {
  const { name, role, phone, zone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Worker name and mobile number are required' });
  }

  const newWorker = {
    id: `w_${Date.now()}`,
    name,
    role: role || 'Rapid Sanitation Crew',
    phone,
    zone: zone || 'Ward 01 - Kakadeo & Geeta Nagar',
    city: 'Kanpur',
    activeTasks: 0,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
  };

  memoryWorkers.unshift(newWorker);
  return res.status(201).json({ success: true, message: 'Field worker added to Kanpur municipal roster', data: newWorker });
};

export const deleteWorker = (req, res) => {
  const { workerId } = req.params;
  memoryWorkers = memoryWorkers.filter(w => w.id !== workerId);
  return res.json({ success: true, message: 'Worker removed from municipal roster', data: memoryWorkers });
};

// --- DATA TELEMETRY EXPORT ---
export const exportAdminData = (req, res) => {
  const registeredCount = memoryStore.length;
  const resolvedCount = memoryStore.filter(c => c.status === 'Resolved').length;
  const inProgressCount = memoryStore.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const pendingCount = memoryStore.filter(c => c.status === 'Reported').length;

  const dataExport = {
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    generatedAt: new Date().toISOString(),
    summaryMetrics: {
      totalRegisteredProblems: registeredCount,
      totalResolvedProblems: resolvedCount,
      totalPendingProblems: pendingCount,
      totalInProgressProblems: inProgressCount,
      resolutionRate: registeredCount > 0 ? `${Math.round((resolvedCount / registeredCount) * 100)}%` : '0%',
      totalRegisteredUsers: memoryUsers.length,
      totalFieldWorkers: memoryWorkers.length
    },
    registeredUsersAudit: memoryUsers.map(u => ({
      userId: u.userId,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      address: u.address,
      registeredAt: u.registeredAt,
      lastLogin: u.lastLogin
    })),
    complaints: memoryStore,
    workers: memoryWorkers
  };
  return res.json({ success: true, data: dataExport });
};

export const getKanpurWards = (req, res) => {
  return res.json({ success: true, data: KANPUR_WARDS });
};
