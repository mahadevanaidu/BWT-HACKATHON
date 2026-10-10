import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Verity Document Verification API',
      version: '1.0.0',
      description: 'RESTful API for the Verity digital document verification platform.',
      contact: { name: 'Verity Team', email: 'api@verity.dev' },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Document: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'MongoDB document ID' },
            verificationId: { type: 'string', description: 'Unique public verification ID' },
            title: { type: 'string' },
            documentType: { type: 'string', enum: ['certificate', 'diploma', 'license', 'permit', 'id_card', 'transcript', 'contract', 'other'] },
            holderName: { type: 'string' },
            holderEmail: { type: 'string' },
            issuingInstitution: { type: 'string' },
            issueDate: { type: 'string', format: 'date-time' },
            expirationDate: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['valid', 'revoked', 'expired', 'suspended'] },
            metadata: { type: 'object' },
            integrityHash: { type: 'string' },
            qrCodeDataUrl: { type: 'string' },
            verificationUrl: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
