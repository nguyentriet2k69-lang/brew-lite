import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    id: 'coffee-den',
    name: 'Cà phê đen',
    description: 'Cà phê rang xay đậm vị.',
    price: 25000,
    imageUrl: '/images/ca_phe_den.png',
    category: 'Cà phê',
    stock: 100,
  },
  {
    id: 'bac-xiu',
    name: 'Bạc xỉu',
    description: 'Cà phê sữa dịu nhẹ, nhiều sữa.',
    price: 29000,
    imageUrl: '/images/bac_xiu.png',
    category: 'Cà phê',
    stock: 100,
  },
  {
    id: 'tra-dao-cam-sa',
    name: 'Trà đào cam sả',
    description: 'Trà đào thơm mát với cam và sả.',
    price: 35000,
    imageUrl: '/images/tra_dao_cam_sa.png',
    category: 'Trà',
    stock: 100,
  },
];

const options = [
  { type: 'SIZE', name: 'S', price: -5000 }, { type: 'SIZE', name: 'M', price: 0 }, { type: 'SIZE', name: 'L', price: 10000 },
  { type: 'TOPPING', name: 'Trân châu', price: 10000 }, { type: 'TOPPING', name: 'Kem cheese', price: 15000 },
  { type: 'TOPPING', name: 'Thạch trái cây', price: 8000 }, { type: 'TOPPING', name: 'Pudding', price: 12000 },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
    for (const option of options) {
      await prisma.productOption.upsert({
        where: { productId_type_name: { productId: product.id, type: option.type, name: option.name } },
        update: option,
        create: { ...option, productId: product.id },
      });
    }
  }

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: { discountPercent: 10, isActive: true },
    create: { code: 'WELCOME10', discountPercent: 10, isActive: true },
  });

  const retainedIds = products.map((product) => product.id);
  const legacyProducts = await prisma.product.findMany({
    where: { id: { notIn: retainedIds } },
    include: { _count: { select: { orderItems: true } } },
  });
  for (const product of legacyProducts) {
    if (product._count.orderItems === 0) {
      await prisma.product.delete({ where: { id: product.id } });
    } else {
      await prisma.product.update({ where: { id: product.id }, data: { isAvailable: false } });
    }
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
    update: { role: 'ADMIN' }, // Trong JS thuần ta dùng chữ 'ADMIN' thay vì UserRole.ADMIN
    create: {
      email,
      name: 'BrewLite Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Seeded ${products.length} products and admin ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
