export const SEED_COMPLAINTS = [
  {
    ticketId: 'CC-2026-8941',
    title: 'Overflowing Municipal Garbage Dumpster',
    category: 'Garbage Overflow',
    severity: 'High',
    priorityScore: 84,
    status: 'In Progress',
    description: 'Waste overflowing from large blue community bin onto sidewalk. Stray animals scattering plastic.',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: null,
    locationName: 'Sector 14 Market Crossing, Central Ward',
    ward: 'Ward 12 - Central',
    lat: 28.6139,
    lng: 77.2090,
    citizenName: 'Aarav Patel',
    assignedWorkerId: 'w1',
    assignedWorkerName: 'Rajesh Sharma',
    tags: ['Plastic Waste', 'Pedestrian Obstruction', 'Health Hazard'],
    wasteVolume: 'Est. 450 kg',
    publicHazard: 'High',
    slaHours: 12
  },
  {
    ticketId: 'CC-2026-8940',
    title: 'Severe Drainage Clogging with Stagnant Sewage',
    category: 'Blocked Drainage',
    severity: 'Critical',
    priorityScore: 95,
    status: 'Resolved',
    description: 'Choked storm water drain causing dirty sewer water overflow right in front of hospital main gate.',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    locationName: 'Shivaji Road, Near Civil Hospital',
    ward: 'Ward 04 - South East',
    lat: 28.5921,
    lng: 77.2290,
    citizenName: 'Priya Sharma',
    assignedWorkerId: 'w3',
    assignedWorkerName: 'Anita Devi',
    resolutionNotes: 'Suction jetting performed. Removed 120kg of polythene blockages. Drain flow 100% restored. Disinfected area with lime powder.',
    tags: ['Sewage Overflow', 'Mosquito Breeding', 'Hospital Zone'],
    wasteVolume: 'Continuous Water Stagnation',
    publicHazard: 'Critical',
    slaHours: 4,
    resolvedAt: new Date(Date.now() - 3600000 * 4)
  },
  {
    ticketId: 'CC-2026-8939',
    title: 'Deep Road Pothole & Broken Kerb',
    category: 'Pothole & Road Hazard',
    severity: 'High',
    priorityScore: 78,
    status: 'Assigned',
    description: 'Hazardous asphalt crater near flyover exit. Dangerous for two-wheelers in evening traffic.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: null,
    locationName: 'Ring Road Express Flyover Exit',
    ward: 'Ward 18 - Highway Corridor',
    lat: 28.6350,
    lng: 77.1950,
    citizenName: 'Rohan Gupta',
    assignedWorkerId: 'w4',
    assignedWorkerName: 'Mohammed Farooq',
    tags: ['Traffic Risk', 'Accident Prone', 'Pothole'],
    wasteVolume: '1.2m crater',
    publicHazard: 'High',
    slaHours: 12
  }
];

export const WORKERS = [
  { id: 'w1', name: 'Rajesh Sharma', role: 'Rapid Sanitation Lead', phone: '+91 98112-33441', zone: 'Central Ward', activeTasks: 1, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'w2', name: 'Vikram Singh', role: 'Heavy Waste & Compactor Crew', phone: '+91 98223-44552', zone: 'North Green', activeTasks: 2, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  { id: 'w3', name: 'Anita Devi', role: 'Drainage & Sewage Specialist', phone: '+91 98334-55663', zone: 'South East', activeTasks: 0, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80' },
  { id: 'w4', name: 'Mohammed Farooq', role: 'Asphalt & Road Patch Unit', phone: '+91 98445-66774', zone: 'Highway Corridor', activeTasks: 1, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
];

export function calculatePriorityScore({ severity, category, publicHazard }) {
  let score = 40;
  if (severity === 'Critical') score += 35;
  else if (severity === 'High') score += 25;
  else if (severity === 'Medium') score += 15;
  else score += 5;

  if (category === 'Blocked Drainage' || category === 'Hazardous Waste') score += 15;
  else if (category === 'Garbage Overflow' || category === 'Illegal Waste Dumping') score += 12;
  else score += 8;

  return Math.min(99, Math.max(25, score));
}
