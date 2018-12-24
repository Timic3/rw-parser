
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

interface RwGeometry {
    colorInformation: number[][],
    textureMappingInformation: number[][],
    faceInformation: number[][],
    boundingSphere: number[],
    hasPosition: number, hasNormals: number,
    vertexInformation: number[][],
    normalInformation: number[][]
}

interface RwGeometryListData {
    numberOfGeometricObjects: number,
    geometryData: RwGeometry
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

    public readGeometryListData(): RwGeometryListData {
        const numberOfGeometricObjects = this.readUint32();
        console.log(this.readSectionHeader());
        console.log(this.readSectionHeader());

        const geometryData = this.readGeometryData();

        return {
            numberOfGeometricObjects, geometryData
        };
    }

    public readGeometryData(): RwGeometry {
        const flags = this.readUint32();
        const triangleCount = this.readUint32();
        const vertexCount = this.readUint32();
        const morphTargetCount = this.readUint32();

        // TODO: Parse ambient, specular and diffuse if version < 0x34000 here
        /*
        const ambient = this.readFloat();
        const specular = this.readFloat();
        const diffuse = this.readFloat();
        */

        const colorInformation = [];
        const textureMappingInformation = [];
        const faceInformation = [];

        if ((flags & 0x01000000) == 0) {
            if ((flags & 0x08) != 0) { // Vertex Prelit
                for (let i = 0; i < vertexCount; i++) {
                    colorInformation[i] = [] as number[];
                    // R, G, B, A
                    colorInformation[i][0] = this.readUint8();
                    colorInformation[i][1] = this.readUint8();
                    colorInformation[i][2] = this.readUint8();
                    colorInformation[i][3] = this.readUint8();
                }
            }

            if ((flags & (0x04 | 0x00000080)) != 0) { // Vertex Textured | Vertex Textured 2
                for (let i = 0; i < vertexCount; i++) {
                    textureMappingInformation[i] = [] as number[];
                    // U, V
                    textureMappingInformation[i][0] = this.readFloat();
                    textureMappingInformation[i][1] = this.readFloat();
                }
            }

            for (let i = 0; i < triangleCount; i++) {
                faceInformation[i] = [] as number[];
                // Vertex 2, Vertex 1, Material ID / Flags, Vertex 3
                faceInformation[i][0] = this.readUint16();
                faceInformation[i][1] = this.readUint16();
                faceInformation[i][2] = this.readUint16();
                faceInformation[i][3] = this.readUint16();
            }
        }

        // TODO: Repeat according to morphTargetCount

        const boundingSphere = []
        // X, Y, Z, Radius
        boundingSphere[0] = this.readFloat();
        boundingSphere[1] = this.readFloat();
        boundingSphere[2] = this.readFloat();
        boundingSphere[3] = this.readFloat();

        const hasPosition = this.readUint32();
        const hasNormals = this.readUint32();

        const vertexInformation = [];
        for (let i = 0; i < vertexCount; i++) {
            vertexInformation[i] = [] as number[];
            // X, Y, Z
            vertexInformation[i][0] = this.readFloat();
            vertexInformation[i][1] = this.readFloat();
            vertexInformation[i][2] = this.readFloat();
        }

        const normalInformation = [];
        if ((flags & 0x10) != 0) { // Vertex Normals
            for (let i = 0; i < vertexCount; i++) {
                normalInformation[i] = [] as number[];
                // X, Y, Z
                normalInformation[i][0] = this.readFloat();
                normalInformation[i][1] = this.readFloat();
                normalInformation[i][2] = this.readFloat();
            }
        }

        return {
            colorInformation,
            textureMappingInformation,
            faceInformation,
            boundingSphere,
            hasPosition, hasNormals,
            vertexInformation,
            normalInformation
        };
    }

    public readMaterialListData() {
        const materialInstanceCount = this.readUint32();
        for (let i = 0; i < materialInstanceCount; i++) {
            // TODO: Store material instances accordingly
            this._cursor += 4;
        }
        console.log(this.readSectionHeader());
        console.log(this.readSectionHeader());

        const materialData = this.readMaterialData();

        return [materialInstanceCount, materialData];
    }

    public readMaterialData() {
        // Flags - not used
        this._cursor += 4;

        const color = [];
        color[0] = this.readUint8();
        color[1] = this.readUint8();
        color[2] = this.readUint8();
        color[3] = this.readUint8();

        // Unknown - not used
        this._cursor += 4;

        const isTextured = this.readUint32();

        // TODO: if version > 0x30400
        const ambient = this.readFloat();
        const specular = this.readFloat();
        const diffuse = this.readFloat();

        return [color, isTextured, ambient, specular, diffuse];
    }

    public readTextureData() {
        const textureFilterFlags = this.readUint16();
        // Unknown - not used
        this._cursor += 2;
        return textureFilterFlags;
    }
}