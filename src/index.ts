
import fs = require('fs');
import { RwFile } from './renderware/RwFile';

const buffer = fs.readFileSync('./assets/infernus2.dff');

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
const frameListData = dffStream.readFrameListData();
console.log(frameListData);

// Components presumably
for (let i = 0; i < frameListData.numberOfFrames; i++) {
    // + RwExtension
    console.log(dffStream.readSectionHeader());
    // ++ RwFrame
    const node = dffStream.readSectionHeader();
    console.log(node);
    console.log(dffStream.readString(node.sectionSize));
}

// RwGeometryList
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
console.log(dffStream.readGeometryListData());