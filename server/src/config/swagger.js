const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GreenAlert API',
      version: '1.0.0',
      description: 'REST API for the GreenAlert environmental reporting platform. Reports, auth, notifications, communities, and more.',
      contact: {
        name: 'GreenAlert Team',
        email: 'support@greenalert.com',
      },
    },
    servers: [
      { url: process.env.SERVER_URL || 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
  apis: [path.join(__dirname, '../routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
