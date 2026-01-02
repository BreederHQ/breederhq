// apps/portal/src/dev/mockData.ts
// Deterministic demo data for portal UI screenshots
// No randomness - all data is fixed and realistic
// Using simple objects - pages will cast with `as any`

export function mockDashboardSummary() {
  return {
    unreadMessages: 2,
    pendingTasks: 3,
    upcomingAppointments: 1,
  };
}

export function mockThreads() {
  return [
    {
      id: 1,
      subject: "Pickup schedule confirmation",
      lastMessageAt: "2026-01-01T10:30:00Z",
      unreadCount: 1,
      participants: [
        { id: 1, name: "Sarah Thompson", partyId: 100 },
        { id: 2, name: "You", partyId: 200 },
      ],
    },
    {
      id: 2,
      subject: "Health certificate question",
      lastMessageAt: "2025-12-31T16:45:00Z",
      unreadCount: 1,
      participants: [
        { id: 1, name: "Sarah Thompson", partyId: 100 },
        { id: 2, name: "You", partyId: 200 },
      ],
    },
    {
      id: 3,
      subject: "Payment confirmation",
      lastMessageAt: "2025-12-28T14:20:00Z",
      unreadCount: 0,
      participants: [
        { id: 1, name: "Sarah Thompson", partyId: 100 },
        { id: 2, name: "You", partyId: 200 },
      ],
    },
  ];
}

export function mockThreadDetail(id: number) {
  const threads: Record<number, any> = {
    1: {
      id: 1,
      subject: "Pickup schedule confirmation",
      participants: [
        { id: 1, name: "Sarah Thompson", partyId: 100 },
        { id: 2, name: "You", partyId: 200 },
      ],
      messages: [
        {
          id: 1,
          body: "Hi! I wanted to confirm our pickup appointment for next Saturday at 2pm. Will that still work for you?",
          sentAt: "2025-12-30T14:00:00Z",
          senderName: "You",
          isFromClient: true,
          fromPartyId: 200,
        },
        {
          id: 2,
          body: "Yes, Saturday at 2pm works perfectly! We'll have everything ready for you. Please bring a secure carrier for the car ride home.",
          sentAt: "2026-01-01T10:30:00Z",
          senderName: "Sarah Thompson",
          isFromClient: false,
          fromPartyId: 100,
        },
      ],
    },
    2: {
      id: 2,
      subject: "Health certificate question",
      participants: [
        { id: 1, name: "Sarah Thompson", partyId: 100 },
        { id: 2, name: "You", partyId: 200 },
      ],
      messages: [
        {
          id: 3,
          body: "I just uploaded the health certificate to your documents. Let me know if you need anything else!",
          sentAt: "2025-12-31T16:45:00Z",
          senderName: "Sarah Thompson",
          isFromClient: false,
          fromPartyId: 100,
        },
      ],
    },
    3: {
      id: 3,
      subject: "Payment confirmation",
      participants: [
        { id: 1, name: "Sarah Thompson", partyId: 100 },
        { id: 2, name: "You", partyId: 200 },
      ],
      messages: [
        {
          id: 4,
          body: "Payment received! Thank you so much. Your puppy is reserved and we're excited for you to meet them.",
          sentAt: "2025-12-28T14:20:00Z",
          senderName: "Sarah Thompson",
          isFromClient: false,
          fromPartyId: 100,
        },
      ],
    },
  };

  return threads[id] || { id, subject: "Thread not found", participants: [], messages: [] };
}

export function mockAgreements() {
  return [
    {
      id: 1,
      name: "Puppy Purchase Agreement",
      status: "signed",
      createdAt: "2025-12-10T10:00:00Z",
      signedAt: "2025-12-12T14:30:00Z",
      effectiveDate: "2025-12-12",
      expirationDate: null,
      role: "Client",
    },
    {
      id: 2,
      name: "Health Guarantee",
      status: "sent",
      createdAt: "2025-12-28T09:00:00Z",
      signedAt: null,
      effectiveDate: "2025-12-28",
      expirationDate: "2026-01-11",
      role: "Client",
    },
    {
      id: 3,
      name: "Spay/Neuter Agreement",
      status: "expired",
      createdAt: "2025-11-15T10:00:00Z",
      signedAt: null,
      effectiveDate: "2025-11-15",
      expirationDate: "2025-11-30",
      role: "Client",
    },
  ];
}

