/**
 * All-in-one dev launcher:
 * 1. Starts in-memory MongoDB
 * 2. Seeds demo data
 * 3. Starts Express API
 */
import dotenv from 'dotenv';
dotenv.config();

import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  VERITY — Development Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // If MONGODB_URI is already set (Atlas or local), skip in-memory
  let mongod: MongoMemoryServer | null = null;

  if (!process.env.MONGODB_URI) {
    console.log('📦 No MONGODB_URI set — starting in-memory MongoDB…');
    console.log('   (First run downloads ~70 MB, subsequent runs are instant)\n');

    mongod = await MongoMemoryServer.create({
      instance: { dbName: 'verity' },
    });

    process.env.MONGODB_URI = mongod.getUri();
    console.log(`✅ In-memory MongoDB: ${process.env.MONGODB_URI}\n`);
  } else {
    console.log(`✅ Using configured MONGODB_URI\n`);
  }

  // Set defaults
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'verity-dev-secret-local';
  process.env.PORT = process.env.PORT || '5000';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
  process.env.NODE_ENV = 'development';

  // Connect DB
  const { connectDB } = await import('../utils/database');
  await connectDB();

  // Seed demo data
  console.log('\n🌱 Seeding demo data…');
  const { User } = await import('../models/User.model');
  const { DocumentModel } = await import('../models/Document.model');
  const { computeIntegrityHash, generateVerificationId } = await import('../utils/crypto');
  const { generateQRCode, getVerificationUrl } = await import('../utils/qrcode');

  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@verity.dev';
  const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Verity@Admin2024!';

  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: 'Verity Administrator',
      role: 'admin',
    });
    console.log(`  ✅ Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`  ℹ️  Admin exists: ${ADMIN_EMAIL}`);
  }

  const SEED_DOCS = [
    { title: 'Bachelor of Science in Computer Science', documentType: 'diploma' as const, holderName: 'Alexandra Chen', holderEmail: 'a.chen@alumni.techuniversity.edu', issuingInstitution: 'Meridian Technology University', issuerDepartment: 'Faculty of Engineering & Computer Science', issueDate: new Date('2023-05-15'), expirationDate: null, status: 'valid' as const },
    { title: 'Certified Information Systems Security Professional (CISSP)', documentType: 'certificate' as const, holderName: 'Marcus Webb', holderEmail: 'm.webb@securitypro.com', issuingInstitution: 'ISC² International', issuerDepartment: 'Certification Authority', issueDate: new Date('2024-01-10'), expirationDate: new Date('2027-01-10'), status: 'valid' as const },
    { title: 'Medical Practice License — General Surgery', documentType: 'license' as const, holderName: 'Dr. Priya Nair', holderEmail: 'dr.nair@northernmedical.org', issuingInstitution: 'National Medical Licensing Board', issuerDepartment: 'Surgical Specialties Division', issueDate: new Date('2019-03-01'), expirationDate: new Date('2024-03-01'), status: 'expired' as const },
    { title: 'Professional Engineer (P.Eng.) Certification', documentType: 'certificate' as const, holderName: 'James Okonkwo', holderEmail: 'j.okonkwo@engineersboard.org', issuingInstitution: 'Engineers Professional Association', issuerDepartment: 'Mechanical Engineering Chapter', issueDate: new Date('2021-08-20'), expirationDate: new Date('2026-08-20'), status: 'valid' as const },
    { title: 'Food Safety Handler Certificate', documentType: 'certificate' as const, holderName: 'Sofia Reyes', holderEmail: 's.reyes@deliciouscafe.com', issuingInstitution: 'City Health Department', issuerDepartment: 'Food Safety Division', issueDate: new Date('2022-11-05'), expirationDate: new Date('2025-11-05'), status: 'revoked' as const },
    { title: 'Master of Business Administration', documentType: 'diploma' as const, holderName: 'Daniel Müller', holderEmail: 'd.muller@globalcorp.de', issuingInstitution: 'Vantage Business School', issuerDepartment: 'Graduate School of Management', issueDate: new Date('2020-06-30'), expirationDate: null, status: 'valid' as const },
    { title: 'Commercial Drone Pilot License', documentType: 'license' as const, holderName: 'Elena Vasquez', holderEmail: 'e.vasquez@skyworks.io', issuingInstitution: 'Civil Aviation Authority', issuerDepartment: 'Unmanned Aircraft Systems', issueDate: new Date('2023-09-12'), expirationDate: new Date('2025-09-12'), status: 'valid' as const },
    { title: 'Employee Identity Card — Senior Software Engineer', documentType: 'id_card' as const, holderName: 'Yuki Tanaka', holderEmail: 'y.tanaka@nexatech.com', issuingInstitution: 'Nexa Technologies Inc.', issuerDepartment: 'Human Resources', issueDate: new Date('2024-02-01'), expirationDate: new Date('2025-02-01'), status: 'valid' as const },
  ];

  let seeded = 0;
  for (const d of SEED_DOCS) {
    const existing = await DocumentModel.findOne({ title: d.title, holderName: d.holderName });
    if (existing) continue;

    const verificationId = generateVerificationId();
    const integrityHash = computeIntegrityHash({
      verificationId, title: d.title, documentType: d.documentType,
      holderName: d.holderName, issuingInstitution: d.issuingInstitution,
      issueDate: d.issueDate.toISOString(), expirationDate: d.expirationDate?.toISOString() ?? null,
    });
    const { dataUrl: qrCodeDataUrl } = await generateQRCode(verificationId);
    const verificationUrl = getVerificationUrl(verificationId);

    await DocumentModel.create({
      ...d, verificationId, integrityHash, qrCodeDataUrl, verificationUrl,
      issuedBy: admin._id,
      ...(d.status === 'revoked' && { revokedAt: new Date(), revokedBy: admin._id, revocationReason: 'Revoked for demonstration.' }),
    });
    console.log(`  ✅ [${d.status.toUpperCase()}] ${d.title}`);
    seeded++;
  }

  console.log(`\n✅ Seeded ${seeded} documents\n`);

  // Start Express
  const app = (await import('../app')).default;
  const PORT = parseInt(process.env.PORT!, 10);

  app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀  API:     http://localhost:${PORT}`);
    console.log(`📚  Docs:    http://localhost:${PORT}/api-docs`);
    console.log(`🌐  App:     http://localhost:5173`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n🔑  Login:   admin@verity.dev`);
    console.log(`🔒  Pass:    Verity@Admin2024!\n`);
  });

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down…');
    if (mongod) await mongod.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
