const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const users = [
  { name: 'Mark Sullivan', email: 'mark.sullivan@example.com' },
  { name: 'Tammy Chan', email: 'tammy.chan@example.com' },
  { name: 'Jason Serrano', email: 'jason.serrano@example.com' },
  { name: 'Lynn Cummings', email: 'lynn.cummings@example.com' },
  { name: 'John Sullivan', email: 'john.sullivan@example.com' },
  { name: 'Anna Schroeder', email: 'anna.schroeder@example.com' },
  { name: 'Michael Powell', email: 'michael.powell@example.com' },
  { name: 'Elena Popa', email: 'elena.popa@example.com' },
  { name: 'George Petrescu', email: 'george.petrescu@example.com' },
  { name: 'Irina Vasilescu', email: 'irina.vasilescu@example.com' },
  { name: 'Adrian Dumitru', email: 'adrian.dumitru@example.com' },
  { name: 'Simona Georgescu', email: 'simona.georgescu@example.com' },
  { name: 'Robert Stanescu', email: 'robert.stanescu@example.com' },
  { name: 'Claudia Munteanu', email: 'claudia.munteanu@example.com' },
  { name: 'Stefan Iliescu', email: 'stefan.iliescu@example.com' },
  { name: 'Patricia Enache', email: 'patricia.enache@example.com' },
  { name: 'Emil Barbu', email: 'emil.barbu@example.com' },
  { name: 'Anca Voinea', email: 'anca.voinea@example.com' },
  { name: 'Paul Nistor', email: 'paul.nistor@example.com' },
  { name: 'Denisa Vlad', email: 'denisa.vlad@example.com' },
  { name: 'Alexandru Florescu', email: 'alexandru.florescu@example.com' },
  { name: 'Georgiana Toma', email: 'georgiana.toma@example.com' },
  { name: 'Cosmin Petcu', email: 'cosmin.petcu@example.com' },
  { name: 'Alina Dobre', email: 'alina.dobre@example.com' },
  { name: 'Marius Rusu', email: 'marius.rusu@example.com' },
  { name: 'Ioana Neagu', email: 'ioana.neagu@example.com' },
  { name: 'Stefan Popa', email: 'stefan.popa@example.com' },
  { name: 'Monica Badea', email: 'monica.badea@example.com' },
  { name: 'Florin Mihai', email: 'florin.mihai@example.com' },
  { name: 'Adela Voicu', email: 'adela.voicu@example.com' },
  { name: 'Ciprian Tudor', email: 'ciprian.tudor@example.com' },
  { name: 'Alina Petrescu', email: 'alina.petrescu@example.com' },
  { name: 'Dragos Marin', email: 'dragos.marin@example.com' },
  { name: 'Simona Pavel', email: 'simona.pavel@example.com' },
  { name: 'Valentin Stoica', email: 'valentin.stoica@example.com' },
  { name: 'Andreea Nistor', email: 'andreea.nistor@example.com' },
  { name: 'Marian Gheorghe', email: 'marian.gheorghe@example.com' },
  { name: 'Alina Pop', email: 'alina.pop@example.com' },
  { name: 'Catalin Radu', email: 'catalin.radu@example.com' },
  { name: 'Ioana Vlad', email: 'ioana.vlad@example.com' },
  { name: 'Florin Enache', email: 'florin.enache@example.com' },
  { name: 'Simona Dobre', email: 'simona.dobre@example.com' },
  { name: 'Valentin Popescu', email: 'valentin.popescu@example.com' },
  { name: 'Adela Stan', email: 'adela.stan@example.com' },
  { name: 'Cosmin Ionescu', email: 'cosmin.ionescu@example.com' },
  { name: 'Elena Marin', email: 'elena.marin@example.com' },
  { name: 'Paul Radu', email: 'paul.radu@example.com' },
  { name: 'Simona Vlad', email: 'simona.vlad@example.com' },
  { name: 'Florin Gheorghe', email: 'florin.gheorghe@example.com' },
  { name: 'Alexandra Florea', email: 'a@test.com' },
  { name: 'Alina Nistor', email: 'alina.nistor@example.com' },
  { name: 'Valentin Badea', email: 'valentin.badea@example.com' },
  { name: 'Andreea Popescu', email: 'andreea.popescu@example.com' },
  { name: 'Mihai Voicu', email: 'mihai.voicu@example.com' },
  { name: 'Adina Petrescu', email: 'adina.petrescu@example.com' },
  { name: 'Ciprian Stan', email: 'ciprian.stan@example.com' },
  { name: 'Monica Gheorghe', email: 'monica.gheorghe@example.com' },
  { name: 'Dragos Nistor', email: 'dragos.nistor@example.com' },
  { name: 'Simona Marin', email: 'simona.marin@example.com' },
  { name: 'Valentin Enache', email: 'valentin.enache@example.com' },
  { name: 'Andreea Gheorghe', email: 'andreea.gheorghe@example.com' },
  { name: 'Mihai Stan', email: 'mihai.stan@example.com' },
  { name: 'Adina Pop', email: 'adina.pop@example.com' },
  { name: 'Ciprian Marin', email: 'ciprian.marin@example.com' },
  { name: 'Monica Enache', email: 'monica.enache@example.com' },
];

async function main() {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  for (const user of users) {
    // Skip admin
    if (user.email === 'admin@user.com') continue;
    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
      },
    });
    // Create ticket for the test event if not exists
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        userId: dbUser.id,
        eventId: 'cmckmarxb0000lf0af2kqlcqi',
      },
    });
    if (!existingTicket) {
      await prisma.ticket.create({
        data: {
          userId: dbUser.id,
          eventId: 'cmckmarxb0000lf0af2kqlcqi',
        },
      });
    }
  }
  console.log('Users and tickets seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 