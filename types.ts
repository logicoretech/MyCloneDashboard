
export interface DataRecord {
  id: string;
  name: string;
  potentialRevenue: number;
  invoiceAmount: number;
  dollarsCollected: number;
  expenseIncurred: number;
  netRevenue: number;
  monthYear: string; // Format: MM/YYYY
}

export interface DashboardStats {
  totalPotentialRevenue: number;
  totalInvoiceAmount: number;
  totalDollarsCollected: number;
  totalExpenseIncurred: number;
  totalNetRevenue: number;
  collectionRate: number;
}

export enum LoadingStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
