export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  await billingClient.cancel(subscriptionId);
}

export function validateAmount(amount: number): void {
  if (amount <= 0) {
    throw new Error("amount must be positive");
  }
}
