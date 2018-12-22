
import fs = require('fs');
import { ByteStream } from './ByteStream';

// To be moved.
function readSectionHeader(stream: ByteStream) {
    const sectionType = stream.readUint32();
    const sectionSize = stream.readUint32();
    const versionNumber = stream.readUint32();
    return [sectionType, sectionSize, versionNumber.toString(16)];
}

const buffer = fs.readFileSync('../assets/infernus.dff');

const dffStream = new ByteStream(new Uint8Array(buffer));
console.log(readSectionHeader(dffStream));
console.log(readSectionHeader(dffStream));
