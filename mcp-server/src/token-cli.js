#!/usr/bin/env node
import { createToken, hashToken } from "./auth.js";

const token = createToken();
const tokenHash = hashToken(token);

const payload = {
  rawToken: token,
  configEntry: {
    customerId: "replace-customer-id",
    label: "Replace Customer Label",
    tokenHash,
    status: "active",
    rateLimit: {
      requestsPerMinute: 60,
      burst: 10
    },
    allowedTools: ["*"],
    expiresAt: "2099-12-31T23:59:59.000Z"
  }
};

process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
