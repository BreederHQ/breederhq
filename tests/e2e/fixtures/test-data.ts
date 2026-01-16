// tests/e2e/fixtures/test-data.ts
// Test data fixtures for E2E tests

export const TEST_USERS = {
  breeder: {
    email: process.env.TEST_BREEDER_EMAIL || 'test.breeder@example.com',
    password: process.env.TEST_BREEDER_PASSWORD || 'TestPassword123!',
    name: 'Test Breeder',
  },
  buyer: {
    email: process.env.TEST_PORTAL_EMAIL || 'test.buyer@example.com',
    password: process.env.TEST_PORTAL_PASSWORD || 'TestPassword123!',
    name: 'John Doe',
  },
  buyer2: {
    email: process.env.TEST_PORTAL_EMAIL_2 || 'test.buyer2@example.com',
    password: process.env.TEST_PORTAL_PASSWORD_2 || 'TestPassword123!',
    name: 'Jane Smith',
  },
};

export const TEST_CONTACTS = {
  individual: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    type: 'INDIVIDUAL',
  },
  organization: {
    name: 'ABC Kennels',
    email: 'contact@abckennels.com',
    phone: '+1234567891',
    type: 'ORGANIZATION',
  },
};

export const TEST_TEMPLATES = {
  puppySale: 'Puppy Sale Agreement',
  studService: 'Stud Service Agreement',
  coOwnership: 'Co-Ownership Agreement',
  healthGuarantee: 'Health Guarantee',
  breedingRights: 'Breeding Rights Transfer',
  boardingAgreement: 'Boarding Agreement',
};

export const TEST_CONTRACTS = {
  puppySale: {
    template: TEST_TEMPLATES.puppySale,
    title: 'Puppy Sale - Golden Retriever - Buddy',
    contact: 'John Doe',
  },
  studService: {
    template: TEST_TEMPLATES.studService,
    title: 'Stud Service - Champion Bloodline',
    contact: 'ABC Kennels',
  },
  coOwnership: {
    template: TEST_TEMPLATES.coOwnership,
    title: 'Co-Ownership - Show Prospect',
    contact: 'Jane Smith',
  },
};

export const CONTRACT_STATUSES = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  SIGNED: 'Signed',
  DECLINED: 'Declined',
  VOIDED: 'Voided',
  EXPIRED: 'Expired',
} as const;

export const NOTIFICATION_TYPES = {
  CONTRACT_SENT: 'contract_sent',
  CONTRACT_REMINDER_7D: 'contract_reminder_7d',
  CONTRACT_REMINDER_3D: 'contract_reminder_3d',
  CONTRACT_REMINDER_1D: 'contract_reminder_1d',
  CONTRACT_SIGNED: 'contract_signed',
  CONTRACT_DECLINED: 'contract_declined',
  CONTRACT_VOIDED: 'contract_voided',
  CONTRACT_EXPIRED: 'contract_expired',
} as const;
