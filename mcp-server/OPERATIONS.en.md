# MCP Server Operations

This note documents the operational signals exposed by the hosted MCP server and how to use them when diagnosing admin and remote MCP traffic.

## Admin request tracing

All `/admin/*` routes attach an `x-request-id` response header.

- if the client sends `x-request-id`, the server echoes it
- otherwise the server generates a UUID
- the same request id is written into admin audit logs

## Admin error response shape

```json
{
  "error": "invalid_customer",
  "category": "validation",
  "message": "customerId is required"
}
```

Current categories:

- `validation`
- `conflict`
- `not_found`
- `infrastructure`
- `unknown`

## Admin audit logs

Admin writes emit:

- `admin_customer_write_succeeded`
- `admin_customer_write_failed`

## Metrics fields

`/metrics` and `/admin/overview` expose:

- `adminWrites`
- `adminWriteSummary`
- `remoteMcpErrors`
- `remoteMcpErrorSummary`
- `remoteMcpErrorCodes`

## Recommended checks

When admin actions fail:

1. capture `x-request-id`
2. search logs by `requestId`
3. inspect the error `category`
4. compare with `adminWrites` and `adminWriteSummary`

When remote MCP failures rise:

- inspect whether `auth`, `session`, `policy`, or `runtime` is increasing
- use `remoteMcpErrorCodes` when you need the exact rejection reason
