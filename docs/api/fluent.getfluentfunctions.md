---
title: "getFluentFunctions"
parent: "@messageformat/fluent"
grand_parent: API Reference
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# getFluentFunctions() function

> This API is provided as a beta preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Build a [MessageFormat](./messageformat.messageformat.md) runtime to use with Fluent messages.

**Signature:**

```typescript
export declare function getFluentFunctions(res: FluentMessageResource): {
    message: ({ locales, onError, source }: MessageFunctionContext, options: Record<string, unknown>, input?: unknown) => {
        type: "fluent-message";
        locale: string;
        source: string;
        selectKey(keys: Set<string>): string | null;
        toParts(): [{
            type: "fluent-message";
            source: string;
            parts: import("messageformat").MessagePart[];
        }];
        toString: () => string;
        valueOf: () => string;
    };
};
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  res | [FluentMessageResource](./fluent.fluentmessageresource.md) | A Map of MessageFormat instances, for use by <code>MESSAGE</code>. This Map may be passed in as initially empty, and later filled out by the caller. |

**Returns:**

{ message: ({ locales, onError, source }: MessageFunctionContext, options: Record&lt;string, unknown&gt;, input?: unknown) =&gt; { type: "fluent-message"; locale: string; source: string; selectKey(keys: Set&lt;string&gt;): string \| null; toParts(): \[{ type: "fluent-message"; source: string; parts: import("messageformat").[MessagePart](./messageformat.messagepart.md)<!-- -->\[\]; }\]; toString: () =&gt; string; valueOf: () =&gt; string; }; }

## Remarks

This builds on top of the default runtime, but uses all-caps names for the `DATETIME` and `NUMBER` message formatters. A custom function `MESSAGE` is also included to support Fluent term and message references.

