import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { IAdmin } from './interfaces/prisma.interface';
import { AdminDatas } from './datas/admin.data';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function seedUserAdmin(data: IAdmin[]) {
  data.forEach((d) => {
    d.password = bcrypt.hashSync(d.password, 10);
  });

  if (data.length > 0) {
    const newUserAdmins: IAdmin[] = [];

    for (const d of data) {
      const isExist = await prisma.admin.findFirst({
        where: { email: d.email },
      });
      if (isExist) continue;
      newUserAdmins.push(d);
    }

    if (newUserAdmins.length > 0) {
      await prisma.admin.createMany({ data: newUserAdmins });
      console.log(
        `✅ Successfully seeded ${newUserAdmins.length} user admin(s)`,
      );
    }
  }
}

async function main() {
  await seedUserAdmin(AdminDatas);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
