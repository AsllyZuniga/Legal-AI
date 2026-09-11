const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.role.createMany({
    data: [
      { id: 'lawyer', name: 'Abogado', permissions: ['create_cases', 'view_own_cases', 'search_jurisprudence', 'generate_documents', 'upload_documents'] }
    ],
    skipDuplicates: true
  });
  console.log('Roles seeded');

  const bcrypt = require('bcryptjs');
  const lawyerHash = await bcrypt.hash('Demo1234', 10);

  await prisma.user.create({
    data: {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      documentNumber: '1000000001',
      passwordHash: lawyerHash,
      fullName: 'Abogado Demo',
      lawFirm: 'Firma Demo',
      roleId: 'lawyer',
      credits: 1000
    }
  }).catch(() => console.log('Lawyer user already exists'));
  console.log('Users seeded');

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
