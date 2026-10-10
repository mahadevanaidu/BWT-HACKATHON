import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User.model';
import { DocumentModel } from '../models/Document.model';

const ADMIN = { email: 'doc.admin@verity.test', password: 'DocAdmin@2024!', name: 'Doc Admin', role: 'admin' as const };
const VIEWER = { email: 'doc.viewer@verity.test', password: 'DocViewer@2024!', name: 'Doc Viewer', role: 'viewer' as const };

let adminToken: string;
let createdDocId: string;
let createdVerificationId: string;

async function login(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/verity_test';
  await mongoose.connect(uri);
  await User.deleteMany({ email: { $in: [ADMIN.email, VIEWER.email] } });
  await User.create(ADMIN);
  await User.create(VIEWER);
  adminToken = await login(ADMIN.email, ADMIN.password);
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: [ADMIN.email, VIEWER.email] } });
  if (createdDocId) await DocumentModel.findByIdAndDelete(createdDocId);
  await mongoose.disconnect();
});

const DOC_PAYLOAD = {
  title: 'Test Certificate of Achievement',
  documentType: 'certificate',
  holderName: 'John Doe',
  holderEmail: 'john.doe@test.com',
  issuingInstitution: 'Test University',
  issueDate: '2024-01-01',
  description: 'A test certificate',
};

describe('POST /api/documents', () => {
  it('should create a document as admin', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(DOC_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.document).toMatchObject({
      title: DOC_PAYLOAD.title,
      holderName: DOC_PAYLOAD.holderName,
      status: 'valid',
    });
    expect(res.body.document).toHaveProperty('verificationId');
    expect(res.body.document).toHaveProperty('integrityHash');
    expect(res.body.document).toHaveProperty('qrCodeDataUrl');
    expect(res.body.document.verificationId).toMatch(/^VRT-/);

    createdDocId = res.body.document._id;
    createdVerificationId = res.body.document.verificationId;
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Incomplete Doc' });

    expect(res.status).toBe(400);
  });

  it('should reject invalid document type', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...DOC_PAYLOAD, documentType: 'invalid_type' });

    expect(res.status).toBe(400);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app).post('/api/documents').send(DOC_PAYLOAD);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/documents', () => {
  it('should list documents', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('documents');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.documents)).toBe(true);
  });

  it('should search documents by title', async () => {
    const res = await request(app)
      .get('/api/documents?q=Test+Certificate')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.documents.length).toBeGreaterThan(0);
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get('/api/documents?status=valid')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.documents.every((d: { status: string }) => d.status === 'valid')).toBe(true);
  });
});

describe('GET /api/documents/:id', () => {
  it('should get a document by ID', async () => {
    const res = await request(app)
      .get(`/api/documents/${createdDocId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.document._id).toBe(createdDocId);
  });

  it('should return 404 for unknown ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/documents/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/documents/:id', () => {
  it('should update allowed fields', async () => {
    const res = await request(app)
      .patch(`/api/documents/${createdDocId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated description' });

    expect(res.status).toBe(200);
    expect(res.body.document.description).toBe('Updated description');
  });
});

describe('POST /api/documents/:id/revoke', () => {
  it('should revoke a valid document', async () => {
    const res = await request(app)
      .post(`/api/documents/${createdDocId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Testing revocation' });

    expect(res.status).toBe(200);
    expect(res.body.document.status).toBe('revoked');
    expect(res.body.document.revocationReason).toBe('Testing revocation');
  });

  it('should reject revoking an already-revoked document', async () => {
    const res = await request(app)
      .post(`/api/documents/${createdDocId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Double revoke attempt' });

    expect(res.status).toBe(409);
  });

  it('should reject editing a revoked document', async () => {
    const res = await request(app)
      .patch(`/api/documents/${createdDocId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Trying to edit revoked doc' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/verify/:verificationId', () => {
  let validDocId: string;
  let validVerId: string;

  beforeAll(async () => {
    // Create a fresh valid doc for verification tests
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...DOC_PAYLOAD, title: 'Verify Test Certificate' });

    validDocId = res.body.document._id;
    validVerId = res.body.document.verificationId;
  });

  afterAll(async () => {
    if (validDocId) await DocumentModel.findByIdAndDelete(validDocId);
  });

  it('should return valid status for a valid document', async () => {
    const res = await request(app).get(`/api/verify/${validVerId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('valid');
    expect(res.body.integrityVerified).toBe(true);
    expect(res.body).not.toHaveProperty('holderEmail');
  });

  it('should return revoked status after revocation', async () => {
    await request(app)
      .post(`/api/documents/${validDocId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Verify revocation test' });

    const res = await request(app).get(`/api/verify/${validVerId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('revoked');
    expect(res.body.revokedAt).toBeDefined();
  });

  it('should return not_found for unknown verification ID', async () => {
    const res = await request(app).get('/api/verify/VRT-INVALID-00000000');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('not_found');
  });

  it('should detect integrity failure if hash is tampered', async () => {
    const freshRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...DOC_PAYLOAD, title: 'Integrity Test Certificate' });

    const docId = freshRes.body.document._id;
    const verId = freshRes.body.document.verificationId;

    // Tamper with the hash directly in DB
    await DocumentModel.findByIdAndUpdate(docId, { integrityHash: 'aabbcc00deadbeef' + '0'.repeat(48) });

    const res = await request(app).get(`/api/verify/${verId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('integrity_failed');

    await DocumentModel.findByIdAndDelete(docId);
  });
});
