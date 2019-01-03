import fs = require('fs');
import { DffParser } from './renderware/dff/DffParser';

let dff = new DffParser('./assets/infernus.dff').parse();

let output = JSON.stringify(dff);

if (!fs.existsSync("output")) {
    fs.mkdirSync("output");
}

fs.writeFile('output/model.json', output, function(error) { if (error != null) { console.log(error); } });
