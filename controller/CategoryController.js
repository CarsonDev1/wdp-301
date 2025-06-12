const Category = require('../model/categories');

exports.getAllCategories = async (req, res) => {
	try {
		const categories = await Category.find().sort({ name: 1 });
		res.status(200).json(categories);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getCategoryById = async (req, res) => {
	try {
		const category = await Category.findById(req.params.id);
		if (!category) {
			return res.status(404).json({ message: 'Category not found' });
		}
		res.status(200).json(category);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.createCategory = async (req, res) => {
	try {
		const { name, description } = req.body;

		// Check if category already exists
		const existingCategory = await Category.findOne({ name });
		if (existingCategory) {
			return res.status(400).json({ message: 'Category already exists' });
		}

		const category = await Category.create({
			name,
			description,
		});

		res.status(201).json({
			message: 'Category created successfully',
			category,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.updateCategory = async (req, res) => {
	try {
		const { name, description } = req.body;
		const categoryId = req.params.id;

		// Check if another category with the same name exists
		const existingCategory = await Category.findOne({
			name,
			_id: { $ne: categoryId },
		});
		if (existingCategory) {
			return res.status(400).json({ message: 'Category name already exists' });
		}

		const category = await Category.findByIdAndUpdate(
			categoryId,
			{ name, description, updatedAt: Date.now() },
			{ new: true }
		);

		if (!category) {
			return res.status(404).json({ message: 'Category not found' });
		}

		res.status(200).json({
			message: 'Category updated successfully',
			category,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.deleteCategory = async (req, res) => {
	try {
		const categoryId = req.params.id;

		// Check if category is being used by any books
		const Book = require('../model/book');
		const booksUsingCategory = await Book.countDocuments({
			categories: categoryId,
		});

		if (booksUsingCategory > 0) {
			return res.status(400).json({
				message: `Cannot delete category. It is being used by ${booksUsingCategory} book(s)`,
			});
		}

		const category = await Category.findByIdAndDelete(categoryId);
		if (!category) {
			return res.status(404).json({ message: 'Category not found' });
		}

		res.status(200).json({
			message: 'Category deleted successfully',
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.getCategoryStats = async (req, res) => {
	try {
		const Book = require('../model/book');
		const Inventory = require('../model/Inventory');

		const categories = await Category.find();
		const stats = [];

		for (const category of categories) {
			// Get books in this category
			const books = await Book.find({ categories: category._id });
			const bookIds = books.map((book) => book._id);

			// Get inventory stats for books in this category
			const inventoryStats = await Inventory.aggregate([
				{ $match: { book: { $in: bookIds } } },
				{
					$group: {
						_id: null,
						totalBooks: { $sum: '$total' },
						availableBooks: { $sum: '$available' },
						borrowedBooks: { $sum: '$borrowed' },
						damagedBooks: { $sum: '$damaged' },
						lostBooks: { $sum: '$lost' },
					},
				},
			]);

			const stat = inventoryStats[0] || {
				totalBooks: 0,
				availableBooks: 0,
				borrowedBooks: 0,
				damagedBooks: 0,
				lostBooks: 0,
			};

			stats.push({
				category: {
					_id: category._id,
					name: category.name,
					description: category.description,
				},
				bookTitles: books.length,
				...stat,
			});
		}

		res.status(200).json(stats);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
