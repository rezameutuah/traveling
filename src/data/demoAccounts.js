export const demoAccounts = [
  {
    id: 'demo-nadia',
    username: 'nadia.putri',
    email: 'nadia.putri@contoh.aceh.id',
    displayName: 'Nadia Putri',
    roleId: 'Wisatawan Keluarga · Banda Aceh & Sabang',
    roleEn: 'Family Traveller · Banda Aceh & Sabang',
    favorites: ['d1', 'd2', 'd4'],
    prepChecklist: {
      transport: true,
      stay: true,
      prayer: true,
      essentials: true,
    },
    tripMeta: {
      name: 'Wisata Keluarga Banda Aceh–Sabang',
      date: new Date().toISOString().slice(0, 10),
      days: 3,
      travellers: 4,
    },
    activities: [
      { id: 'demo-act-n1', destinationId: 'd1', day: 1 },
      { id: 'demo-act-n2', destinationId: 'd2', day: 1 },
      { id: 'demo-act-n3', destinationId: 'd4', day: 2 },
      { id: 'demo-act-n4', destinationId: 'd5', day: 3 },
    ],
    savedTrips: [
      {
        id: 'demo-trip-nadia-1',
        name: 'Wisata Keluarga Banda Aceh–Sabang',
        date: new Date().toISOString().slice(0, 10),
        days: 3,
        travellers: 4,
        activities: [
          { id: 'demo-act-n1', destinationId: 'd1', day: 1 },
          { id: 'demo-act-n2', destinationId: 'd2', day: 1 },
          { id: 'demo-act-n3', destinationId: 'd4', day: 2 },
          { id: 'demo-act-n4', destinationId: 'd5', day: 3 },
        ],
        totalEstimate: 2950000,
        savedAt: '2026-11-20T09:00:00.000Z',
      },
    ],
    travelBookings: [
      {
        id: 'demo-bk-nadia-1',
        bookingCode: 'DA-TRV-4821',
        vehicleId: 'car-innova',
        vehicleName: 'Toyota Innova Reborn',
        vehicleContact: '6281234567012',
        pickupLocation: 'Bandara Sultan Iskandar Muda (BTJ)',
        destinationRegion: 'Banda Aceh',
        pickupDate: new Date().toISOString().slice(0, 10),
        days: 3,
        passengers: 4,
        serviceType: 'driver_fuel',
        contactName: 'Nadia Putri',
        contactPhone: '081234567890',
        notes: 'Antar-jemput Bandara SIM & Pelabuhan Ulee Lheue.',
        totalEstimate: 3225000,
        status: 'pending',
        createdAt: '2026-11-20T09:30:00.000Z',
      },
    ],
    stayBookings: [
      {
        id: 'demo-htl-nadia-1',
        bookingCode: 'DA-HTL-3190',
        stayId: 's1',
        stayName: 'Penginapan Syariah Baiturrahman',
        stayRegion: 'Banda Aceh',
        stayContact: '6281234567004',
        roomType: 'Deluxe Keluarga Syariah',
        checkInDate: new Date().toISOString().slice(0, 10),
        nights: 2,
        rooms: 1,
        guests: 4,
        contactName: 'Nadia Putri',
        contactPhone: '081234567890',
        notes: 'Mohon tambahan sajadah dan check-in sekitar pukul 14.00 WIB.',
        totalEstimate: 756000,
        status: 'pending',
        createdAt: '2026-11-20T09:45:00.000Z',
      },
    ],
  },
  {
    id: 'demo-farhan',
    username: 'farhan.gayo',
    email: 'farhan.gayo@contoh.aceh.id',
    displayName: 'Farhan Gayo',
    roleId: 'Penjelajah Dataran Tinggi · Takengon & Bener Meriah',
    roleEn: 'Highland Explorer · Takengon & Bener Meriah',
    favorites: ['d10', 'd12', 'd14'],
    prepChecklist: {
      tickets: true,
      weather: true,
      prayer: true,
    },
    tripMeta: {
      name: 'Jelajah Kopi & Danau Gayo',
      date: new Date().toISOString().slice(0, 10),
      days: 2,
      travellers: 2,
    },
    activities: [
      { id: 'demo-act-f1', destinationId: 'd10', day: 1 },
      { id: 'demo-act-f2', destinationId: 'd11', day: 1 },
      { id: 'demo-act-f3', destinationId: 'd12', day: 2 },
      { id: 'demo-act-f4', destinationId: 'd14', day: 2 },
    ],
    savedTrips: [
      {
        id: 'demo-trip-farhan-1',
        name: 'Jelajah Kopi & Danau Gayo',
        date: new Date().toISOString().slice(0, 10),
        days: 2,
        travellers: 2,
        activities: [
          { id: 'demo-act-f1', destinationId: 'd10', day: 1 },
          { id: 'demo-act-f2', destinationId: 'd11', day: 1 },
          { id: 'demo-act-f3', destinationId: 'd12', day: 2 },
          { id: 'demo-act-f4', destinationId: 'd14', day: 2 },
        ],
        totalEstimate: 1250000,
        savedAt: '2026-11-21T08:30:00.000Z',
      },
    ],
  },
  {
    id: 'demo-rizal',
    username: 'rizal.bahari',
    email: 'rizal.bahari@contoh.aceh.id',
    displayName: 'Rizal Bahari',
    roleId: 'Solo Traveller Pesisir · Aceh Besar & Sabang',
    roleEn: 'Coastal Solo Traveller · Aceh Besar & Sabang',
    favorites: ['d6', 'd7', 'd8', 'd9'],
    prepChecklist: {
      transport: true,
      weather: true,
      essentials: true,
    },
    tripMeta: {
      name: 'Rute Pesisir Barat & Air Terjun',
      date: new Date().toISOString().slice(0, 10),
      days: 2,
      travellers: 1,
    },
    activities: [
      { id: 'demo-act-r1', destinationId: 'd7', day: 1 },
      { id: 'demo-act-r2', destinationId: 'd8', day: 1 },
      { id: 'demo-act-r3', destinationId: 'd9', day: 2 },
    ],
    savedTrips: [
      {
        id: 'demo-trip-rizal-1',
        name: 'Rute Pesisir Barat & Air Terjun',
        date: new Date().toISOString().slice(0, 10),
        days: 2,
        travellers: 1,
        activities: [
          { id: 'demo-act-r1', destinationId: 'd7', day: 1 },
          { id: 'demo-act-r2', destinationId: 'd8', day: 1 },
          { id: 'demo-act-r3', destinationId: 'd9', day: 2 },
        ],
        totalEstimate: 700000,
        savedAt: '2026-11-22T10:15:00.000Z',
      },
    ],
  },
];

export function findDemoAccountByEmail(identifier) {
  const normalized = String(identifier || '').trim().toLowerCase();
  if (!normalized) return null;
  return (
    demoAccounts.find(
      (acc) => acc.email.toLowerCase() === normalized || acc.username.toLowerCase() === normalized
    ) || null
  );
}
