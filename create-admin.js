import bcrypt from 'bcryptjs';
import prisma from './lib/prisma.js';

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...');

    // Admin credentials
    const adminData = {
      firstName: 'Admin',
      lastName: 'Talenta',
      email: 'admin@talenta.com',
      phone: '+250788000000',
      password: 'Admin@123',  // This will be hashed
      role: 'ADMIN',
      isVerified: true,
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminData.email },
          { phone: adminData.phone }
        ]
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', adminData.email);
      console.log('📱 Phone:', adminData.phone);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        phone: adminData.phone,
        password: hashedPassword,
        role: adminData.role,
        isVerified: adminData.isVerified,
        isActive: adminData.isActive,
        earnings: {
          create: {}
        },
        stats: {
          create: {}
        }
      },
      include: {
        earnings: true,
        stats: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 ADMIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', adminData.email);
    console.log('📱 Phone:    ', adminData.phone);
    console.log('🔑 Password: ', adminData.password);
    console.log('👤 Role:     ', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 You can login with either email or phone number');
    console.log('⚠️  Please change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


