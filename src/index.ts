
import fs = require('fs');
import { RwFile } from './renderware/RwFile';
import { RwSections } from './renderware/RwSections';

const buffer = fs.readFileSync('./assets/bullet.dff');

const dffStream = new RwFile(buffer);

console.log('Reading DFF with byte length: ' + buffer.byteLength);

let atomics = [];
let dummies = [];
let geometryList;
let frameList;

while (dffStream._cursor < buffer.byteLength) {
    const header = dffStream.readSectionHeader();

    if (header.sectionType === 0) {
        break;
    }

    switch (header.sectionType) {
        case RwSections.RwClump:
            break;
        case RwSections.RwFrameList:
            frameList = dffStream.readFrameList();
            break;
        case RwSections.RwExtension:
            const extensionHeader = dffStream.readSectionHeader();
            if (extensionHeader.sectionType !== RwSections.RwFrame) {
                // Not a string - skip
                dffStream.skip(extensionHeader.sectionSize);
            } else {
                dummies.push(dffStream.readString(extensionHeader.sectionSize));
            }
            break;
        case RwSections.RwGeometryList:
            geometryList = dffStream.readGeometryList();
            break;
        case RwSections.RwAtomic:
            const atomic = dffStream.readAtomic();
            atomics[atomic.geometryIndex] = atomic.frameIndex;
            break;
        default:
            // console.log(`Section type ${header.sectionType} not found. Skipping ${header.sectionSize} bytes.`);
            dffStream.skip(header.sectionSize);
            break;
    }
}

console.log(JSON.stringify(dummies));
console.log(JSON.stringify(atomics));
console.log(JSON.stringify(frameList));
console.log(JSON.stringify(geometryList));
