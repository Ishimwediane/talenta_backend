import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCategorySystem() {
  try {
    console.log('🧪 Testing Category System...\n');

    // Test 1: Get all categories
    console.log('1. Fetching all categories...');
    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log(`✅ Found ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`   - ${category.name} (${category.subCategories.length} subcategories)`);
      category.subCategories.forEach(sub => {
        console.log(`     └─ ${sub.name}`);
      });
    });

    // Test 2: Test category filtering
    console.log('\n2. Testing category filtering...');
    const booksInCategory = await prisma.book.findMany({
      where: {
        categoryId: categories[0]?.id
      },
      include: {
        category: true,
        subCategory: true
      }
    });
    console.log(`✅ Found ${booksInCategory.length} books in "${categories[0]?.name}" category`);

    // Test 3: Test subcategory filtering
    if (categories[0]?.subCategories.length > 0) {
      console.log('\n3. Testing subcategory filtering...');
      const booksInSubCategory = await prisma.book.findMany({
        where: {
          subCategoryId: categories[0].subCategories[0].id
        },
        include: {
          category: true,
          subCategory: true
        }
      });
      console.log(`✅ Found ${booksInSubCategory.length} books in "${categories[0].subCategories[0].name}" subcategory`);
    }

    console.log('\n🎉 Category system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing category system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategorySystem();
