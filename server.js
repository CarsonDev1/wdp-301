const express = require('express');
const { json, urlencoded } = require('body-parser');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./model/user');
const connectionDB = require('./config/db');
const { swaggerUi, specs } = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());
app.use(urlencoded({ extended: true }));


app.use('/api/v1', require('./routes/authRoute'));




app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

connectionDB();
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log(`Backend is running at http://localhost:${PORT}`);
});
