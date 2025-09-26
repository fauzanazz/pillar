export interface Party {
  name: string;
  representation: string;
}

export interface Contract {
  id: string;
  title: string; // Nama
  description: string; // Deskripsi
  endDate: string; // End of contract
  parties: Party[]; // Pihak (list with name and representation)
  status: 'draft' | 'legal_review' | 'management_review' | 'accepted' | 'rejected' | 'canceled';
  version: string; // version
  generatedContract?: string; // AI generated contract content
  // Additional fields for backward compatibility
  counterparty: string;
  amount?: string;
  startDate: string;
  createdBy: string;
  reviewedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'legal' | 'internal' | 'management';
  department?: string;
}

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'John Legal',
    email: 'john.legal@company.com',
    role: 'legal',
    department: 'Legal'
  },
  {
    id: '2',
    name: 'Sarah Internal',
    email: 'sarah.internal@company.com',
    role: 'internal',
    department: 'Operations'
  },
  {
    id: '3',
    name: 'Mike Manager',
    email: 'mike.manager@company.com',
    role: 'management',
    department: 'Executive'
  }
];

// Login credentials for demo
export const LOGIN_CREDENTIALS = [
  { email: 'legal', password: 'legal123', role: 'legal', fullEmail: 'john.legal@company.com' },
  { email: 'internal', password: 'internal123', role: 'internal', fullEmail: 'sarah.internal@company.com' },
  { email: 'management', password: 'management123', role: 'management', fullEmail: 'mike.manager@company.com' }
];

// Role-based dashboard routes


export const MOCK_CONTRACTS: Contract[] = [
  {
    id: '1',
    title: 'Software License Agreement',
    description: 'Annual software license for project management tools',
    endDate: '2025-12-31',
    parties: [
      { name: 'TechCorp Inc.', representation: 'Software Vendor' },
      { name: 'Our Company', representation: 'Client' }
    ],
    status: 'legal_review',
    version: '1.0',
    counterparty: 'TechCorp Inc.',
    amount: '$50,000',
    startDate: '2025-01-01',
    createdBy: 'Sarah Internal',
  },
  {
    id: '2',
    title: 'Service Agreement',
    description: 'Strategic consulting services for Q1-Q3',
    endDate: '2025-08-31',
    parties: [
      { name: 'Consulting Group LLC', representation: 'Service Provider' },
      { name: 'Our Company', representation: 'Client' },
      { name: 'Partner Corp', representation: 'Third Party' }
    ],
    status: 'management_review',
    version: '1.1',
    counterparty: 'Consulting Group LLC',
    amount: '$120,000',
    startDate: '2025-02-01',
    createdBy: 'Sarah Internal',
    reviewedBy: 'John Legal',
  },
  {
    id: '3',
    title: 'Vendor Contract',
    description: 'Supply chain management services',
    endDate: '2025-06-15',
    parties: [
      { name: 'Supply Chain Co.', representation: 'Vendor' },
      { name: 'Our Company', representation: 'Buyer' }
    ],
    status: 'accepted',
    version: '2.0',
    counterparty: 'Supply Chain Co.',
    amount: '$75,000',
    startDate: '2025-01-15',
    createdBy: 'Sarah Internal',
    reviewedBy: 'Mike Manager',
  },
  {
    id: '4',
    title: 'Marketing Partnership',
    description: 'Digital marketing campaign partnership',
    endDate: '2025-05-31',
    parties: [
      { name: 'Digital Agency', representation: 'Marketing Partner' },
      { name: 'Our Company', representation: 'Client' }
    ],
    status: 'draft',
    version: '1.0',
    counterparty: 'Digital Agency',
    amount: '$30,000',
    startDate: '2025-03-01',
    createdBy: 'Sarah Internal',
  },
  {
    id: '5',
    title: 'Maintenance Agreement',
    description: 'Equipment maintenance and support',
    endDate: '2025-01-31',
    parties: [
      { name: 'Tech Support Inc.', representation: 'Service Provider' },
      { name: 'Our Company', representation: 'Client' }
    ],
    status: 'accepted',
    version: '1.0',
    counterparty: 'Tech Support Inc.',
    amount: '$25,000',
    startDate: '2024-01-01',
    createdBy: 'Sarah Internal',
    reviewedBy: 'John Legal',
  },
  {
    id: '6',
    title: 'Data Processing Agreement',
    description: 'Data processing and analytics services - rejected due to compliance issues',
    endDate: '2025-12-31',
    parties: [
      { name: 'DataCorp Ltd.', representation: 'Data Processor' },
      { name: 'Our Company', representation: 'Data Controller' }
    ],
    status: 'rejected',
    version: '1.2',
    counterparty: 'DataCorp Ltd.',
    amount: '$40,000',
    startDate: '2025-02-01',
    createdBy: 'Sarah Internal',
    reviewedBy: 'John Legal',
  }
];