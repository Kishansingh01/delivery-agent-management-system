import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleAgents = [
  {
    name: 'Marcus Chen',
    email: 'marcus.chen@fastdrop.io',
    phone: '+1 (555) 234-5678',
    serviceArea: 'Downtown Financial',
    status: 'active',
    vehicleType: 'Motorcycle',
    rating: 4.95,
    activeOrders: 2,
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@fastdrop.io',
    phone: '+1 (555) 876-5432',
    serviceArea: 'Uptown Arts District',
    status: 'on_delivery',
    vehicleType: 'Bicycle',
    rating: 4.88,
    activeOrders: 3,
  },
  {
    name: 'David O\'Connor',
    email: 'david.oc@fastdrop.io',
    phone: '+1 (555) 345-6789',
    serviceArea: 'Metro West Valley',
    status: 'active',
    vehicleType: 'Car',
    rating: 4.92,
    activeOrders: 1,
  },
  {
    name: 'Amina Al-Mansoor',
    email: 'amina.mansoor@fastdrop.io',
    phone: '+1 (555) 987-6543',
    serviceArea: 'North Bay Harbor',
    status: 'active',
    vehicleType: 'Motorcycle',
    rating: 4.97,
    activeOrders: 0,
  },
  {
    name: 'Carlos Ramirez',
    email: 'carlos.ramirez@fastdrop.io',
    phone: '+1 (555) 456-7890',
    serviceArea: 'South Hills Heights',
    status: 'inactive',
    vehicleType: 'Van',
    rating: 4.65,
    activeOrders: 0,
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.j@fastdrop.io',
    phone: '+1 (555) 654-3210',
    serviceArea: 'Downtown Financial',
    status: 'on_delivery',
    vehicleType: 'Bicycle',
    rating: 4.82,
    activeOrders: 4,
  },
  {
    name: 'Kenji Takahashi',
    email: 'kenji.t@fastdrop.io',
    phone: '+1 (555) 567-8901',
    serviceArea: 'Eastside Tech Hub',
    status: 'active',
    vehicleType: 'Motorcycle',
    rating: 4.91,
    activeOrders: 1,
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@fastdrop.io',
    phone: '+1 (555) 432-1098',
    serviceArea: 'Uptown Arts District',
    status: 'active',
    vehicleType: 'Car',
    rating: 4.89,
    activeOrders: 2,
  },
];

async function main() {
  console.log('🌱 Starting database seeding...');
  await prisma.deliveryAgent.deleteMany();

  for (const agent of sampleAgents) {
    const created = await prisma.deliveryAgent.create({
      data: agent,
    });
    console.log(`Created delivery agent: ${created.name} (${created.id})`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
