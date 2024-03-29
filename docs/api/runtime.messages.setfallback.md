---
title: "Messages / setFallback"
parent: "@messageformat/runtime"
grand_parent: API Reference
nav_exclude: true
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# Messages.setFallback() method

Set the fallback locale or locales for `lc`

**Signature:**

```typescript
setFallback(lc: string, fallback: string[] | null): this;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  lc | string |  |
|  fallback | string\[\] \| null |  |

**Returns:**

this

## Remarks

To disable fallback for the locale, use `setFallback(lc, [])`<!-- -->. To use the default fallback, use `setFallback(lc, null)`<!-- -->.

