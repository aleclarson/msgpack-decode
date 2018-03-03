# msgpack-decode v0.0.1 

Stripped from https://github.com/creationix/msgpack-js-browser/tree/9117d0f8184f3659fe44502589d13123a7ec1209 and https://github.com/creationix/msgpack-js/tree/7e7d4350feb5aeb09d6db58c128d9a8d6e3ec0d7

- No external dependencies.
- Only decoding is included.
- Support for `undefined` is removed.

```js
const msgpack = require('msgpack-decode')

// Pass a buffer, get the decoded value.
const value = msgpack.decode(buffer)
```

### Browser

The browser version can be found in the `index.web.js` file.

The module system provided by your chosen bundler must
provide an `exports` object when wrapping this package.

You must pass an `ArrayBuffer`!

