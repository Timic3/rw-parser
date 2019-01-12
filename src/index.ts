import fs = require('fs');
import { DffParser } from './renderware/dff/DffParser';
import { TxdParser } from './renderware/txd/TxdParser';

let dff = new DffParser('./assets/copcarla.dff').parse();
let txd = new TxdParser('./assets/copcarla.txd').parse();

//console.log(txd);

let output = JSON.stringify({model: dff, textures: txd});

if (!fs.existsSync("output")) {
    fs.mkdirSync("output");
}

fs.writeFile('output/model.json', output, function(error) { if (error != null) { console.log(error); } });
