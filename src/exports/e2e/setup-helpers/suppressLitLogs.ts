/**
 * Comprehensive log suppression for Lit Protocol SDK
 * Suppresses verbose logs from various sources including console and debug module
 */

const originalConsole = {
  log: console.log,
  info: console.info,
  debug: console.debug,
  warn: console.warn,
  error: console.error,
};

const originalProcessStderr = process.stderr.write;
const originalProcessStdout = process.stdout.write;

const shouldSuppressLog = (message: string): boolean => {
  const suppressPatterns = [
    "Lit-JS-SDK",
    "[Lit-JS-SDK",
    "lit-js-sdk:",
    "deprecated LogLevel is deprecated",
    'Storage key "lit-session-key" is missing',
    'Storage key "lit-wallet-sig" is missing',
    "Unable to store walletSig in local storage",
    "using deprecated parameters for `initSync()`",
    "[DEBUG] [contract-sdk]",
    "Validator's URL:",
    "Not a problem. Continue...",
    // Additional patterns for debug module outputs
    "lit-js-sdk:constants:constants",
    "node_modules/@lit-protocol/",
  ];

  return suppressPatterns.some((pattern) => message.includes(pattern));
};

let isSuppressionActive = false;

export const suppressLitLogs = (enable: boolean = true) => {
  if (enable && !isSuppressionActive) {
    // Override console methods
    Object.keys(originalConsole).forEach((method) => {
      const methodKey = method as keyof typeof originalConsole;
      (console as any)[methodKey] = (...args: any[]) => {
        const message = args.join(" ");
        if (!shouldSuppressLog(message)) {
          originalConsole[methodKey](...args);
        }
      };
    });

    // Override process.stderr.write to catch debug module outputs
    process.stderr.write = function (
      this: NodeJS.WriteStream,
      chunk: any,
      encoding?: any,
      callback?: any
    ) {
      const message = chunk.toString();
      if (!shouldSuppressLog(message)) {
        return originalProcessStderr.call(this, chunk, encoding, callback);
      }
      // Suppress the log by not writing it
      if (typeof callback === "function") {
        callback();
      }
      return true;
    } as any;

    // Also override process.stdout.write just in case
    process.stdout.write = function (
      this: NodeJS.WriteStream,
      chunk: any,
      encoding?: any,
      callback?: any
    ) {
      const message = chunk.toString();
      if (!shouldSuppressLog(message)) {
        return originalProcessStdout.call(this, chunk, encoding, callback);
      }
      // Suppress the log by not writing it
      if (typeof callback === "function") {
        callback();
      }
      return true;
    } as any;

    isSuppressionActive = true;
    console.log("🤫 Lit SDK log suppression enabled");
  } else if (!enable && isSuppressionActive) {
    // Restore original methods
    Object.keys(originalConsole).forEach((method) => {
      const methodKey = method as keyof typeof originalConsole;
      (console as any)[methodKey] = originalConsole[methodKey];
    });

    process.stderr.write = originalProcessStderr;
    process.stdout.write = originalProcessStdout;

    isSuppressionActive = false;
  }
};

export const restoreLogs = () => {
  suppressLitLogs(false);
};

// Auto-cleanup on exit
process.on("exit", restoreLogs);
process.on("SIGINT", () => {
  restoreLogs();
  process.exit();
});
