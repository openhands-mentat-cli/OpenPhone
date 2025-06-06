const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OpenPhone API',
      version: '1.0.0',
      description: 'Cloud Android Phone System API Documentation',
      contact: {
        name: 'OpenPhone Support',
        url: 'https://github.com/openhands-mentat-cli/OpenPhone'
      }
    },
    servers: [
      {
        url: 'http://localhost:12000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Phone: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'phone-1' },
            name: { type: 'string', example: 'My Android Phone' },
            status: { $ref: '#/components/schemas/PhoneStatus' },
            emulatorPort: { type: 'number', example: 5554 },
            vncPort: { type: 'number', example: 5900 },
            websockifyPort: { type: 'number', example: 6080 }
          }
        },
        PhoneStatus: {
          type: 'object',
          properties: {
            running: { type: 'boolean', example: false },
            emulatorPort: { type: 'number', example: 5554 },
            vncPort: { type: 'number', example: 5900 },
            websockifyPort: { type: 'number', example: 6080 },
            displayNumber: { type: 'number', example: 99 },
            screenWidth: { type: 'number', example: 1080 },
            screenHeight: { type: 'number', example: 1920 },
            density: { type: 'number', example: 420 },
            avdName: { type: 'string', example: 'CloudPhone_phone-1' },
            vncUrl: { type: 'string', example: 'http://localhost:6080/vnc.html' },
            specs: { $ref: '#/components/schemas/PhoneSpecs' }
          }
        },
        PhoneSpecs: {
          type: 'object',
          properties: {
            ram: { type: 'string', example: '4GB' },
            storage: { type: 'string', example: '8GB' },
            cpu: { type: 'string', example: '4 Cores' },
            android: { type: 'string', example: 'Android 14' },
            resolution: { type: 'string', example: '1080x1920' }
          }
        },
        CreatePhoneRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'My New Phone' },
            androidVersion: { type: 'string', example: 'android-34', enum: ['android-31', 'android-32', 'android-33', 'android-34'] },
            ram: { type: 'string', example: '4096' },
            storage: { type: 'string', example: '8192' },
            resolution: { type: 'string', example: '1080x1920' },
            density: { type: 'string', example: '420' }
          }
        },
        PhoneActionRequest: {
          type: 'object',
          properties: {
            phoneId: { type: 'string', example: 'phone-1' }
          }
        },
        SendTextRequest: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', example: 'Hello Android!' },
            phoneId: { type: 'string', example: 'phone-1' }
          }
        },
        TapRequest: {
          type: 'object',
          required: ['x', 'y'],
          properties: {
            x: { type: 'number', example: 540 },
            y: { type: 'number', example: 960 },
            phoneId: { type: 'string', example: 'phone-1' }
          }
        },
        KeyEventRequest: {
          type: 'object',
          required: ['keycode'],
          properties: {
            keycode: { type: 'number', example: 4, description: 'Android keycode (4=Back, 3=Home, 187=Recent)' },
            phoneId: { type: 'string', example: 'phone-1' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./server.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
