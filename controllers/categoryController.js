import prisma from '../lib/prisma.js';

// @desc Get all categories with their subcategories
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

// @desc Get a single category with its subcategories
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category.' });
  }
};

// @desc Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, description, image, color, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists.' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image,
        color,
        sortOrder: sortOrder || 0
      },
      include: {
        subCategories: true
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

// @desc Update a category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, color, sortOrder, isActive } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if new name conflicts with existing category
    if (name && name !== existingCategory.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return res.status(400).json({ error: 'Category with this name already exists.' });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        image,
        color,
        sortOrder,
        isActive
      },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

// @desc Delete a category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        books: true,
        audio: true
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if category is being used
    if (existingCategory.books.length > 0 || existingCategory.audio.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category that is being used by books or audio content.' 
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

// @desc Create a new subcategory
export const createSubCategory = async (req, res) => {
  try {
    const { categoryId, name, description, sortOrder } = req.body;

    if (!categoryId || !name) {
      return res.status(400).json({ error: 'Category ID and subcategory name are required.' });
    }

    // Check if parent category exists
    const parentCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!parentCategory) {
      return res.status(404).json({ error: 'Parent category not found.' });
    }

    // Check if subcategory already exists in this category
    const existingSubCategory = await prisma.subCategory.findUnique({
      where: {
        categoryId_name: {
          categoryId,
          name
        }
      }
    });

    if (existingSubCategory) {
      return res.status(400).json({ error: 'Subcategory with this name already exists in this category.' });
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        categoryId,
        name,
        description,
        sortOrder: sortOrder || 0
      }
    });

    res.status(201).json(subCategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: 'Failed to create subcategory.' });
  }
};

// @desc Update a subcategory
export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;

    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!existingSubCategory) {
      return res.status(404).json({ error: 'Subcategory not found.' });
    }

    // Check if new name conflicts with existing subcategory in the same category
    if (name && name !== existingSubCategory.name) {
      const nameConflict = await prisma.subCategory.findUnique({
        where: {
          categoryId_name: {
            categoryId: existingSubCategory.categoryId,
            name
          }
        }
      });

      if (nameConflict) {
        return res.status(400).json({ error: 'Subcategory with this name already exists in this category.' });
      }
    }

    const subCategory = await prisma.subCategory.update({
      where: { id },
      data: {
        name,
        description,
        sortOrder,
        isActive
      }
    });

    res.json(subCategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ error: 'Failed to update subcategory.' });
  }
};

// @desc Delete a subcategory
export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        books: true,
        audio: true
      }
    });

    if (!existingSubCategory) {
      return res.status(404).json({ error: 'Subcategory not found.' });
    }

    // Check if subcategory is being used
    if (existingSubCategory.books.length > 0 || existingSubCategory.audio.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete subcategory that is being used by books or audio content.' 
      });
    }

    await prisma.subCategory.delete({
      where: { id }
    });

    res.json({ message: 'Subcategory deleted successfully.' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ error: 'Failed to delete subcategory.' });
  }
};
