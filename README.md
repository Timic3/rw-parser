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
**Documentation is not done yet (working on it), but you can check an example [here](https://github.com/Timic3/rw-parser/tree/master/examples).**

## Development

 1. Clone the repository or download the source code [here](https://github.com/Timic3/rw-parser/archive/master.zip)
 2. Install dependencies using `npm install`
 3. Compile TypeScript source files using `tsc`
 4. Run parser using `node .`

Optionally, you may set up a task that watches for file changes: `tsc -p tsconfig.json --watch`.

Please note that this project is still under heavy development. If you have any questions or problems, create an issue.
