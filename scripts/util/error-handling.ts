export function logError(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`❌ Error in ${context}:`, error.message);
  } else {
    console.error(`❌ Error in ${context}:`, error);
  }
}

export function logSuccess(context: string, message: string): void {
  console.log(`✅ ${context}: ${message}`);
}

export function logInfo(context: string, message: string): void {
  console.log(`📋 ${context}: ${message}`);
}

export function logProgress(
  batch: number,
  total: number,
  message: string
): void {
  console.log(`\n🔄 Processing batch ${batch}/${total}`);
  console.log(`📋 ${message}`);
}

export function logWaiting(seconds: number): void {
  console.log(`⏳ Waiting ${seconds} seconds before next batch...`);
}

export function handleCompanyError(companyName: string, error: unknown): void {
  console.error(`❌ Failed to process ${companyName}:`, error);
}

export function createBatchProcessor<T>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => Promise<void>,
  onBatchComplete?: (batchNumber: number, totalBatches: number) => void
) {
  return async () => {
    const totalBatches = Math.ceil(items.length / batchSize);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      logProgress(
        batchNumber,
        totalBatches,
        `Processing ${batch.length} items`
      );

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const index = i + j;
        await processor(item, index);
      }

      if (onBatchComplete) {
        onBatchComplete(batchNumber, totalBatches);
      }

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < items.length) {
        logWaiting(5);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  };
}
