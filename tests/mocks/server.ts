import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// This configures a Service Worker with the given request handlers
// primarily for Node.js environments (like Vitest)
export const server = setupServer(...handlers);
