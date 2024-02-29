import { RwFile } from '../RwFile';
import { RwSections } from '../RwSections';
import { RwParseStructureNotFoundError } from '../errors/RwParseError';
import RwVersion from '../utils/RwVersion';

export interface RwDff {
    version: string,
    versionNumber: number,
    geometryList: RwGeometryList | null,
    frameList: RwFrameList | null,
    atomics: number[],
    dummies: string[],
}

export interface RwClump {
    atomicCount: number,
    lightCount?: number,
    cameraCount?: number,
}

export interface RwFrame {
    rotationMatrix: number[],
    coordinatesOffset: number[],
    parentFrame: number,
}

export interface RwFrameList {
    numberOfFrames: number,
    frames: RwFrame[],
}

export interface RwTexture {
    textureFiltering: number,
    uAddressing: number,
    vAddressing: number,
    usesMipLevels: boolean,
    textureName: string,
}

export interface RwMaterial {
    color: number[],
    isTextured: number,
    ambient?: number,
    specular?: number,
    diffuse?: number,
    texture?: RwTexture,
}

export interface RwMaterialList {
    materialInstanceCount: number,
    materialData: RwMaterial[],
}

export interface RwGeometry {
    colorInformation: number[][],
    textureCoordinatesCount: number,
    textureMappingInformation: number[][],
    faceInformation: number[][],
    boundingSphere?: number[],
    hasVertices: boolean,
    hasNormals: boolean,
    vertexInformation: number[][],
    normalInformation: number[][],
    materialList: RwMaterialList,
    binMesh: RwBinMesh,
}

export interface RwGeometryList {
    numberOfGeometricObjects: number,
    geometries: RwGeometry[],
}

export interface RwAtomic {
    frameIndex: number,
    geometryIndex: number,
    flags: number,
}

export interface RwBinMesh {
    meshCount: number,
    meshes: RwMesh[],
}

export interface RwMesh {
    materialIndex: number,
    indexCount: number,
    indices: number[],
}

export class DffParser extends RwFile {

    constructor(buffer: Buffer) {
        super(buffer);
    }

    parse(): RwDff {
        let version: string | undefined;
        let versionNumber: number | undefined;
        let atomics: number[] = [];
        let dummies: string[] = [];
        let geometryList: RwGeometryList | null = null;
        let frameList: RwFrameList | null = null;

        while (this.getPosition() < this.getSize()) {
            const header = this.readSectionHeader();

            if (header.sectionType === 0) {
                break;
            }

            if (header.sectionSize == 0) {
                continue;
            }

            switch (header.sectionType) {
                case RwSections.RwClump:
                    // Multiple clumps are used in SA player models, so we should eventually support it
                    versionNumber = RwVersion.unpackVersion(header.versionNumber);
                    version = RwVersion.versions[versionNumber];
                    break;
                case RwSections.RwFrameList:
                    frameList = this.readFrameList();
                    break;
                case RwSections.RwExtension:
                    const extensionHeader = this.readSectionHeader();
                    switch (extensionHeader.sectionType) {
                        case RwSections.RwNodeName:
                            dummies.push(this.readString(extensionHeader.sectionSize));
                            break;
                        default:
                            console.debug(`Extension type ${extensionHeader.sectionType} (${extensionHeader.sectionType.toString(16)}) not found at offset (${this.getPosition().toString(16)}). Skipping ${extensionHeader.sectionSize} bytes.`);
                            this.skip(extensionHeader.sectionSize);
                            break;
                    }
                    break;
                case RwSections.RwGeometryList:
                    geometryList = this.readGeometryList();
                    break;
                case RwSections.RwAtomic:
                    const atomic = this.readAtomic();
                    atomics[atomic.geometryIndex] = atomic.frameIndex;
                    break;
                case RwSections.RwNodeName:
                    // For some reason, this frame is outside RwExtension.
                    dummies.push(this.readString(header.sectionSize));
                    break;
                default:
                    console.debug(`Section type ${header.sectionType} (${header.sectionType.toString(16)}) not found at offset (${this.getPosition().toString(16)}). Skipping ${header.sectionSize} bytes.`);
                    this.skip(header.sectionSize);
                    break;
            }
        }

        if (!version || !versionNumber) {
            throw new RwParseStructureNotFoundError('version');
        }

        return {
            version: version,
            versionNumber: versionNumber,
            geometryList: geometryList,
            frameList: frameList,
            atomics: atomics,
            dummies: dummies,
        };
    }

