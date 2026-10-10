import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { DocumentModel } from '../models/Document.model';
import { computeIntegrityHash, generateVerificationId } from '../utils/crypto';
import { generateQRCode, getVerificationUrl } from '../utils/qrcode';
import logger from '../utils/logger';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@verity.dev';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Verity@Admin2024!';

const SEED_DOCUMENTS = [
  {
    title: 'Bachelor of Science in Computer Science',
    documentType: 'diploma' as const,
    holderName: 'Alexandra Chen',
    holderEmail: 'a.chen@alumni.techuniversity.edu',
    issuingInstitution: 'Meridian Technology University',
    issuerDepartment: 'Faculty of Engineering & Computer Science',
    issueDate: new Date('2023-05-15'),
    expirationDate: null,
    description: 'Awarded with First Class Honours upon completion of the four-year BSc program.',
    tags: ['degree', 'computer-science', 'honours'],
    status: 'valid' as const,
  },
  {
    title: 'Certified Information Systems Security Professional (CISSP)',
    documentType: 'certificate' as const,
    holderName: 'Marcus Webb',
    holderEmail: 'm.webb@securitypro.com',
    issuingInstitution: 'ISC² International',
    issuerDepartment: 'Certification Authority',
    issueDate: new Date('2024-01-10'),
    expirationDate: new Date('2027-01-10'),
    description: 'Professional certification validating expertise in information security.',
    tags: ['security', 'cissp', 'professional'],
    status: 'valid' as const,
  },
  {
    title: 'Medical Practice License — General Surgery',
    documentType: 'license' as const,
    holderName: 'Dr. Priya Nair',
    holderEmail: 'dr.nair@northernmedical.org',
    issuingInstitution: 'National Medical Licensing Board',
    issuerDepartment: 'Surgical Specialties Division',
    issueDate: new Date('2019-03-01'),
    expirationDate: new Date('2024-03-01'),
    description: 'Full licensure to practice general surgery within the national jurisdiction.',
    tags: ['medical', 'surgery', 'license'],
    status: 'expired' as const,
  },
  {
    title: 'Professional Engineer (P.Eng.) Certification',
    documentType: 'certificate' as const,
    holderName: 'James Okonkwo',
    holderEmail: 'j.okonkwo@engineersboard.org',
    issuingInstitution: 'Engineers Professional Association',
    issuerDepartment: 'Mechanical Engineering Chapter',
    issueDate: new Date('2021-08-20'),
    expirationDate: new Date('2026-08-20'),
    description: 'Certification authorizing the practice of professional engineering.',
    tags: ['engineering', 'professional', 'mechanical'],
    status: 'valid' as const,
  },
  {
    title: 'Food Safety Handler Certificate',
    documentType: 'certificate' as const,
    holderName: 'Sofia Reyes',
    holderEmail: 's.reyes@deliciouscafe.com',
    issuingInstitution: 'City Health Department',
    issuerDepartment: 'Food Safety Division',
    issueDate: new Date('2022-11-05'),
    expirationDate: new Date('2025-11-05'),
    description: 'Certificate of completion for food safety and hygiene handling course.',
    tags: ['food-safety', 'health', 'hospitality'],
    status: 'revoked' as const,
  },
  {
    title: 'Master of Business Administration',
    documentType: 'diploma' as const,
    holderName: 'Daniel Müller',
    holderEmail: 'd.muller@globalcorp.de',
    issuingInstitution: 'Vantage Business School',
    issuerDepartment: 'Graduate School of Management',
    issueDate: new Date('2020-06-30'),
    expirationDate: null,
    description: 'MBA degree specializing in International Finance and Strategic Management.',
    tags: ['mba', 'business', 'finance'],
    status: 'valid' as const,
  },
  {
    title: 'Commercial Drone Pilot License',
    documentType: 'license' as const,
    holderName: 'Elena Vasquez',
    holderEmail: 'e.vasquez@skyworks.io',
    issuingInstitution: 'Civil Aviation Authority',
    issuerDepartment: 'Unmanned Aircraft Systems',
    issueDate: new Date('2023-09-12'),
    expirationDate: new Date('2025-09-12'),
    description: 'License authorizing commercial unmanned aerial vehicle operations.',
    tags: ['aviation', 'drone', 'commercial'],
    status: 'valid' as const,
  },
  {
    title: 'Employee Identity Card — Senior Software Engineer',
    documentType: 'id_card' as const,
    holderName: 'Yuki Tanaka',
    holderEmail: 'y.tanaka@nexatech.com',
    issuingInstitution: 'Nexa Technologies Inc.',
    issuerDepartment: 'Human Resources',
    issueDate: new Date('2024-02-01'),
    expirationDate: new Date('2025-02-01'),
    description: 'Official employee identity and access card.',
    tags: ['employee', 'access', 'id'],
    status: 'valid' as const,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('❌ MONGODB_URI is not set. Cannot run seed script.');
    process.exit(1);
  }

  logger.info('🌱 Starting database seed...');

  await mongoose.connect(uri);
  logger.info('✅ Connected to MongoDB');

  // Create admin user
  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await User.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: 'Verity Administrator',
      role: 'admin',
    });
    logger.info(`✅ Admin user created: ${ADMIN_EMAIL}`);
  } else {
    logger.info(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
  }

  // Seed documents
  let created = 0;
  let skipped = 0;

  for (const docData of SEED_DOCUMENTS) {
    // Check if we already have enough documents
    const existing = await DocumentModel.findOne({ title: docData.title, holderName: docData.holderName });
    if (existing) {
      skipped++;
      continue;
    }

    const verificationId = generateVerificationId();
    const integrityHash = computeIntegrityHash({
      verificationId,
      title: docData.title,
      documentType: docData.documentType,
      holderName: docData.holderName,
      issuingInstitution: docData.issuingInstitution,
      issueDate: docData.issueDate.toISOString(),
      expirationDate: docData.expirationDate?.toISOString() ?? null,
    });

    const { dataUrl: qrCodeDataUrl } = await generateQRCode(verificationId);
    const verificationUrl = getVerificationUrl(verificationId);

    await DocumentModel.create({
      ...docData,
      verificationId,
      integrityHash,
      qrCodeDataUrl,
      verificationUrl,
      issuedBy: admin._id,
      ...(docData.status === 'revoked' && {
        revokedAt: new Date(),
        revokedBy: admin._id,
        revocationReason: 'Revoked during initial data seed for demonstration purposes.',
      }),
    });

    created++;
    logger.info(`  ✅ ${docData.title} — ${docData.holderName} [${docData.status.toUpperCase()}]`);
  }

  logger.info('');
  logger.info(`🌱 Seed complete! Created: ${created}, Skipped: ${skipped}`);
  logger.info(`📧 Admin login: ${ADMIN_EMAIL}`);
  logger.info(`🔑 Admin password: ${ADMIN_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
