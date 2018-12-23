
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

// + RwExtension
console.log(dffStream.readSectionHeader());
// ++ RwFrame
const node1 = dffStream.readSectionHeader();
console.log(node1);
console.log(dffStream.readString(node1.sectionSize));

// + RwExtension
console.log(dffStream.readSectionHeader());
// ++ RwFrame
const node2 = dffStream.readSectionHeader();
console.log(node2);
console.log(dffStream.readString(node2.sectionSize));