import fs = require('fs');
import { DffParser } from '../lib/renderware/dff/DffParser';
import { TxdParser } from '../lib/renderware/txd/TxdParser';

let dff = new DffParser(fs.readFileSync('./assets/copcarla.dff')).parse();
let txd = new TxdParser(fs.readFileSync('./assets/copcarla.txd')).parse();

let output = JSON.stringify({model: dff, textures: txd});

if (!fs.existsSync("output")) {
    fs.mkdirSync("output");
}

fs.writeFile('output/model.json', output, function(error) { if (error != null) { console.log(error); } });
