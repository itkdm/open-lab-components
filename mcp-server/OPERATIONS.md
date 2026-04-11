# MCP Server Operations

This note documents the operational signals exposed by the hosted MCP server and how to use them when diagnosing admin traffic.

## Admin request tracing

All `/admin/*` routes now attach an `x-request-id` response header.

- If the client sends `x-request-id`, the server echoes that value back.
- If the client omits it, the server generates a UUID.
- The same request id is written into admin success and failure audit logs.

This makes it possible to follow one admin action across:

- the HTTP response seen by the caller
- structured application logs
- metrics snapshots captured shortly after the request

## Admin error response shape

Admin write routes return a stable JSON error envelope:

```json
{
  "error": "invalid_customer",
  "category": "validation",
  "message": "customerId is required"
}
```

Current `category` values:

- `validation`: payload shape or field validation failed
- `conflict`: the requested customer id already exists
- `not_found`: the target customer does not exist
- `infrastructure`: persistence failed while writing the registry
- `unknown`: fallback bucket for uncategorized failures

## Admin audit logs

Admin writes emit two structured events:

- `admin_customer_write_succeeded`
- `admin_customer_write_failed`

Common fields:

- `action`: `create`, `update`, `rotate_token`, or `delete`
- `route`
- `method`
- `requestId`
- `customerId`
- `status`

Failure events also include:

- `error`
- `category`
- `message`

## Metrics fields

Both `/metrics` and `/admin/overview` expose admin write counters in two forms.

Flat counters:

```json
{
  "adminWrites": {
    "create:failure:validation": 3,
    "create:success:none": 1,
    "update:failure:validation": 1
  }
}
```

Nested summary:

```json
{
  "adminWriteSummary": {
    "create": {
      "failure": {
        "validation": 3
      },
      "success": {
        "none": 1
      }
    }
  }
}
```

Use `adminWrites` when you want a compact flat map for quick dashboards.
Use `adminWriteSummary` when you want direct structured access without splitting composite keys.

## Recommended checks

When an admin action fails:

1. Capture the `x-request-id` from the HTTP response.
2. Search logs for that `requestId`.
3. Check the error `category`.
4. Inspect `/admin/overview` or `/metrics` for the matching `adminWrites` and `adminWriteSummary` counters.

When repeated failures appear:

- rising `validation` counts usually mean a caller-side contract bug
- rising `conflict` counts usually mean id generation or retry logic needs work
- rising `infrastructure` counts mean the customer registry write path needs immediate attention
