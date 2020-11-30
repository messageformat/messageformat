---
title: "Messages / hasObject"
parent: "@messageformat/runtime"
grand_parent: API Reference
nav_exclude: true
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# Messages.hasObject() method

Check if `key` is a message object for the locale

<b>Signature:</b>

```typescript
hasObject(key: string | string[], locale?: string, fallback?: boolean): boolean;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  key | string \| string\[\] | The key or keypath being sought |
|  locale | string | If empty or undefined, defaults to <code>this.locale</code> |
|  fallback | boolean | If true, also checks fallback locales |

<b>Returns:</b>

boolean

## Remarks

`key` may be a `string` for functions at the root level, or `string[]` for accessing hierarchical objects. If an exact match is not found and `fallback` is true, the fallback locales are checked for the first match.
