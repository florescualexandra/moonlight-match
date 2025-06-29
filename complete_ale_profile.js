const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the user ale@test.com
    const user = await prisma.user.findUnique({
      where: {
        email: 'ale@test.com'
      }
    });

    if (!user) {
      console.error('User ale@test.com not found.');
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // Create the form response data
    const formResponseData = {
      name: 'Alexandra',
      age: 25,
      gender: 'Female',
      height: '165 - 170 cm',
      occupation: 'IT Professional',
      hobbies: 'Traveling, Reading, Tv shows/Movies, Gaming',
      pets: 'Yes – Cat(s)',
      favoriteMusicGenre: 'Classical, Hip-Hop/Rap, Electronic',
      favoriteBandOrArtist: 'Taylor Swift',
      preferredMovieTvGenre: 'Science Fiction/Fantasy, Comedy, Horror/Thriller',
      physicalActivityFrequency: 'Regularly (2–3 times a week)',
      preferredPhysicalActivity: 'Yoga/Pilates, Team sports',
      vacationType: 'Seaside, Adventure travel',
      vacationActivities: 'Swimming/Water sports, Sightseeing/Cultural tours',
      bucketList: 'Traveling to a new continent, Learning a new language, Skydiving or bungee jumping',
      vices: 'Regular alcohol consumption, Smoking',
      preferredPartnerGender: 'Male',
      preferredPhysicalAttributes: 'Tall, Stylish/Well-groomed',
      preferredAgeRange: '26–35',
      preferredActivityLevel: 'Moderately active',
      petFriendlyImportance: 4,
      childFriendlyImportance: 3,
      dealBreakers: 'Smoking, Poor hygiene, Lack of ambition'
    };

    // Update the user with the form response data
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        formResponse: formResponseData,
        name: 'Alexandra' // Also update the name field
      }
    });

    console.log('Profile completed successfully!');

    // Verify the profile was updated
    const updatedUser = await prisma.user.findUnique({
      where: {
        email: 'ale@test.com'
      }
    });

    console.log('\n=== Profile Summary ===');
    console.log(`Name: ${updatedUser.name}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Form Response: ${JSON.stringify(updatedUser.formResponse, null, 2)}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 