---
title: "getNumberFormatOptions"
parent: "@messageformat/number-skeleton"
grand_parent: API Reference
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# getNumberFormatOptions() function

Given an input ICU NumberFormatter skeleton, constructs a corresponding `Intl.NumberFormat` options structure.

**Signature:**

```typescript
export declare function getNumberFormatOptions(skeleton: Skeleton, onError: (stem: string, option?: string) => void): Intl.NumberFormatOptions;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  skeleton | [Skeleton](./number-skeleton.skeleton.md) |  |
|  onError | (stem: string, option?: string) =&gt; void | Called if encountering unsupported (but valid) tokens, such as <code>decimal-always</code> or <code>precision-increment/0.05</code>. |

**Returns:**

Intl.NumberFormatOptions

## Example


```js
import {
  getNumberFormatOptions,
  parseNumberSkeleton
} from '@messageformat/number-skeleton'

const src = 'currency/CAD unit-width-narrow'
const skeleton = parseNumberSkeleton(src, console.error)
// {
//   unit: { style: 'currency', currency: 'CAD' },
//   unitWidth: 'unit-width-narrow'
// }

getNumberFormatOptions(skeleton, console.error)
// {
//   style: 'currency',
//   currency: 'CAD',
//   currencyDisplay: 'narrowSymbol',
//   unitDisplay: 'narrow'
// }

const sk2 = parseNumberSkeleton('decimal-always')
// { decimal: 'decimal-always' }

getNumberFormatOptions(sk2, console.error)
// prints: ['decimal-always']
// {}
```