export function mockAgreementDetail(id: number) {
  const agreements: Record<number, any> = {
    1: {
      id: 1,
      name: "Puppy Purchase Agreement",
      status: "signed",
      createdAt: "2025-12-10T10:00:00Z",
      signedAt: "2025-12-12T14:30:00Z",
      effectiveDate: "2025-12-12",
      expirationDate: null,
      body: "This agreement is entered into between the Breeder and the Buyer for the purchase of one puppy.\n\n1. Purchase Price: The total purchase price is $2,500.\n2. Deposit: A non-refundable deposit of $500 is required to reserve the puppy.\n3. Health Guarantee: The puppy is guaranteed to be in good health at the time of pickup.\n\nSigned and agreed.",
    },
    2: {
      id: 2,
      name: "Health Guarantee",
      status: "sent",
      createdAt: "2025-12-28T09:00:00Z",
      signedAt: null,
      effectiveDate: "2025-12-28",
      expirationDate: "2026-01-11",
      body: "Health Guarantee Agreement\n\nThe breeder guarantees that the puppy is in good health at the time of pickup and free from genetic defects for a period of 2 years.\n\nPlease review and sign within 14 days.",
    },
    3: {
      id: 3,
      name: "Spay/Neuter Agreement",
      status: "expired",
      createdAt: "2025-11-15T10:00:00Z",
      signedAt: null,
      effectiveDate: "2025-11-15",
      expirationDate: "2025-11-30",
      body: "The buyer agrees to spay/neuter the puppy by 12 months of age and provide proof of the procedure to the breeder.\n\nThis agreement has expired.",
    },
  };

  return agreements[id] || { id, name: "Agreement not found", status: "sent", createdAt: "2025-12-01T00:00:00Z", signedAt: null, effectiveDate: null, expirationDate: null, body: "Agreement content not available." };
}

export function mockDocuments() {
  return [
    {
      id: 1,
      name: "Health Certificate - Bella",
      uploadedAt: "2025-12-31T16:45:00Z",
      category: "HEALTH",
      relatedOffspringId: 1,
      relatedOffspringName: "Bella",
      sizeBytes: 524288,
    },
    {
      id: 2,
      name: "Vaccination Record - Bella",
      uploadedAt: "2025-12-20T10:30:00Z",
      category: "HEALTH",
      relatedOffspringId: 1,
      relatedOffspringName: "Bella",
      sizeBytes: 327680,
    },
    {
      id: 3,
      name: "Pedigree Certificate - Max",
      uploadedAt: "2025-12-15T14:00:00Z",
      category: "PEDIGREE",
      relatedOffspringId: 2,
      relatedOffspringName: "Max",
      sizeBytes: 1048576,
    },
    {
      id: 4,
      name: "Contract Copy",
      uploadedAt: "2025-12-12T15:00:00Z",
      category: "CONTRACT",
      relatedOffspringId: null,
      relatedOffspringName: null,
      sizeBytes: 204800,
    },
  ];
}

