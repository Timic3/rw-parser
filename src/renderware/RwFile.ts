import { ByteStream } from "../utils/ByteStream";

export interface RwSectionHeader {
    sectionType: number,
    sectionSize: number,
    versionNumber: number
}

export class RwFile extends ByteStream {

    constructor(stream: Buffer) {
        super(stream);
    }

    public readSectionHeader(): RwSectionHeader {
        const sectionType = this.readUint32();
        const sectionSize = this.readUint32();
        const versionNumber = this.readUint32();

        return { sectionType, sectionSize, versionNumber }
    }

}