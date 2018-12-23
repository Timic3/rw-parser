
import { ByteStream } from "../utils/ByteStream";

// To be moved

interface RwSectionHeader {
    sectionType: number,
    sectionSize: number,
    versionNumber: number
}

interface RwClumpData {
    objectCount: number
}

interface RwFrameListData {
    numberOfFrames: number
}

export class RwFile extends ByteStream {

    constructor(stream: Uint8Array) {
        super(stream);
    }

    public readSectionHeader(): RwSectionHeader {
        const sectionType = this.readUint32();
        const sectionSize = this.readUint32();
        const versionNumber = this.readUint32();
        return { sectionType, sectionSize, versionNumber };
    }

    public readClumpData(): RwClumpData {
        const objectCount = this.readUint32();
        // Let's assume the following 8 bytes are paddings
        this._cursor += 8;
        return { objectCount }
    }

    public readFrameData(): RwFrameListData {
        const numberOfFrames = this.readUint32();
        return { numberOfFrames }
    }
}