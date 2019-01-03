
import { ByteStream } from "../utils/ByteStream";
import { RwSections } from './RwSections';

// To be moved

export interface RwSectionHeader {
    sectionType: number,
    sectionSize: number,
    versionNumber: number
}

export interface RwClump {
    objectCount: number
}

export interface RwFrame {
    rotationMatrix: number[],
    coordinatesOffset: number[],
    parentFrame: number
}

export interface RwFrameList {
    numberOfFrames: number,
    frames: Array<RwFrame>
}

export interface RwTexture {
    textureFilterFlags: number,
    textureName: string
}

export interface RwMaterial {
    color: number[],
    isTextured: number,
    ambient: number,
    specular: number,
    diffuse: number,
    texture: any
}

export interface RwMaterialList {
    materialInstanceCount: number,
    materialData: Array<RwMaterial>
}

export interface RwGeometry {
    colorInformation: number[][],
    textureMappingInformation: number[][],
    faceInformation: number[][],
    boundingSphere: number[],
    hasPosition: number, hasNormals: number,
    vertexInformation: number[][],
    normalInformation: number[][],
    materialList: RwMaterialList
}

export interface RwGeometryList {
    numberOfGeometricObjects: number,
    geometries: Array<RwGeometry>
}

export interface RwAtomic {
    frameIndex: number,
    geometryIndex: number
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

    public readClump(): RwClump {
        this.readSectionHeader();
        const objectCount = this.readUint32();

        // Let's assume the following 8 bytes are paddings
        this._cursor += 8;
        return { objectCount }
    }

    public readFrameList(): RwFrameList {
        this.readSectionHeader();
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

            const parentFrame = this.readInt32();

            // Skip 4 bytes - not used
            this._cursor += 4;

            frames.push({ rotationMatrix, coordinatesOffset, parentFrame });
        }

        return { numberOfFrames, frames }
    }

    public readGeometryList(): RwGeometryList {
        this.readSectionHeader();
        const numberOfGeometricObjects = this.readUint32();

        let geometries = Array<RwGeometry>();

        for (let i = 0; i < numberOfGeometricObjects; i++) {
            this.readSectionHeader();
            this.readSectionHeader();
            const geometryData = this.readGeometry();
            geometries.push(geometryData);
        }

        return { numberOfGeometricObjects, geometries }
    }

    public readGeometry(): RwGeometry {
        const flags = this.readUint16();
        const textureCoordinatesCount = this.readUint8();
        const nativeGeometryFlags = this.readUint8();
        const triangleCount = this.readUint32();
        const vertexCount = this.readUint32();
        const morphTargetCount = this.readUint32();
        // TODO: Parse ambient, specular and diffuse if version < 0x34000 here
        /*
        const ambient = this.readFloat();
        const specular = this.readFloat();
        const diffuse = this.readFloat();
        */

        const triangleStrip = (flags & (1 << 0)) !== 0;
        const includesVertex = (flags & (1 << 1)) !== 0;
        const includesUVs = (flags & (1 << 2)) !== 0;
        const includesColors = (flags & (1 << 3)) !== 0;
        const includesNormals = (flags & (1 << 4)) !== 0;
        const geometryLit = (flags & (1 << 5)) !== 0;
        const modulateMaterialColor = (flags & (1 << 6)) !== 0;
        const multipleUVSets = (flags & (1 << 7)) !== 0;

        const colorInformation = [];
        const textureMappingInformation = [];
        const faceInformation = [];

        if (includesColors) { // Vertex Prelit
            for (let i = 0; i < vertexCount; i++) {
                colorInformation[i] = [] as number[];
                // R, G, B, A
                colorInformation[i][0] = this.readUint8();
                colorInformation[i][1] = this.readUint8();
                colorInformation[i][2] = this.readUint8();
                colorInformation[i][3] = this.readUint8();
            }
        }

        if (includesUVs || multipleUVSets) { // Vertex Textured | Vertex Textured 2
            for (let i = 0; i < textureCoordinatesCount; i++) {
                for (let i = 0; i < vertexCount; i++) {
                    textureMappingInformation[i] = [] as number[];
                    // U, V
                    textureMappingInformation[i][0] = this.readFloat();
                    textureMappingInformation[i][1] = this.readFloat();
                }
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
        if (includesNormals) { // Vertex Normals
            for (let i = 0; i < vertexCount; i++) {
                normalInformation[i] = [] as number[];
                // X, Y, Z
                normalInformation[i][0] = this.readFloat();
                normalInformation[i][1] = this.readFloat();
                normalInformation[i][2] = this.readFloat();
            }
        }

        let materialList = this.readMaterialList();

        // Skipping extension for now
        this.skip(this.readSectionHeader().sectionSize);

        return {
            colorInformation,
            textureMappingInformation,
            faceInformation,
            boundingSphere,
            hasPosition, hasNormals,
            vertexInformation,
            normalInformation,
            materialList
        };
    }

    public readMaterialList() : RwMaterialList {
        this.readSectionHeader();
        this.readSectionHeader();
        const materialInstanceCount = this.readUint32();

        const materialIndexes = Array<number>();

        for (let i = 0; i < materialInstanceCount; i++) {
            const materialIndex = this.readInt32();
            materialIndexes.push(materialIndex);
        }

        const materialData = Array<RwMaterial>();

        for (let i = 0; i < materialInstanceCount; i++) {
            let materialIndex = materialIndexes[i];

            if (materialIndex == -1) {
                materialData.push(this.readMaterial());
            } else {
                materialData.push(materialData[materialIndex]);
            }
        }

        return { materialInstanceCount, materialData };
    }

    public readMaterial() : RwMaterial {
        this.readSectionHeader();
        this.readSectionHeader();

        // Flags - not used
        this.skip(4);

        const color = [];
        color[0] = this.readUint8();
        color[1] = this.readUint8();
        color[2] = this.readUint8();
        color[3] = this.readUint8();

        // Unknown - not used
        this.skip(4);

        const isTextured = this.readUint32();

        // TODO: if version > 0x30400
        const ambient = this.readFloat();
        const specular = this.readFloat();
        const diffuse = this.readFloat();

        let texture = null;

        if (isTextured > 0) {
            texture = this.readTexture();
        }

        // Skipping extension for now
        this.skip(this.readSectionHeader().sectionSize);

        return { color, isTextured, ambient, specular, diffuse, texture };
    }

    public readTexture() : RwTexture {
        this.readSectionHeader();
        this.readSectionHeader();

        const textureFilterFlags:number = this.readUint16();
        // Unknown - not used
        this.skip(2);

        let nameSize = this.readSectionHeader().sectionSize;
        const textureName:string = this.readString(nameSize);

        this.skip(this.readSectionHeader().sectionSize);

        // Skipping extension for now
        this.skip(this.readSectionHeader().sectionSize);

        return { textureFilterFlags, textureName };
    }

    public readAtomic(): RwAtomic {
        this.readSectionHeader();
        const frameIndex = this.readUint32();
        const geometryIndex = this.readUint32();
        // Skip unused bytes
        this.skip(8);
        return { frameIndex, geometryIndex };
    }
}
