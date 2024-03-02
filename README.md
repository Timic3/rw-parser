# RenderWare Binary Stream Parser
[![npm](https://img.shields.io/npm/v/rw-parser.svg)](https://www.npmjs.com/package/rw-parser)
[![NPM](https://img.shields.io/npm/l/rw-parser.svg)](https://github.com/Timic3/rw-parser/blob/master/LICENSE)

Parses RenderWare DFF and TXD files into usable format!

## Used in projects
- None yet

## Usage

 1. Install **rw-parser** using `npm install --save rw-parser`
 2. Import it either by using plain require:
    ```js
    const { DffParser } = require('rw-parser');
    // or
    const DffParser = require('rw-parser').DffParser;
    ```
    or ES6 syntax:
    ```js
    import { DffParser } from 'rw-parser';
    ```

The beauty of this is you can use it within browser or as a backend with Node.js!
    
**Documentation is not done yet (working on it), but you can check an example [here](https://github.com/Timic3/rw-parser/tree/master/examples).**

## Example

You can parse a DFF and TXD object with the following code:

```ts
import { DffParser, TxdParser } from 'rw-parser';

// All types are now exported in index
import type { RwDff, RwTxd } from 'rw-parser';

import { Buffer } from 'buffer';
import { readFileSync } from 'fs';

// Assuming top-level await is supported
// Can be used with browser as well
const resourceUri = 'http://localhost:5321/assets/infernus.dff';
const dffResource = (await fetch(resourceUri)).arrayBuffer();

// Pass Buffer here. If you are developing browser application, use
// a browser shim, like: https://github.com/feross/buffer
const dffParser = new DffParser(Buffer.from(dffResource));

// TXD parsing is practically same, this example just shows
// how to parse via local filesystem in Node
const txdResource = readFileSync('./assets/infernus.txd');
const txdParser = new TxdParser(txdResource);

// Parse TXD and DFF, which will return parsed structure
const txd: RwTxd = txdParser.parse();
const dff: RwDff = dffParser.parse();
```

## Development

 1. Clone the repository or download the source code [here](https://github.com/Timic3/rw-parser/archive/master.zip)
 2. Install dependencies using `npm install`
 3. Compile TypeScript source files using `tsc`
 4. Run parser using `node .`

Optionally, you may set up a task that watches for file changes: `tsc -p tsconfig.json --watch` or `npm run dev`.

Please note that this project is still under heavy development. **Changes to output structure may happen, so be careful using it in production environment!** If you have any questions or problems, create an issue.
