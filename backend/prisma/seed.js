import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@gohite.com' },
    update: {},
    create: {
      email: 'superadmin@gohite.com',
      password: passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gohite.com' },
    update: {},
    create: {
      email: 'admin@gohite.com',
      password: passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@gohite.com' },
    update: {},
    create: {
      email: 'manager@gohite.com',
      password: passwordHash,
      name: 'Store Manager',
      role: 'MANAGER',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@gohite.com' },
    update: {},
    create: {
      email: 'employee@gohite.com',
      password: passwordHash,
      name: 'POS Operator',
      role: 'EMPLOYEE',
    },
  });

  const krishi = await prisma.business.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Gohite Krishi Seva Kendra',
      type: 'KRISHI',
      address: 'Main Road, Village Center',
      gstNo: '27AAAAA0000A1Z5',
      mobile: '9876543210',
    },
  });

  const hardware = await prisma.business.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Gohite Hardware Hub',
      type: 'HARDWARE',
      address: 'Industrial Area, Shop 12',
      gstNo: '27BBBBB0000B1Z5',
      mobile: '9876543211',
    },
  });

  const krishiCategories = ['Beej', 'Khad', 'Pesticides', 'Tools'];
  const hardwareCategories = ['Pipes', 'Tools', 'Paint', 'Electrical'];

  for (const name of krishiCategories) {
    await prisma.category.upsert({
      where: { businessId_name: { businessId: krishi.id, name } },
      update: {},
      create: { businessId: krishi.id, name },
    });
  }

  for (const name of hardwareCategories) {
    await prisma.category.upsert({
      where: { businessId_name: { businessId: hardware.id, name } },
      update: {},
      create: { businessId: hardware.id, name },
    });
  }

  const globalConfigs = [
    { key: 'default_page_size', value: '25', businessId: null },
    { key: 'max_page_size', value: '100', businessId: null },
    { key: 'enable_bulk_upload', value: 'true', businessId: null },
  ];

  const businessConfigDefaults = (businessId, type) => [
    { key: 'default_gst_percentage', value: '18', businessId },
    { key: 'default_min_stock', value: '5', businessId },
    { key: 'allowed_units', value: '["KG","Bags","Liters","Pieces","Boxes","Meters"]', businessId },
    { key: 'allowed_payment_types', value: '["CASH","UPI","CARD","CREDIT"]', businessId },
    { key: 'enable_pos', value: 'true', businessId },
    { key: 'invoice_footer_text', value: 'Thank you for your business', businessId },
    { key: 'company_display_name', value: '', businessId },
    ...(type === 'KRISHI' ? [{ key: 'expiry_alert_days', value: '30', businessId }] : []),
  ];

  const configs = [
    ...globalConfigs,
    ...businessConfigDefaults(krishi.id, 'KRISHI'),
    ...businessConfigDefaults(hardware.id, 'HARDWARE'),
  ];

  for (const c of configs) {
    const existing = await prisma.systemConfig.findFirst({
      where: { key: c.key, businessId: c.businessId },
    });
    if (existing) {
      await prisma.systemConfig.update({
        where: { id: existing.id },
        data: { value: c.value },
      });
    } else {
      await prisma.systemConfig.create({
        data: c,
      });
    }
  }

  const userRoles = {
    [admin.id]: 'ADMIN',
    [manager.id]: 'MANAGER',
    [employee.id]: 'EMPLOYEE',
  };

  for (const user of [admin, manager, employee]) {
    for (const biz of [krishi, hardware]) {
      await prisma.userBusiness.upsert({
        where: { userId_businessId: { userId: user.id, businessId: biz.id } },
        update: { role: userRoles[user.id] },
        create: { userId: user.id, businessId: biz.id, role: userRoles[user.id] },
      });
    }
  }

  const krishiCat = await prisma.category.findFirst({
    where: { businessId: krishi.id, name: 'Khad' },
  });

  await prisma.product.upsert({
    where: { businessId_sku: { businessId: krishi.id, sku: 'KR-UREA-46' } },
    update: {},
    create: {
      businessId: krishi.id,
      categoryId: krishiCat.id,
      name: 'Urea 46%',
      sku: 'KR-UREA-46',
      purchasePrice: 400,
      sellingPrice: 450,
      quantity: 100,
      unit: 'Bags',
      companyName: 'IFFCO',
      gstPercentage: 18,
      metadata: {
        batchNo: 'B-KHD-8841',
        expiryDate: '2026-08-20',
        composition: 'Nitrogen 46%',
      },
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
