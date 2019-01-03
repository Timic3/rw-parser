import fs = require('fs');
import { RwFile, RwGeometryList, RwFrameList } from './RwFile';
import { RwSections } from './RwSections';

export class DffParser {
    path: string = '';

    constructor(path: string) {
        this.path = path;
    }

    parse() {
        const buffer = fs.readFileSync(this.path);
        const dffStream = new RwFile(buffer);

        let atomics = [];
        let dummies = [];
        let geometryList;
        let frameList;

        while (dffStream._cursor < buffer.byteLength) {
            const header = dffStream.readSectionHeader();

            if (header.sectionType === 0) {
                break;
            }

            if (header.sectionSize == 0) {
                continue;
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

        return {
            geometryList: geometryList,
            frameList: frameList,
            atomics: atomics,
            dummies: dummies
        };
    }
}
