import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    id: 'coffee-den',
    name: 'Cà phê đen',
    description: 'Cà phê rang xay đậm vị.',
    price: 25000,
    imageUrl: '/images/ca_phe_den.png',
    category: 'Cà phê',
  },
  {
    id: 'bac-xiu',
    name: 'Bạc xỉu',
    description: 'Cà phê sữa dịu nhẹ, nhiều sữa.',
    price: 29000,
    imageUrl: '/images/bac_xiu.png',
    category: 'Cà phê',
  },
  {
    id: 'tra-dao-cam-sa',
    name: 'Trà đào cam sả',
    description: 'Trà đào thơm mát với cam và sả.',
    price: 35000,
    imageUrl: '/images/tra_dao_cam_sa.png',
    category: 'Trà',
  },
];

async function main(): Promise<void> {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running the seed.');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must not exceed 72 UTF-8 bytes for bcrypt.');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { role: UserRole.ADMIN },
    create: {
      email,
      name: 'BrewLite Admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Seeded ${products.length} products and admin ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
