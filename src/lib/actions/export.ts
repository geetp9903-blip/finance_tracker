'use server';

import { getTransactions } from '@/lib/dal/finance';

/**
 * Server Action to fetch all transactions for export.
 * Acts as a bridge between Client Components (ExportButton) and Server-Only DAL.
 */
export async function getExportData() {
    // Re-use the DAL function, but wrapped in "use server" context
    const result = await getTransactions({ limit: 10000 });
    return result.data; // Return just the array
}
