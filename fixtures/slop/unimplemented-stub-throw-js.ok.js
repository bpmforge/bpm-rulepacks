export async function cancelSubscription(subscriptionId) {
  await billingClient.cancel(subscriptionId);
}

export function validateAmount(amount) {
  if (amount <= 0) {
    throw new Error("amount must be positive");
  }
}
