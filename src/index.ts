
import fs = require('fs');
import { RwFile } from './renderware/RwFile';

const buffer = fs.readFileSync('./assets/infernus.dff');

const dffStream = new RwFile(buffer);

// RwClump
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
console.log(dffStream.readClumpData());

// RwFrameList
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
console.log(dffStream.readFrameData());