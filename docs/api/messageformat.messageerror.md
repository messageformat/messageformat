---
title: "MessageError"
parent: "messageformat"
grand_parent: API Reference
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# MessageError class

> This API is provided as a beta preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Base error class used by MessageFormat

**Signature:**

```typescript
export declare class MessageError extends Error 
```
**Extends:** Error

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(type, message)](./messageformat.messageerror._constructor_.md) |  | **_(BETA)_** Constructs a new instance of the <code>MessageError</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [type](./messageformat.messageerror.type.md) |  | 'missing-func' \| 'not-formattable' \| typeof [MessageResolutionError.prototype.type](./messageformat.messageresolutionerror.type.md) \| typeof [MessageSelectionError.prototype.type](./messageformat.messageselectionerror.type.md) \| typeof [MessageSyntaxError.prototype.type](./messageformat.messagesyntaxerror.type.md) | **_(BETA)_** |

