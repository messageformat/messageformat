# messageformat.js loader for webpack

## Dependencies

* Requires [messageformat.js](https://github.com/messageformat/messageformat.js) 1.0.0-rc.3 or higher

## Install

```
npm install messageformat-loader
```

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

[Documentation: messageformat.js](https://messageformat.github.io/)

### messages.json

```json
{
  "simple-example": "A simple message.",
  "var-example": "Message with {X}.",
  "plural-example": "You have {N, plural, =0{no messages} one{1 message} other{# messages}}.",
  "select-example": "{GENDER, select, male{He has} female{She has} other{They have}} sent you a message.",
  "ordinal-example": "The {N, selectordinal, one{1st} two{2nd} few{3rd} other{#th}} message."
}
```

### example.js

``` javascript
var messages = require('messageformat!./messages.json');
messages['ordinal-example']({ N: 1 });
// => 'The 1st message.'
```

## License

MIT