export function mockOffspring() {
  return [
    {
      id: 1,
      offspring: { id: 101, name: "Bella", sex: "Female" },
      breed: "Golden Retriever",
      birthDate: "2025-11-15",
      dam: { id: 201, name: "Luna" },
      sire: { id: 202, name: "Rocky" },
      offspringGroupLabel: "Winter 2025 Litter",
      offspringGroupCode: "W25-A",
      offspringGroupId: 1,
      species: "Dog",
      placementStatus: "reserved",
      depositPaidAt: "2025-12-10T00:00:00Z",
      contractSignedAt: "2025-12-12T00:00:00Z",
      paidInFullAt: null,
      pickupAt: null,
    },
    {
      id: 2,
      offspring: { id: 102, name: "Max", sex: "Male" },
      breed: "Golden Retriever",
      birthDate: "2025-10-20",
      dam: { id: 203, name: "Daisy" },
      sire: { id: 204, name: "Duke" },
      offspringGroupLabel: "Fall 2025 Litter",
      offspringGroupCode: "F25-B",
      offspringGroupId: 2,
      species: "Dog",
      placementStatus: "reserved",
      depositPaidAt: "2025-11-05T00:00:00Z",
      contractSignedAt: "2025-11-10T00:00:00Z",
      paidInFullAt: null,
      pickupAt: null,
    },
    {
      id: 3,
      offspring: { id: 103, name: "Charlie", sex: "Male" },
      breed: "Golden Retriever",
      birthDate: "2025-09-10",
      dam: { id: 205, name: "Sadie" },
      sire: { id: 206, name: "Cooper" },
      offspringGroupLabel: "Summer 2025 Litter",
      offspringGroupCode: "S25-C",
      offspringGroupId: 3,
      species: "Dog",
      placementStatus: "placed",
      depositPaidAt: "2025-09-25T00:00:00Z",
      contractSignedAt: "2025-10-01T00:00:00Z",
      paidInFullAt: "2025-10-15T00:00:00Z",
      pickupAt: "2025-11-05T00:00:00Z",
    },
  ];
}

export function mockOffspringDetail(id: number) {
  const offspring: Record<number, any> = {
    101: {
      id: 101,
      name: "Bella",
      sex: "Female",
      breed: "Golden Retriever",
      species: "Dog",
      birthDate: "2025-11-15",
      dam: { id: 201, name: "Luna" },
      sire: { id: 202, name: "Rocky" },
      groupName: "Winter 2025 Litter",
      groupId: 1,
      placementStatus: "reserved",
      contractSignedAt: "2025-12-12T14:30:00Z",
      paidInFullAt: "2025-12-28T10:00:00Z",
      pickupAt: null,
      placedAt: null,
      createdAt: "2025-12-10T00:00:00Z",
    },
    102: {
      id: 102,
      name: "Max",
      sex: "Male",
      breed: "Golden Retriever",
      species: "Dog",
      birthDate: "2025-10-20",
      dam: { id: 203, name: "Daisy" },
      sire: { id: 204, name: "Duke" },
      groupName: "Fall 2025 Litter",
      groupId: 2,
      placementStatus: "reserved",
      contractSignedAt: "2025-11-10T09:00:00Z",
      paidInFullAt: null,
      pickupAt: null,
      placedAt: null,
      createdAt: "2025-11-05T00:00:00Z",
    },
    103: {
      id: 103,
      name: "Charlie",
      sex: "Male",
      breed: "Golden Retriever",
      species: "Dog",
      birthDate: "2025-09-10",
      dam: { id: 205, name: "Sadie" },
      sire: { id: 206, name: "Cooper" },
      groupName: "Summer 2025 Litter",
      groupId: 3,
      placementStatus: "placed",
      contractSignedAt: "2025-10-01T10:00:00Z",
      paidInFullAt: "2025-10-15T14:00:00Z",
      pickupAt: "2025-11-05T15:00:00Z",
      placedAt: "2025-11-05T15:30:00Z",
      createdAt: "2025-09-25T00:00:00Z",
    },
  };

  return offspring[id] || { id, name: "Unknown", sex: null, breed: null, species: "Dog", birthDate: null, dam: null, sire: null, groupName: null, groupId: null, placementStatus: null, contractSignedAt: null, paidInFullAt: null, pickupAt: null, placedAt: null, createdAt: null };
}

export function mockProfile() {
  return {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    orgName: "Thompson Golden Retrievers",
  };
}
