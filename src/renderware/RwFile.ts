
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

interface RwFrame {
    rotationMatrix: number[],
    coordinatesOffset: number[],
    parentFrame: number
}

interface RwFrameListData {
    numberOfFrames: number,
    frames: Array<RwFrame>
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

    public readClumpData(): RwClumpData {
        const objectCount = this.readUint32();

        // Let's assume the following 8 bytes are paddings
        this._cursor += 8;
        return { objectCount }
    }

    public readFrameListData(): RwFrameListData {
        const numberOfFrames = this.readUint32();

        let frames = Array<RwFrame>();

        for (let i = 0; i < numberOfFrames; i++) {
            // All these could probably be moved to readFrameData()
            const rotationMatrix = [];
            for (let i = 0; i < 9; i++) {
                rotationMatrix[i] = this.readFloat();
            }

            const coordinatesOffset = [];
            for (let i = 0; i < 3; i++) {
                coordinatesOffset[i] = this.readFloat();
            }
            
            const parentFrame = this.readUint32();

            // Skip 4 bytes - not used
            this._cursor += 4;

            frames.push({ rotationMatrix, coordinatesOffset, parentFrame });
        }
        
        return { numberOfFrames, frames }
    }

    public readGeometryListData() {
        const numberOfGeometricObjects = this.readUint32();
        console.log(this.readSectionHeader());
        console.log(this.readSectionHeader());

        //this._cursor += 11576;

        //console.log(this.readSectionHeader());

        const flags = this.readUint16();
        this._cursor += 2; // Skip - not used

        console.log(flags);
        console.log(this.readUint32());
        console.log(this.readUint32());
        console.log(this.readUint32());

        // TODO: Parse ambient, specular and diffuse if version < 0x34000 here

        

        return [numberOfGeometricObjects];
    }
}