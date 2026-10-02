// Preview/demo mode (in-memory sample guests, nothing saved) is OFF unless
// DEMO_MODE is explicitly "1". Production always uses the real database.
export const DEMO_MODE = process.env.DEMO_MODE === "1";
