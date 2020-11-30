---
title: "ParseOptions / ordinal"
parent: "@messageformat/parser"
grand_parent: API Reference
nav_exclude: true
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# ParseOptions.ordinal property

Array of valid plural categories for the current locale, used to validate `selectordinal` keys.

If undefined, the full set of valid [PluralCategory](./parser.pluralcategory.md) keys is used. To disable this check, pass in an empty array.

<b>Signature:</b>

```typescript
ordinal?: PluralCategory[];
```