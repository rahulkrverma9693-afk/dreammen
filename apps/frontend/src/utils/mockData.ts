// Mock Data & Seed Fallbacks for DreamGirl Family Salon

export const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Hair Care & Styling', genderApplicable: null, sortOrder: 1 },
  { id: 'cat-2', name: 'Skin & Facials', genderApplicable: 'FEMALE', sortOrder: 2 },
  { id: 'cat-3', name: 'Nails & Pedicure', genderApplicable: 'FEMALE', sortOrder: 3 },
  { id: 'cat-4', name: 'Beard & Men Grooming', genderApplicable: 'MALE', sortOrder: 4 },
  { id: 'cat-5', name: 'Spa & Massage', genderApplicable: null, sortOrder: 5 },
];

export const MOCK_SERVICES = [
  { id: 'srv-1', categoryId: 'cat-1', name: 'Women Haircut & Blowdry', price: 850, duration: 45, taxRate: 18, commissionRate: 10 },
  { id: 'srv-2', categoryId: 'cat-1', name: 'Men Haircut & Hairwash', price: 350, duration: 30, taxRate: 18, commissionRate: 10 },
  { id: 'srv-3', categoryId: 'cat-1', name: 'Global Hair Colouring', price: 3500, duration: 90, taxRate: 18, commissionRate: 15 },
  { id: 'srv-4', categoryId: 'cat-1', name: 'Keratin Smoothing Treatment', price: 4999, duration: 120, taxRate: 18, commissionRate: 15 },
  { id: 'srv-5', categoryId: 'cat-2', name: 'O3+ Premium Facial', price: 2499, duration: 60, taxRate: 18, commissionRate: 12 },
  { id: 'srv-6', categoryId: 'cat-2', name: 'Hydra Facial & Glow Booster', price: 3999, duration: 75, taxRate: 18, commissionRate: 15 },
  { id: 'srv-7', categoryId: 'cat-3', name: 'Gel Polish & Nail Art', price: 1200, duration: 45, taxRate: 18, commissionRate: 10 },
  { id: 'srv-8', categoryId: 'cat-3', name: 'Deluxe Spa Pedicure', price: 950, duration: 45, taxRate: 18, commissionRate: 10 },
  { id: 'srv-9', categoryId: 'cat-4', name: 'Beard Shaping & Royal Spa', price: 450, duration: 30, taxRate: 18, commissionRate: 10 },
  { id: 'srv-10', categoryId: 'cat-5', name: 'Aromatherapy Body Massage (60 min)', price: 2999, duration: 60, taxRate: 18, commissionRate: 20 },
];

export const MOCK_PRODUCTS = [
  { id: 'prod-1', name: 'L\'Oreal Professionnel Hair Spa Mask (500g)', sku: 'LOR-001', price: 950, stockQty: 24, minStockLevel: 5, taxRate: 18 },
  { id: 'prod-2', name: 'Matrix Opti.Care Smooth Shampoo (350ml)', sku: 'MAT-002', price: 650, stockQty: 18, minStockLevel: 5, taxRate: 18 },
  { id: 'prod-3', name: 'Moroccanoil Treatment Oil (100ml)', sku: 'MOR-003', price: 3800, stockQty: 4, minStockLevel: 3, taxRate: 18 },
  { id: 'prod-4', name: 'O3+ D-Tan Cleanse Pack (250g)', sku: 'O3-004', price: 1450, stockQty: 12, minStockLevel: 4, taxRate: 18 },
];

export const MOCK_EMPLOYEES = [
  { id: 'emp-1', name: 'Pooja Sharma', role: 'STYLIST', commissionRate: 15, photoUrl: '' },
  { id: 'emp-2', name: 'Ananya Verma', role: 'STYLIST', commissionRate: 15, photoUrl: '' },
  { id: 'emp-3', name: 'Rahul Verma', role: 'STYLIST', commissionRate: 12, photoUrl: '' },
  { id: 'emp-4', name: 'Sunita Menon', role: 'STYLIST', commissionRate: 15, photoUrl: '' },
  { id: 'emp-5', name: 'Vikram Singh', role: 'MANAGER', commissionRate: 10, photoUrl: '' },
];

export const MOCK_CUSTOMERS = [
  {
    id: 'cust-1',
    customerId: 'DG-CUST-0001',
    name: 'Priya Kapoor',
    phone: '9876543210',
    email: 'priya.k@gmail.com',
    gender: 'FEMALE',
    dob: '1994-08-15',
    anniversary: '2020-11-20',
    address: 'B-402, Rosewood Heights, Mumbai',
    city: 'Mumbai',
    notes: 'Prefers ammonia-free hair color. Sensitive skin for facials.',
    walletBalance: 1250,
    loyaltyPoints: 340,
    isActive: true,
    group: { id: 'grp-1', name: 'VIP Ladies', color: '#C2185B' },
  },
  {
    id: 'cust-2',
    customerId: 'DG-CUST-0002',
    name: 'Rohan Mehta',
    phone: '9820011223',
    email: 'rohan.m@yahoo.com',
    gender: 'MALE',
    dob: '1988-03-22',
    anniversary: '',
    address: '12, Ocean View Apartments, Bandra',
    city: 'Mumbai',
    notes: 'Regular beard trim & head massage every 2 weeks.',
    walletBalance: 400,
    loyaltyPoints: 120,
    isActive: true,
    group: { id: 'grp-2', name: 'Regular Men', color: '#1A1A2E' },
  },
  {
    id: 'cust-3',
    customerId: 'DG-CUST-0003',
    name: 'Neha Agarwal',
    phone: '9988776655',
    email: 'neha.agarwal@outlook.com',
    gender: 'FEMALE',
    dob: '1992-12-05',
    anniversary: '2018-02-14',
    address: 'Plot 88, Juhu Scheme',
    city: 'Mumbai',
    notes: 'Prefers Senior Stylist Pooja.',
    walletBalance: 3500,
    loyaltyPoints: 890,
    isActive: true,
    group: { id: 'grp-1', name: 'VIP Ladies', color: '#C2185B' },
  },
];

export const MOCK_PACKS = {
  comboPacks: [
    { id: 'combo-1', name: 'Bridal Glow Bundle', price: 7999, validityDays: 90, description: 'Keratin + Hydra Facial + Gel Nails' },
    { id: 'combo-2', name: 'Festive Refresh Pack', price: 2999, validityDays: 60, description: 'Haircut + Hair Color + Spa Pedicure' },
  ],
  spaPacks: [
    { id: 'spa-1', name: 'Aroma Massage 5-Session Pass', price: 9999, sessions: 5, validityDays: 180, description: '5 full body massage sessions' },
    { id: 'spa-2', name: 'O3+ Facial 3-Session Pass', price: 5999, sessions: 3, validityDays: 120, description: '3 premium facial sessions' },
  ],
  prepaidPacks: [
    { id: 'prep-1', name: 'Silver Card (Pay ₹5,000 Get ₹6,000)', price: 5000, creditAmount: 6000, bonusAmount: 1000, validityDays: 365 },
    { id: 'prep-2', name: 'Gold Card (Pay ₹10,000 Get ₹12,500)', price: 10000, creditAmount: 12500, bonusAmount: 2500, validityDays: 365 },
  ],
  membershipPlans: [
    { id: 'mem-1', name: 'DreamGirl Elite Membership', price: 2499, durationMonths: 12, discountPercent: 20, serviceCredits: 1000, description: '20% off all services for 1 year + ₹1000 wallet bonus' },
  ],
};
