---
title: "MessageNumber / matchSelectKey"
parent: "messageformat"
grand_parent: API Reference
nav_exclude: true
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# MessageNumber.matchSelectKey() method

> This API is provided as a preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

In addition to matching exact values, numerical values will also match keys with the same plural rule category, i.e. one of `zero`<!-- -->, `one`<!-- -->, `two`<!-- -->, `few`<!-- -->, `many`<!-- -->, and `other`<!-- -->.

<b>Signature:</b>

```typescript
matchSelectKey(key: string): boolean;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  key | string |  |

<b>Returns:</b>

boolean

## Remarks

Different languages use different subset of plural rule categories. For example, cardinal English plurals only use `one` and `other`<!-- -->, so a key `zero` will never be matched for that locale.
