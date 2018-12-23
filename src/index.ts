
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

// RwMaterialList
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
console.log(dffStream.readMaterialListData());
// + RwExtension
console.log(dffStream.readSectionHeader());
// ++ RwReflectionMaterial
console.log(dffStream.readSectionHeader());
dffStream._cursor += 24; // Skip for now

// RwMaterial - Got to somehow seperate readMaterial and readMaterialListData
//console.log(dffStream.readMaterialListData());

// RwMaterial
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
console.log(dffStream.readMaterialData());

// RwTexture
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
console.log(dffStream.readTextureData());
// + RwString
let header = dffStream.readSectionHeader();
console.log(header);
console.log(dffStream.readString(header.sectionSize));
// + RwString
header = dffStream.readSectionHeader();
console.log(header);
console.log(dffStream.readString(header.sectionSize));

// + RwExtension
console.log(dffStream.readSectionHeader()); // Empty
// + RwExtension
console.log(dffStream.readSectionHeader());
// ++ RwReflectionMaterial
console.log(dffStream.readSectionHeader());
dffStream._cursor += 24; // Skip for now

// RwMaterial
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
console.log(dffStream.readMaterialData());

// RwTexture
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
console.log(dffStream.readTextureData());

// + RwString
header = dffStream.readSectionHeader();
console.log(header);
console.log(dffStream.readString(header.sectionSize));

// + RwString
header = dffStream.readSectionHeader();
console.log(header);
console.log(dffStream.readString(header.sectionSize));

// + RwExtension
console.log(dffStream.readSectionHeader()); // Empty
// + RwExtension
console.log(dffStream.readSectionHeader());
// ++ RwReflectionMaterial
console.log(dffStream.readSectionHeader());
dffStream._cursor += 24; // Skip for now