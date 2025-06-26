/**
 * Helper functions for the {{name}} policy
 * Simulates smart contract interactions for greeting limits
 */

// Mock greeting contract state - simulates on-chain data
// In real implementation, this would be read from a smart contract
const now = Date.now();
const oneHourAgo = now - 1 * 60 * 60 * 1000;
const twoHoursAgo = now - 2 * 60 * 60 * 1000;
const sixHoursAgo = now - 6 * 60 * 60 * 1000;
const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
const twentyHoursAgo = now - 20 * 60 * 60 * 1000;

const greetingStore: Record<string, Array<{ timestamp: number; data: any }>> = {
  // User near limit (8/10 greetings in last 24 hours)
  "0x1234567890123456789012345678901234567890": [
    { timestamp: oneHourAgo, data: { message: "Hello world!", appId: 1 } },
    { timestamp: twoHoursAgo, data: { message: "Good morning!", appId: 1 } },
    { timestamp: sixHoursAgo, data: { message: "Hi there!", appId: 1 } },
    { timestamp: twelveHoursAgo, data: { message: "Hey!", appId: 1 } },
    {
      timestamp: twelveHoursAgo + 1000,
      data: { message: "Greetings!", appId: 1 },
    },
    { timestamp: twentyHoursAgo, data: { message: "Welcome!", appId: 1 } },
    {
      timestamp: twentyHoursAgo + 1000,
      data: { message: "Salutations!", appId: 1 },
    },
    {
      timestamp: twentyHoursAgo + 2000,
      data: { message: "Nice to meet you!", appId: 1 },
    },
  ],

  // User over limit (12/10 greetings in last 24 hours)
  "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd": [
    { timestamp: oneHourAgo, data: { message: "Hello!", appId: 2 } },
    { timestamp: oneHourAgo + 1000, data: { message: "Hi!", appId: 2 } },
    { timestamp: twoHoursAgo, data: { message: "Hey!", appId: 2 } },
    { timestamp: twoHoursAgo + 1000, data: { message: "Howdy!", appId: 2 } },
    { timestamp: sixHoursAgo, data: { message: "Greetings!", appId: 2 } },
    {
      timestamp: sixHoursAgo + 1000,
      data: { message: "Salutations!", appId: 2 },
    },
    { timestamp: twelveHoursAgo, data: { message: "Good day!", appId: 2 } },
    {
      timestamp: twelveHoursAgo + 1000,
      data: { message: "Welcome!", appId: 2 },
    },
    {
      timestamp: twentyHoursAgo,
      data: { message: "Nice to see you!", appId: 2 },
    },
    {
      timestamp: twentyHoursAgo + 1000,
      data: { message: "Good to meet you!", appId: 2 },
    },
    {
      timestamp: twentyHoursAgo + 2000,
      data: { message: "Pleasure!", appId: 2 },
    },
    {
      timestamp: twentyHoursAgo + 3000,
      data: { message: "Delighted!", appId: 2 },
    },
  ],

  // User well under limit (2/10 greetings in last 24 hours)
  "0x9999888877776666555544443333222211110000": [
    { timestamp: sixHoursAgo, data: { message: "Hello there!", appId: 3 } },
    { timestamp: twentyHoursAgo, data: { message: "Good morning!", appId: 3 } },
  ],

  // New user with no greeting history
  "0xfeeddeadbeefcafebabefeeddeadbeefcafebabe": [],
};

/**
 * Check how many greetings a user has sent within the time window
 * Simulates a smart contract read call to get user's greeting count
 * @param userId - The user's address (PKP address)
 * @param timeWindowHours - The time window in hours to check
 * @returns The number of greetings within the time window
 */
export async function checkGreetingLimit(
  userId: string,
  timeWindowHours: number
): Promise<number> {
  // Simulate smart contract call delay
  await new Promise((resolve) => setTimeout(resolve, 10));

  const timeWindowMs = timeWindowHours * 60 * 60 * 1000;
  const cutoffTime = Date.now() - timeWindowMs;

  // Get user's greeting history from mock contract state
  const userGreetings = greetingStore[userId] || [];

  // Filter to only greetings within the time window
  const recentGreetings = userGreetings.filter(
    (greeting) => greeting.timestamp > cutoffTime
  );

  console.log(
    `Greeting limit check for ${userId}: ${recentGreetings.length} greetings in last ${timeWindowHours} hours`
  );

  return recentGreetings.length;
}
