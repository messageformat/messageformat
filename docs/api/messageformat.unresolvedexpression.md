---
title: "UnresolvedExpression"
parent: "messageformat"
grand_parent: API Reference
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# UnresolvedExpression class

Declarations aren't resolved until they're requierd, and their resolution order matters for variable resolution. This internal class is used to store any required data, and to allow for `instanceof` detection. 

**Signature:**

```typescript
export declare class UnresolvedExpression 
```

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(expression, scope)](./messageformat.unresolvedexpression._constructor_.md) |  | Constructs a new instance of the <code>UnresolvedExpression</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [expression](./messageformat.unresolvedexpression.expression.md) |  | [Expression](./messageformat.expression.md) |  |
|  [scope](./messageformat.unresolvedexpression.scope.md) |  | Context\['scope'\] |  |
