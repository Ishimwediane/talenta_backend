import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a test admin user
  const hashedPassword = await bcrypt.hash('AdminPass123!', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@talenta.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@talenta.com',
      password: hashedPassword,
      isVerified: true,
      role: 'ADMIN',
      interests: ['FILM', 'POETRY', 'PODCAST'],
      earnings: {
        create: {
          total: 0,
          pending: 0,
          withdrawn: 0
        }
      },
      stats: {
        create: {
          totalViews: 0,
          totalLikes: 0,
          totalShares: 0,
          totalContent: 0
        }
      },
      socialLinks: {
        create: {
          instagram: 'https://instagram.com/talenta_admin',
          twitter: 'https://twitter.com/talenta_admin'
        }
      }
    }
  });

  // Create a test creator user
  const creatorPassword = await bcrypt.hash('CreatorPass123!', 12);
  
  const creatorUser = await prisma.user.upsert({
    where: { email: 'creator@talenta.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Creator',
      email: 'creator@talenta.com',
      password: creatorPassword,
      isVerified: true,
      role: 'CREATOR',
      bio: 'Passionate filmmaker from Rwanda',
      location: 'Kigali, Rwanda',
      interests: ['FILM', 'PHOTOGRAPHY', 'ART'],
      earnings: {
        create: {
          total: 150.50,
          pending: 25.00,
          withdrawn: 125.50
        }
      },
      stats: {
        create: {
          totalViews: 1250,
          totalLikes: 89,
          totalShares: 23,
          totalContent: 5
        }
      },
      socialLinks: {
        create: {
          instagram: 'https://instagram.com/johncreator',
          youtube: 'https://youtube.com/@johncreator'
        }
      }
    }
  });

  // Create some sample content
  const sampleContent = await prisma.content.create({
    data: {
      title: 'Rwanda Through My Lens',
      description: 'A beautiful documentary showcasing the beauty of Rwanda',
      type: 'FILM',
      category: 'Documentary',
      tags: ['rwanda', 'documentary', 'culture', 'beauty'],
      fileUrl: 'https://example.com/videos/rwanda-documentary.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/rwanda-doc.jpg',
      duration: 1800, // 30 minutes
      views: 1250,
      likes: 89,
      shares: 23,
      isPublished: true,
      isApproved: true,
      userId: creatorUser.id
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user created:', adminUser.email);
  console.log('🎬 Creator user created:', creatorUser.email);
  console.log('📹 Sample content created:', sampleContent.title);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 