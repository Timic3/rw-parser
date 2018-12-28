
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
console.log(JSON.stringify(frameListData));

// Components presumably
for (let i = 0; i < frameListData.numberOfFrames; i++) {
    // + RwExtension
    console.log(dffStream.readSectionHeader());
    // ++ RwFrame
    const node = dffStream.readSectionHeader();
    console.log(node);
    console.log(dffStream.readString(node.sectionSize));
}

console.log(dffStream.readSectionHeader());
console.log(dffStream.readSectionHeader());
dffStream.readGeometryListData();

const atomics = [];
for (let i = 0; i < 15; i++) {
    dffStream.readSectionHeader();
    dffStream.readSectionHeader();
    const atomic = dffStream.readAtomic();
    atomics[atomic.geometryIndex] = atomic.frameIndex;
    
    const unk = dffStream.readSectionHeader();
    dffStream._cursor += unk.sectionSize;
}

console.log(JSON.stringify(atomics));

//console.log(dffStream.readSectionHeader());
//console.log(dffStream.readSectionHeader());

let unk = dffStream.readSectionHeader();
dffStream._cursor += unk.sectionSize;
// End

/*
// RwGeometryList
console.log(dffStream.readSectionHeader());
// + RwStruct
console.log(dffStream.readSectionHeader());
// ++ Data
*/

// Tyre
/*const geoList = dffStream.readSectionHeader();
console.log(geoList);
console.log(dffStream.readSectionHeader());
console.log(dffStream.readUint32());
const tyre = dffStream.readSectionHeader();
console.log(tyre);
dffStream._cursor += tyre.sectionSize;

let unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);

console.log(dffStream.readSectionHeader());
const startCursor = dffStream._cursor;
console.log(JSON.stringify(dffStream.readGeometryData()));
console.log(dffStream._cursor - startCursor);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

unk = dffStream.readSectionHeader();
console.log(unk);
dffStream._cursor += unk.sectionSize;

console.log(dffStream.readSectionHeader());
console.log(dffStream.readSectionHeader());

const startCursor = dffStream._cursor;
console.log(JSON.stringify(dffStream.readGeometryData()));
//dffStream.readGeometryData();
console.log(dffStream._cursor - startCursor);*/
/*console.log(dffStream._cursor);
dffStream.readGeometryData();
console.log(dffStream._cursor);
console.log(dffStream.readSectionHeader());*/

//console.log(dffStream.readGeometryListData());

/*dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 40;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 40;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 8;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 4;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
dffStream._cursor += 76;
console.log(dffStream.readSectionHeader());
console.log(dffStream.readSectionHeader());*/

/* RwMaterialList
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
dffStream._cursor += 24; // Skip for now*/