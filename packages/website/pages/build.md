Fundamentally, messageformat is a compiler that turns ICU MessageFormat input into JavaScript. While it's certainly possible to use it directly in your client code, that will mean including the full compiler in your client-side code (admittedly, just 15kB when minified & gzipped), and being okay with `new Function` being called for each message string.

The recommended alternative is to use messageformat as a compile-time tool. To that end, we provide three different sorts of solutions:

- **Webpack loaders** for JSON, .properties, gettext PO, and YAML files
- **[messageformat-cli]** for command-line use, supporting JSON and .properties files
- Our **JavaScript API**, in particular {@link MessageFormat#compile}

Compiling messages during your build will allow for a significant decrease in filesize and execution time, as all that's required to run on the client are the final compiled functions.

[webpack]: https://webpack.js.org/
[messageformat-cli]: https://www.npmjs.com/package/messageformat-cli

## Webpack loaders

Each of the loaders is similar, supporting a specific file type. Their configuration options vary slightly, depending on the common practices for the format; please see their own documentations for details:

- JSON & YAML: [messageformat-loader]
- .properties: [messageformat-properties-loader] – Format used by [Java resource bundles]
- PO files: [messageformat-po-loader] – Format used by [gettext]

[messageformat-loader]: https://www.npmjs.com/package/messageformat-loader
[messageformat-properties-loader]: https://www.npmjs.com/package/messageformat-properties-loader
[java resource bundles]: https://docs.oracle.com/javase/9/docs/api/java/util/ResourceBundle.html#getBundle-java.lang.String-java.util.Locale-java.lang.ClassLoader-
[messageformat-po-loader]: https://www.npmjs.com/package/messageformat-po-loader
[gettext]: https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html

Using [messageformat-loader] as an example, these enable a JavaScript API that looks like this:

<div class="panel panel-default">
  <div class="panel-heading">messages.json</div>
  <div class="panel-body">
    <pre class="prettyprint source lang-javascript"><code>{
  "time": "{0} took {1} ms to complete.",
  "ordinal": "The {N, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} message."
}</code></pre>
  </div>
</div>

<div class="panel panel-default">
  <div class="panel-heading">example.js</div>
  <div class="panel-body">
    <pre class="prettyprint source lang-javascript"><code>import messages from './messages.json'
messages.ordinal(['Sweeping', 42])  // 'Sweeping took 42 ms to complete.'
messages.ordinal({ N: 1 })          // 'The 1st message.'</code></pre>
  </div>
</div>

During the build, the loader will compile your messages into their respective functions, and package only those into the webpack output.

## CLI Compiler

[messageformat-cli] is available as a separate package, and is easy to integrate into any build environment that can execute external commands, such as [create-react-app]. In addition to command-line options, the CLI can read configuration from `package.json` and `messageformat.rc.json` files; see its documentation for more information.

[create-react-app]: https://github.com/facebook/create-react-app

```text
$ npm install messageformat messageformat-cli
$ npx messageformat

usage: messageformat [options] [input, ...]

Parses the input JSON and .properties files of MessageFormat strings into
a JS module of corresponding hierarchical functions. Input directories are
recursively scanned for all .json and .properties files.

  -l lc, --locale=lc
        The locale(s) lc to include; if multiple, selected by matching
        message key. If not set, path keys matching any locale code will set
        the active locale, starting with a default 'en' locale.

  -n ns, --namespace=ns
        By default, output is an ES6 module with a default export; set ns
        to support other environments. If ns does not contain a '.', the
        output follows an UMD pattern. For CommonJS module output, use
        --namespace=module.exports.

  -o of, --outfile=of
        Write output to the file of. If undefined or '-', prints to stdout

See the messageformat-cli README for more options. Configuration may also be
set in package.json or messageformat.rc.json.
```

## Using compiled messageformat output

The output of the loaders and the CLI will be a hierarchical object, made up of the non-identical file and object paths of the input. For example, the messageformat package's `example/i18n.js` sample output includes a function `en.sub.folder.plural.test()`, which was compiled from the `test` key in the source file `example/en/sub/folder/plural.json`. Obviously this is a slightly contribed example, but even in real-world use it's likely that you'll end up with a sufficient number of messages that it makes sense to split them in separate files and/or into some sort of hierarchy.

In development use, it may then prove problematic to use the messageformat compiled messages directly, as mistakes in message keys will throw errors when they are called as functions, along with errors from missing properties for messages using variables. To that end, the library includes **{@link Messages}**, a utility accessor library that helps with common usage patterns, as well as making it easier to load message data dynamically.

It works like this (using [messageformat-loader], configured for `en` and `fi` locales):

<div class="panel panel-default">
  <div class="panel-heading">messages.json</div>
  <div class="panel-body">
    <pre class="prettyprint source lang-javascript"><code>{
  "en": {
    "a": "A {TYPE} example.",
    "b": "This has {COUNT, plural, one{one user} other{# users}}.",
    "c": {
      "d": "We have {P, number, percent} code coverage."
    }
  },
  "fi": {
    "b": "Tällä on {COUNT, plural, one{yksi käyttäjä} other{# käyttäjää}}.",
    "e": "Minä puhun vain suomea."
  }
}</code></pre>
  </div>
</div>

<div class="panel panel-default">
  <div class="panel-heading">example.js</div>
  <div class="panel-body">
    <pre class="prettyprint source lang-javascript"><code>import Messages from 'messageformat-messages'
import msgData from './messages.json'
const messages = new Messages(msgData, 'en')  // sets default locale

messages.hasMessage('a') // true
messages.hasObject('c') // true
messages.get('b', { COUNT: 3 }) // 'This has 3 users.'
messages.get(['c', 'd'], { P: 0.314 }) // 'We have 31% code coverage.'

messages.get('e') // 'e'
messages.setFallback('en', ['foo', 'fi'])
messages.get('e') // 'Minä puhun vain suomea.'

messages.locale = 'fi'
messages.hasMessage('a') // false
messages.hasMessage('a', 'en') // true
messages.hasMessage('a', null, true) // true
messages.hasObject('c') // false
messages.get('b', { COUNT: 3 }) // 'Tällä on 3 käyttäjää.'
messages.get('c').d({ P: 0.628 }) // 'We have 63% code coverage.'</code></pre>

  </div>
</div>