    public readClump(): RwClump {
        const { versionNumber } = this.readSectionHeader();

        const atomicCount = this.readUint32();

        let lightCount;
        let cameraCount;
        if (versionNumber > 0x33000) {
            lightCount = this.readUint32();
            cameraCount = this.readUint32();
        }

        return { atomicCount, lightCount, cameraCount };
    }

    public readFrameList(): RwFrameList {
        this.readSectionHeader();

        const numberOfFrames = this.readUint32();

        let frames: RwFrame[] = [];

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
            this.skip(4);

            frames.push({ rotationMatrix, coordinatesOffset, parentFrame });
        }

        return { numberOfFrames, frames };
    }

    public readGeometryList(): RwGeometryList {
        const header = this.readSectionHeader();

        const numberOfGeometricObjects = this.readUint32();

        let geometries: RwGeometry[] = [];

        for (let i = 0; i < numberOfGeometricObjects; i++) {
            this.readSectionHeader();
            this.readSectionHeader();
            const geometryData = this.readGeometry(header.versionNumber);
            geometries.push(geometryData);
        }

        return { numberOfGeometricObjects, geometries };
    }

    public readGeometry(versionNumber: number): RwGeometry {
        const flags = this.readUint16();
        const textureCoordinatesCount = this.readUint8();
        const _nativeGeometryFlags = this.readUint8();
        const triangleCount = this.readUint32();
        const vertexCount = this.readUint32();
        const _morphTargetCount = this.readUint32();

        // Surface properties
        let _ambient;
        let _specular;
        let _diffuse;

        if (versionNumber < 0x34000) {
            _ambient = this.readFloat();
            _specular = this.readFloat();
            _diffuse = this.readFloat();
        }

        const _isTriangleStrip = (flags & (1 << 0)) !== 0;
        const _vertexTranslation = (flags & (1 << 1)) !== 0;
        const isTexturedUV1 = (flags & (1 << 2)) !== 0;
        const isGeometryPrelit = (flags & (1 << 3)) !== 0;
        const _hasNormals = (flags & (1 << 4)) !== 0;
        const _isGeometryLit = (flags & (1 << 5)) !== 0;
        const _shouldModulateMaterialColor = (flags & (1 << 6)) !== 0;
        const isTexturedUV2 = (flags & (1 << 7)) !== 0;

        const colorInformation = [];
        const textureMappingInformation = [];
        const faceInformation = [];

        // Geometry is marked as prelit
        if (isGeometryPrelit) {
            for (let i = 0; i < vertexCount; i++) {
                colorInformation[i] = [] as number[];
                // R, G, B, A
                colorInformation[i][0] = this.readUint8();
                colorInformation[i][1] = this.readUint8();
                colorInformation[i][2] = this.readUint8();
                colorInformation[i][3] = this.readUint8();
            }
        }

        // Geometry either has first or second texture
        if (isTexturedUV1 || isTexturedUV2) {
            for (let i = 0; i < textureCoordinatesCount; i++) {
                for (let j = 0; j < vertexCount; j++) {
                    textureMappingInformation[(i * vertexCount) + j] = [] as number[];
                    // U, V
                    textureMappingInformation[(i * vertexCount) + j][0] = this.readFloat();
                    textureMappingInformation[(i * vertexCount) + j][1] = this.readFloat();
                }
            }
        }

        for (let i = 0; i < triangleCount; i++) {
            faceInformation[i] = [] as number[];
            // TODO: Order this as we should
            // Vertex 2, Vertex 1, Material ID / Flags, Vertex 3
            faceInformation[i][0] = this.readUint16();
            faceInformation[i][1] = this.readUint16();
            faceInformation[i][2] = this.readUint16();
            faceInformation[i][3] = this.readUint16();
        }

        // We are sure that there's only one morph target, but if
        // we are wrong, we have to loop these through morphTargetCount

        let boundingSphere = [];

        // X, Y, Z, Radius
        boundingSphere[0] = this.readFloat();
        boundingSphere[1] = this.readFloat();
        boundingSphere[2] = this.readFloat();
        boundingSphere[3] = this.readFloat();

        const hasVertices = !!this.readUint32();
        const hasNormals = !!this.readUint32();

        const vertexInformation = [];
        if (hasVertices) {
            for (let i = 0; i < vertexCount; i++) {
                vertexInformation[i] = [] as number[];
                // X, Y, Z
                vertexInformation[i][0] = this.readFloat();
                vertexInformation[i][1] = this.readFloat();
                vertexInformation[i][2] = this.readFloat();
            }
        }

        const normalInformation = [];
        if (hasNormals) {
            for (let i = 0; i < vertexCount; i++) {
                normalInformation[i] = [] as number[];
                // X, Y, Z
                normalInformation[i][0] = this.readFloat();
                normalInformation[i][1] = this.readFloat();
                normalInformation[i][2] = this.readFloat();
            }
        }

        let materialList = this.readMaterialList();

        let sectionSize = this.readSectionHeader().sectionSize;
        let position = this.getPosition();
        let binMesh = this.readBinMesh();

        this.setPosition(position + sectionSize);

        return {
            colorInformation,
            textureCoordinatesCount,
            textureMappingInformation,
            faceInformation,
            boundingSphere,
            hasVertices,
            hasNormals,
            vertexInformation,
            normalInformation,
            materialList,
            binMesh,
        };
    }

    public readBinMesh() : RwBinMesh {
        this.readSectionHeader();

        // Flags (0: triangle list, 1: triangle strip)
        this.skip(4);

        const meshCount = this.readUint32();

        // Total number of indices
        this.skip(4);

        const meshes: RwMesh[] = [];

        for (let i = 0; i < meshCount; i++) {
            meshes.push(this.readMesh());
        }

        return {
            meshCount, meshes
        };
    }

    public readMesh() : RwMesh {
        const indexCount = this.readUint32();
        const materialIndex = this.readUint32();

        const indices: number[] = [];

        for (let i = 0; i < indexCount; i++) {
            indices.push(this.readUint32());
        }

        return {
            indexCount, materialIndex, indices
        };
    }

    public readMaterialList() : RwMaterialList {
        this.readSectionHeader();
        this.readSectionHeader();

        const materialInstanceCount = this.readUint32();
        const materialIndices: number[] = [];

        for (let i = 0; i < materialInstanceCount; i++) {
            const materialIndex = this.readInt32();
            materialIndices.push(materialIndex);
        }

        const materialData: RwMaterial[] = [];

        for (let i = 0; i < materialInstanceCount; i++) {
            let materialIndex = materialIndices[i];

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
        const header = this.readSectionHeader();

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

        // Surface properties
        let ambient;
        let specular;
        let diffuse;

        if (header.versionNumber > 0x30400) {
            ambient = this.readFloat();
            specular = this.readFloat();
            diffuse = this.readFloat();
        }

        let texture;

        if (isTextured > 0) {
            texture = this.readTexture();
        }

        // Skip various unused extensions
        this.skip(this.readSectionHeader().sectionSize);

        return { color, isTextured, ambient, specular, diffuse, texture };
    }

    public readTexture() : RwTexture {
        this.readSectionHeader();
        this.readSectionHeader();

        const textureData = this.readUint32();

        const textureFiltering = (textureData & 0xFF);
        const uAddressing = (textureData & 0xF00) >> 8;
        const vAddressing = (textureData & 0xF000) >> 12;
        const usesMipLevels = (textureData & (1 << 16)) !== 0;

        let textureNameSize = this.readSectionHeader().sectionSize;
        const textureName = this.readString(textureNameSize);

        // Skip various unused extensions
        this.skip(this.readSectionHeader().sectionSize);
        this.skip(this.readSectionHeader().sectionSize);

        return { textureFiltering, uAddressing, vAddressing, usesMipLevels, textureName };
    }

    public readAtomic(): RwAtomic {
        this.readSectionHeader();

        const frameIndex = this.readUint32();
        const geometryIndex = this.readUint32();
        const flags = this.readUint32();

        // Skip unused bytes
        this.skip(4);

        return { frameIndex, geometryIndex, flags };
    }
}
