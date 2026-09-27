import { PrismaClient, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌹 Starting DreamGirl Salon database seed...');

  // 1. Create Main Branch
  const branch = await prisma.branch.upsert({
    where: { slug: 'main-branch' },
    update: {},
    create: {
      name: 'DreamGirl Family Salon (Main Branch)',
      slug: 'main-branch',
      phone: '+91 98765 43210',
      email: 'contact@dreamgirlsalon.com',
      address: 'Shop 4, Rosewood Galleria, Main Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      googleMapLink: 'https://maps.google.com/?q=DreamGirlSalon',
      bookingEnabled: true,
      slotDuration: 30,
    },
  });

  console.log(`✅ Branch created: ${branch.name}`);

  // Password hash
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create Staff Users
  await prisma.user.upsert({
    where: { email: 'owner@dreamgirlsalon.com' },
    update: {},
    create: {
      email: 'owner@dreamgirlsalon.com',
      phone: '9876543210',
      passwordHash,
      name: 'Ritu Sharma (Owner)',
      role: 'OWNER',
      branchId: branch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'priya@dreamgirlsalon.com' },
    update: {},
    create: {
      email: 'priya@dreamgirlsalon.com',
      phone: '9876543211',
      passwordHash,
      name: 'Priya Sharma (Receptionist)',
      role: 'RECEPTIONIST',
      branchId: branch.id,
    },
  });

  // Create Employees
  const employeesData = [
    { name: 'Ritu Sharma', email: 'owner@dreamgirlsalon.com', phone: '9876543210', role: 'OWNER' as const, commissionType: 'PERCENT' as const, commissionRate: 15, monthlyTarget: 100000, pin: '1234' },
    { name: 'Priya Sharma', email: 'priya@dreamgirlsalon.com', phone: '9876543211', role: 'RECEPTIONIST' as const, commissionType: 'PERCENT' as const, commissionRate: 5, monthlyTarget: 50000, pin: '1111' },
    { name: 'Kavita Nair', email: 'kavita@dreamgirlsalon.com', phone: '9876543212', role: 'STYLIST' as const, commissionType: 'PERCENT' as const, commissionRate: 20, monthlyTarget: 80000, pin: '2222' },
    { name: 'Ananya Gupta', email: 'ananya@dreamgirlsalon.com', phone: '9876543213', role: 'STYLIST' as const, commissionType: 'PERCENT' as const, commissionRate: 20, monthlyTarget: 75000, pin: '3333' },
    { name: 'Rahul Verma', email: 'rahul@dreamgirlsalon.com', phone: '9876543214', role: 'STYLIST' as const, commissionType: 'PERCENT' as const, commissionRate: 20, monthlyTarget: 60000, pin: '4444' },
  ];

  for (const emp of employeesData) {
    const { pin, ...empData } = emp;
    const existing = await prisma.employee.findFirst({ where: { email: emp.email } });
    if (!existing) {
      await prisma.employee.create({
        data: {
          ...empData,
          branchId: branch.id,
        },
      });
    }
  }

  console.log('✅ Staff employees & credentials seeded');

  // 3. Service Categories & Services
  const hairCategory = await prisma.serviceCategory.create({
    data: { name: 'Hair Cut & Styling', genderApplicable: null, sortOrder: 1, branchId: branch.id },
  });

  const facialCategory = await prisma.serviceCategory.create({
    data: { name: 'Skin & Facials', genderApplicable: Gender.FEMALE, sortOrder: 2, branchId: branch.id },
  });

  const menCategory = await prisma.serviceCategory.create({
    data: { name: 'Beard & Men Grooming', genderApplicable: Gender.MALE, sortOrder: 3, branchId: branch.id },
  });

  const spaCategory = await prisma.serviceCategory.create({
    data: { name: 'Spa & Body Treatments', genderApplicable: null, sortOrder: 4, branchId: branch.id },
  });

  await prisma.service.createMany({
    data: [
      { name: 'Female Layer Haircut', price: 650, duration: 45, categoryId: hairCategory.id, branchId: branch.id },
      { name: 'Men Haircut & Hairwash', price: 350, duration: 30, categoryId: hairCategory.id, branchId: branch.id },
      { name: 'Keratin Hair Treatment', price: 4500, duration: 120, categoryId: hairCategory.id, branchId: branch.id },
      { name: 'L’Oréal Hair Spa', price: 1200, duration: 60, categoryId: hairCategory.id, branchId: branch.id },
      { name: 'O3+ Bridal Glow Facial', price: 2500, duration: 75, categoryId: facialCategory.id, branchId: branch.id },
      { name: 'Fruit Glow Facial', price: 990, duration: 45, categoryId: facialCategory.id, branchId: branch.id },
      { name: 'Beard Trim & Styling', price: 200, duration: 20, categoryId: menCategory.id, branchId: branch.id },
      { name: 'Head Massage with Organic Oils', price: 500, duration: 30, categoryId: spaCategory.id, branchId: branch.id },
      { name: 'Foot Reflexology Spa', price: 850, duration: 45, categoryId: spaCategory.id, branchId: branch.id },
    ],
  });

  console.log('✅ Service categories & services seeded');

  // 4. Customer Groups & Customers
  const vipGroup = await prisma.customerGroup.create({
    data: { name: 'VIP Ladies Club', color: '#C2185B', description: 'High spenders & premium members', branchId: branch.id },
  });

  const regularGroup = await prisma.customerGroup.create({
    data: { name: 'Regular Clients', color: '#0288D1', description: 'Frequent monthly visitors', branchId: branch.id },
  });

  await prisma.customer.createMany({
    data: [
      { name: 'Simran Kaur', phone: '9820011223', email: 'simran@example.com', gender: Gender.FEMALE, groupId: vipGroup.id, walletBalance: 1500, branchId: branch.id },
      { name: 'Neha Sharma', phone: '9833322110', email: 'neha@example.com', gender: Gender.FEMALE, groupId: regularGroup.id, walletBalance: 500, branchId: branch.id },
      { name: 'Rohan Mehta', phone: '9811144556', email: 'rohan@example.com', gender: Gender.MALE, groupId: regularGroup.id, walletBalance: 200, branchId: branch.id },
      { name: 'Anjali Rao', phone: '9877788990', email: 'anjali@example.com', gender: Gender.FEMALE, walletBalance: 0, branchId: branch.id },
    ],
  });

  console.log('✅ Customer groups & customer CRM seeded');

  // 5. Retail Products & Inhouse Consumables
  await prisma.product.createMany({
    data: [
      { name: 'L’Oréal Professionnel Keratin Shampoo 250ml', sku: 'KS-1001', price: 850, stockQty: 24, minStockLevel: 5, unit: 'bottle', taxRate: 18, branchId: branch.id },
      { name: 'Matrix Opti.Smooth Hair Mask 500g', sku: 'MM-1002', price: 1100, stockQty: 12, minStockLevel: 3, unit: 'tub', taxRate: 18, branchId: branch.id },
      { name: 'O3+ Facial Brightening Serum 50ml', sku: 'HS-1003', price: 1450, stockQty: 8, minStockLevel: 2, unit: 'bottle', taxRate: 18, branchId: branch.id },
    ],
  });

  const towelItem = await prisma.inhouseItem.create({
    data: { name: 'Disposable Salon Towels (Pack of 50)', unit: 'pack', branchId: branch.id },
  });

  await prisma.poolStock.create({
    data: { inhouseItemId: towelItem.id, quantity: 40, branchId: branch.id },
  });

  console.log('✅ Products & Inhouse inventory seeded');

  // 6. Packages & Memberships
  await prisma.comboPack.create({
    data: { name: 'Bridal Glow Combo', price: 4999, description: 'O3+ Facial + Hair Spa + Manicure & Pedicure', branchId: branch.id },
  });

  await prisma.spaPack.create({
    data: { name: 'Luxury Spa Pass (5 Sessions)', price: 3500, sessions: 5, validityDays: 180, branchId: branch.id },
  });

  await prisma.membershipPlan.create({
    data: { name: 'Gold Club Membership', price: 999, durationMonths: 12, discountPercent: 10, serviceCredits: 200, branchId: branch.id },
  });

  // 7. Tax Slabs & Settings
  await prisma.taxSlab.createMany({
    data: [
      { name: 'GST 5%', rate: 5, branchId: branch.id },
      { name: 'GST 18%', rate: 18, branchId: branch.id },
    ],
  });

  const defaultSettings = [
    { key: 'bill_prefix', value: 'DG-2026-' },
    { key: 'next_bill_number', value: '1001' },
    { key: 'currency', value: 'INR' },
    { key: 'phone_prefix', value: '+91' },
    { key: 'gstin', value: '27AAAAA0000A1Z5' },
    { key: 'gst_enabled', value: 'true' },
    { key: 'printer_paper_width', value: '80mm' },
    { key: 'printer_header', value: 'DREAMGIRL FAMILY SALON & SPA' },
    { key: 'printer_footer', value: 'Thank you for visiting! Follow us @dreamgirlsalon' },
    { key: 'razorpay_key_id', value: 'rzp_live_x892aKls81' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { branchId_key: { branchId: branch.id, key: s.key } },
      update: { value: s.value },
      create: { branchId: branch.id, key: s.key, value: s.value },
    });
  }

  console.log('✅ Tax Slabs & Settings keys seeded successfully');
  console.log('🎉 DreamGirl Salon database seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
