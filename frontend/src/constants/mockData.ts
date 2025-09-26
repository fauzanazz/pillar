export interface Contract {
  id: string;
  title: string;
  counterparty: string;
  status: 'draft' | 'legal_review' | 'management_review' | 'accepted' | 'rejected' | 'near_expire';
  amount?: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  reviewedBy?: string;
  description?: string;
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
    counterparty: 'TechCorp Inc.',
    status: 'legal_review',
    amount: '$50,000',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    createdBy: 'Sarah Internal',
    description: 'Annual software license for project management tools'
  },
  {
    id: '2',
    title: 'Service Agreement',
    counterparty: 'Consulting Group LLC',
    status: 'management_review',
    amount: '$120,000',
    startDate: '2025-02-01',
    endDate: '2025-08-31',
    createdBy: 'Sarah Internal',
    reviewedBy: 'John Legal',
    description: 'Strategic consulting services for Q1-Q3'
  },
  {
    id: '3',
    title: 'Vendor Contract',
    counterparty: 'Supply Chain Co.',
    status: 'accepted',
    amount: '$75,000',
    startDate: '2025-01-15',
    endDate: '2025-06-15',
    createdBy: 'Sarah Internal',
    reviewedBy: 'Mike Manager',
    description: 'Supply chain management services'
  },
  {
    id: '4',
    title: 'Marketing Partnership',
    counterparty: 'Digital Agency',
    status: 'draft',
    amount: '$30,000',
    startDate: '2025-03-01',
    endDate: '2025-05-31',
    createdBy: 'Sarah Internal',
    description: 'Digital marketing campaign partnership'
  },
  {
    id: '5',
    title: 'Maintenance Agreement',
    counterparty: 'Tech Support Inc.',
    status: 'near_expire',
    amount: '$25,000',
    startDate: '2024-01-01',
    endDate: '2025-01-31',
    createdBy: 'Sarah Internal',
    reviewedBy: 'John Legal',
    description: 'Equipment maintenance and support'
  },
  {
    id: '6',
    title: 'Data Processing Agreement',
    counterparty: 'DataCorp Ltd.',
    status: 'rejected',
    amount: '$40,000',
    startDate: '2025-02-01',
    endDate: '2025-12-31',
    createdBy: 'Sarah Internal',
    reviewedBy: 'John Legal',
    description: 'Data processing and analytics services - rejected due to compliance issues'
  }
];