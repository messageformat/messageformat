Messageformat is an [OpenJS Foundation](https://openjsf.org) project, and we follow its [Code of Conduct](https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md).

## Features

- Handles arbitrary nesting of pluralization and select rules
- Supports all ~466 languages included in the Unicode CLDR
- Works on the server and the client
- Remarkably useful even for single-language use
- Speed & efficiency: Can pre-compile messages to JavaScript code
  - Great for speed: message formatting is just string concatenation
- Compatible with other MessageFormat implementations
- Extendable with custom formatting functions
- Very whitespace tolerant
- Supports Unicode, including RTL and mixed LTR/RTL strings

## License

You may use this software under the MIT License:

> Copyright OpenJS Foundation and contributors, <https://openjsf.org/>
>
> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> "Software"), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:
>
> The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
> LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
> OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
> WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Contributor License Agreement

We require all code contributions to be covered under the OpenJS Foundation's [Contributor License Agreement](https://js.foundation/CLA/). This can be done electronically and essentially ensures that you are making it clear that your contributions are your contributions and that you have the legal right to contribute them under our MIT license. If you've not previously signed the CLA, our bot will provide you with instructions for how to do so.

## Core Contributors

- Alex Sexton - [@SlexAxton](http://twitter.com/SlexAxton) - [alexsexton.com](http://alexsexton.com/)
- Eemeli Aro - [@eemeli_aro](http://twitter.com/eemeli_aro) - [github.com/eemeli](https://github.com/eemeli)

## Credits

Thanks to:

- [Vincit](https://vincit.fi/en/) - Eemeli's current employer - for letting him do cool stuff like this.
- [Bazaarvoice](https://github.com/Bazaarvoice) - Alex's previous employer - for letting him do cool stuff like this.
- Google has an implementation that is similar in Google Closure, the code has been vetted against many of their tests.
- Norbert Lindenberg for showing Alex how good it can be.
