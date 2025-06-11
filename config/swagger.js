// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library API',
      version: '1.0.0',
      description: 'API docs for the library management system',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js'], // hoặc nơi chứa mô tả swagger (vd: controller, route file)
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
