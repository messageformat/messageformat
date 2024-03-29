---
title: "Messages / defaultLocale"
parent: "@messageformat/runtime"
grand_parent: API Reference
nav_exclude: true
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# Messages.defaultLocale property

Default fallback locale

**Signature:**

```typescript
get defaultLocale(): string | null;

set defaultLocale(locale: string | null);
```

## Remarks

One of [Messages.availableLocales](./runtime.messages.availablelocales.md) or `null`<!-- -->. Partial matches of language tags are supported, so e.g. with an `en` locale defined, it will be selected by `messages.defaultLocale = 'en-US'` and vice versa.

