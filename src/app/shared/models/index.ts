export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  type: 'savings' | 'current' | 'credit';
  balance: number;
  availableBalance: number;
  status: 'active' | 'frozen' | 'closed';
  currency: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  category?: string;
  date: string; // ISO 8601
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  recentTransactions: Transaction[];
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';
