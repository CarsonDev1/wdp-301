const express = require('express');
const { json, urlencoded } = require('body-parser');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const connectionDB = require('./config/db');
const { swaggerUi, specs } = require('./config/swagger');

// Import all models to ensure they are registered
require('./model/user');
require('./model/book');
require('./model/categories');
require('./model/bookshelf');
require('./model/Inventory');
require('./model/borrowHistory');
require('./model/review');
require('./model/fine');
require('./model/report');

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Middleware
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());
app.use(urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', require('./routes/authRoute'));
app.use('/api/v1/books', require('./routes/BookRoute'));

// Health check route
app.get('/api/v1/health', (req, res) => {
	res.status(200).json({
		message: 'Library Management API is running',
		timestamp: new Date().toISOString(),
	});
});

// 404 handler - must be after all routes
app.use((req, res, next) => {
	res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		message: 'Something went wrong!',
		error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
	});
});

// Connect to database
connectionDB();

// Start server
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
	console.log(`Backend is running at http://localhost:${PORT}`);
	console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});
