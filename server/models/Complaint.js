import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  priorityScore: { type: Number, min: 0, max: 100, default: 50 },
  status: { 
    type: String, 
    enum: ['Reported', 'Assigned', 'In Progress', 'Resolved'], 
    default: 'Reported' 
  },
  description: { type: String },
  imageUrl: { type: String, required: true },
  afterImageUrl: { type: String, default: null },
  locationName: { type: String, required: true },
  ward: { type: String, default: 'Central Ward' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  citizenName: { type: String, default: 'Citizen' },
  citizenEmail: { type: String, default: 'citizen@cleancity.ai' },
  assignedWorkerId: { type: String, default: null },
  assignedWorkerName: { type: String, default: null },
  resolutionNotes: { type: String, default: null },
  tags: [{ type: String }],
  wasteVolume: { type: String },
  publicHazard: { type: String },
  slaHours: { type: Number, default: 12 },
  resolvedAt: { type: Date, default: null }
}, {
  timestamps: true
});

export const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
