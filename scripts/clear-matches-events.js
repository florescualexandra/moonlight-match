import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Delete all messages
    const deletedMessages = await prisma.message.deleteMany();
    console.log(`Deleted ${deletedMessages.count} messages.`);

    // 2. Delete all chats
    const deletedChats = await prisma.chat.deleteMany();
    console.log(`Deleted ${deletedChats.count} chats.`);

    // 3. Delete all matches
    const deletedMatches = await prisma.match.deleteMany();
    console.log(`Deleted ${deletedMatches.count} matches.`);

    // 4. Delete all tickets
    const deletedTickets = await prisma.ticket.deleteMany();
    console.log(`Deleted ${deletedTickets.count} tickets.`);

    // 5. Delete all events
    const deletedEvents = await prisma.event.deleteMany();
    console.log(`Deleted ${deletedEvents.count} events.`);

    console.log('All messages, chats, matches, tickets, and events have been cleared.');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 