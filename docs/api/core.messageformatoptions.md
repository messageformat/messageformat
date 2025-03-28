---
title: "MessageFormatOptions"
parent: "@messageformat/core"
grand_parent: API Reference
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->



# MessageFormatOptions interface

Options for the MessageFormat constructor

**Signature:**

```typescript
export interface MessageFormatOptions<ReturnType extends 'string' | 'values' = 'string' | 'values'> 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [biDiSupport?](./core.messageformatoptions.bidisupport.md) |  | boolean | <p>_(Optional)_ Add Unicode control characters to all input parts to preserve the integrity of the output when mixing LTR and RTL text</p><p>Default: <code>false</code></p> |
|  [currency?](./core.messageformatoptions.currency.md) |  | string | <p>_(Optional)_ The currency to use when formatting <code>{V, number, currency}</code></p><p>Default: <code>USD</code></p> |
|  [customFormatters?](./core.messageformatoptions.customformatters.md) |  | { \[key: string\]: [CustomFormatter](./core.customformatter.md) \| { formatter: [CustomFormatter](./core.customformatter.md)<!-- -->; arg?: 'string' \| 'raw' \| 'options'; id?: string; module?: string \| ((locale: string) =&gt; string); }; } | _(Optional)_ Map of custom formatting functions to include. See [Custom Formatters](https://messageformat.github.io/messageformat/custom-formatters/) for more details. |
|  [localeCodeFromKey?](./core.messageformatoptions.localecodefromkey.md) |  | ((key: string) =&gt; string \| null \| undefined) \| null | <p>_(Optional)_ If defined, used by [compileModule()](./core.compilemodule.md) to identify and map keys to the locale identifiers used by formatters and plural rules. The values returned by the function should match the <code>locale</code> argument.</p><p>Default: <code>undefined</code></p> |
|  [requireAllArguments?](./core.messageformatoptions.requireallarguments.md) |  | boolean | <p>_(Optional)_ Require all message arguments to be set with a defined value</p><p>Default: <code>false</code></p> |
|  [returnType?](./core.messageformatoptions.returntype.md) |  | ReturnType | <p>_(Optional)_ Return type of compiled functions; either a concatenated <code>'string'</code> or an array (possibly hierarchical) of <code>'values'</code>.</p><p>Default: <code>'string'</code></p> |
|  [strict?](./core.messageformatoptions.strict.md) |  | boolean | <p>_(Optional)_ Follow the ICU MessageFormat spec more closely, but not allowing custom formatters and by allowing<code>#</code> only directly within a plural or selectordinal case, rather than in any inner select case as well. See the [parser option](http://messageformat.github.io/messageformat/api/parser.parseoptions.strict/) for more details.</p><p>Default: <code>false</code></p> |
|  [strictPluralKeys?](./core.messageformatoptions.strictpluralkeys.md) |  | boolean | <p>_(Optional)_ Enable strict checks for plural keys according to [Unicode CLDR](http://cldr.unicode.org/index/cldr-spec/plural-rules)<!-- -->. When set to <code>false</code>, the compiler will also accept any invalid plural keys. Also see the corresponding [parser option](./parser.parseoptions.md)<!-- -->.</p><p>Default: <code>true</code></p> |
|  [timeZone?](./core.messageformatoptions.timezone.md) |  | string | <p>_(Optional)_ The time zone to use when formatting <code>{V, date}</code> instead of current machine time zone. Defaults to current machine time zone.</p><p>Default: <code>undefined</code></p> |

