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
    animNodes: RwAnimNode[],
}

export interface RwClump {
    atomicCount: number,
    lightCount?: number,
    cameraCount?: number,
}

export interface RwAnimNode {
    boneId: number,
    bonesCount: number,
    bones: RwBone[],
}

export interface RwBone {
    boneId: number,
    boneIndex: number,
    flags: number,
}


export interface RwFrame {
    rotationMatrix: RwMatrix3,
    coordinatesOffset: RwVector3,
    parentFrame: number,
}

export interface RwFrameList {
    frameCount: number,
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
    color: RwColor,
    isTextured: boolean,
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
    vertexColorInformation: RwColor[],
    textureCoordinatesCount: number,
    textureMappingInformation: RwTextureCoordinate[][],
    hasVertices: boolean,
    hasNormals: boolean,
    triangleInformation: RwTriangle[],
    vertexInformation: RwVector3[],
    normalInformation: RwVector3[],
    boundingSphere?: RwSphere,
    materialList: RwMaterialList,
    binMesh: RwBinMesh,
    skin?: RwSkin, 
}

export interface RwGeometryList {
    geometricObjectCount: number,
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

export interface RwSkin {
    boneCount: number,
    usedBoneCount: number,
    maxWeightsPerVertex: number,
    boneVertexIndices: number[][],
    vertexWeights: number[][],
    inverseBoneMatrices: RwMatrix4[],
}

export interface RwMesh {
    materialIndex: number,
    indexCount: number,
    indices: number[],
}

export interface RwMatrix3 {
    right: RwVector3,
    up: RwVector3,
    at: RwVector3,
}

export interface RwMatrix4 {
    right: RwVector4,
    up: RwVector4,
    at: RwVector4,
    transform: RwVector4,
}

export interface RwColor {
    r: number,
    g: number,
    b: number,
    a: number,
}

export interface RwVector2 {
    x: number,
    y: number,
}

export interface RwVector3 {
    x: number,
    y: number,
    z: number,
}
export interface RwVector4 {
    x: number,
    y: number,
    z: number,
    t: number,
}

export interface RwTextureCoordinate {
    u: number,
    v: number,
}

export interface RwTriangle {
    vector: RwVector3,
    materialId: number,
}

export interface RwSphere {
    vector: RwVector3,
    radius: number,
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
        let animNodes: RwAnimNode[] = [];
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
                        case RwSections.RwAnim:
                            animNodes.push(this.readAnimNode());
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
                case RwSections.RwAnim:
                    // For III / VC models
                    animNodes.push(this.readAnimNode());
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
            animNodes: animNodes,
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

        const frameCount = this.readUint32();

        let frames: RwFrame[] = [];

        for (let i = 0; i < frameCount; i++) {
            // All these could probably be moved to readFrameData()

            const rotationMatrix: RwMatrix3 = {
                right: { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() },
                up: { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() },
                at: { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() },
            }

            const coordinatesOffset: RwVector3 = { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() };

            const parentFrame = this.readInt32();

            // Skip matrix creation internal flags
            // They are read by the game but are not used
            this.skip(4);

            frames.push({ rotationMatrix, coordinatesOffset, parentFrame });
        }

        return { frameCount, frames };
    }

    public readGeometryList(): RwGeometryList {
        const header = this.readSectionHeader();

        const geometricObjectCount = this.readUint32();

        let geometries: RwGeometry[] = [];

        for (let i = 0; i < geometricObjectCount; i++) {
            this.readSectionHeader();
            this.readSectionHeader();
            const geometryData = this.readGeometry(header.versionNumber);
            geometries.push(geometryData);
        }

        return { geometricObjectCount, geometries };
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

        const vertexColorInformation: RwColor[] = [];
        const textureMappingInformation: RwTextureCoordinate[][] = [];
        const triangleInformation: RwTriangle[] = [];

        // Geometry is marked as prelit
        if (isGeometryPrelit) {
            for (let i = 0; i < vertexCount; i++) {
                vertexColorInformation[i] = { r: this.readUint8(), g: this.readUint8(), b: this.readUint8(), a: this.readUint8() };
            }
        }

        // Geometry either has first or second texture
        if (isTexturedUV1 || isTexturedUV2) {
            for (let textureCoordinateIndex = 0; textureCoordinateIndex < textureCoordinatesCount; textureCoordinateIndex++) {
                textureMappingInformation[textureCoordinateIndex] = [];
                for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
                    textureMappingInformation[textureCoordinateIndex][vertexIndex] = { u: this.readFloat(), v: this.readFloat() };
                }
            }
        }

        for (let i = 0; i < triangleCount; i++) {
            // Information is written in this order
            const vertex2 = this.readUint16();
            const vertex1 = this.readUint16();
            const materialId = this.readUint16();
            const vertex3 = this.readUint16();
            triangleInformation[i] = { vector: { x: vertex1, y: vertex2, z: vertex3 }, materialId: materialId }
        }

        // We are sure that there's only one morph target, but if
        // we are wrong, we have to loop these through morphTargetCount

        const boundingSphere: RwSphere = {
            vector: { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() },
            radius: this.readFloat(),
        };

        const hasVertices = !!this.readUint32();
        const hasNormals = !!this.readUint32();

        const vertexInformation = [];
        if (hasVertices) {
            for (let i = 0; i < vertexCount; i++) {
                vertexInformation[i] = { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() };
            }
        }

        const normalInformation = [];
        if (hasNormals) {
            for (let i = 0; i < vertexCount; i++) {
                normalInformation[i] = { x: this.readFloat(), y: this.readFloat(), z: this.readFloat() };
            }
        }

        let materialList = this.readMaterialList();
        let sectionSize = this.readSectionHeader().sectionSize;
        let position = this.getPosition();
        let binMesh = this.readBinMesh();
        let skin = undefined;

        if (this.readSectionHeader().sectionType == RwSections.RwSkin) {
            skin = this.readSkin(vertexCount);
        }

        this.setPosition(position + sectionSize);

        return {
            textureCoordinatesCount,
            textureMappingInformation,
            boundingSphere,
            hasVertices,
            hasNormals,
            vertexColorInformation,
            vertexInformation,
            normalInformation,
            triangleInformation,
            materialList,
            binMesh,
            skin, 
        };
    }

    public readBinMesh(): RwBinMesh {
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

    public readSkin(vertexCount : number): RwSkin {                                                                                
        const boneCount = this.readUint8();
        const usedBoneCount = this.readUint8();
        const maxWeightsPerVertex = this.readUint8();

        this.skip(1);               // Padding
        this.skip(usedBoneCount);   // Skipping special indices

        const boneVertexIndices: number[][] = [];                  
        const vertexWeights: number[][] = [];     
        const inverseBoneMatrices: RwMatrix4[] = [];     

        for (let i = 0; i < vertexCount; i++) {
            const indices: number[] = [];
            for (let j = 0; j < 4; j++) {
                indices.push(this.readUint8());
            }
            boneVertexIndices.push(indices);
         }

        for (let i = 0; i < vertexCount; i++) {
            const weights: number[] = [];
            for(let j = 0; j < 4; j++) {
                weights.push(this.readFloat());
            }
            vertexWeights.push(weights);
         }

        for (let i = 0; i < boneCount; i++) {
            const matrix4x4: RwMatrix4 = {
                right: { x: this.readFloat(), y: this.readFloat(), z: this.readFloat(), t: this.readFloat() },
                up: { x: this.readFloat(), y: this.readFloat(), z: this.readFloat(), t: this.readFloat() },
                at: { x: this.readFloat(), y: this.readFloat(), z: this.readFloat(), t: this.readFloat() },
                transform: { x: this.readFloat(), y: this.readFloat(), z: this.readFloat(), t: this.readFloat() },
            };
            
            inverseBoneMatrices.push(matrix4x4);
         }

        return {
            boneCount,
            usedBoneCount,
            maxWeightsPerVertex,
            boneVertexIndices,
            vertexWeights,
            inverseBoneMatrices,
        }                                                           
    }

    public readAnimNode() :RwAnimNode {
        this.skip(4);          // Skipping AnimVersion property (0x100)
        const boneId = this.readInt32();
        const boneCount = this.readInt32();
        const bones :RwBone[] = [];

        if(boneId == 0) {
            this.skip(8);           // Skipping flags and keyFrameSize properties
           }

        if (boneCount > 0) {
            for(let i = 0; i < boneCount; i++){
                bones.push({
                    boneId: this.readInt32(),
                    boneIndex: this.readInt32(),
                    flags: this.readInt32()
                });
            }
        }

        return {
            boneId: boneId,
            bonesCount: boneCount,
            bones: bones
        }
    } 

    public readMesh(): RwMesh {
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

    public readMaterialList(): RwMaterialList {
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

    public readMaterial(): RwMaterial {
        this.readSectionHeader();
        const header = this.readSectionHeader();

        // Flags - not used
        this.skip(4);

        const color: RwColor = { r: this.readUint8(), g: this.readUint8(), b: this.readUint8(), a: this.readUint8() };

        // Unknown - not used
        this.skip(4);

        const isTextured = this.readUint32() > 0;

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

        if (isTextured) {
            texture = this.readTexture();
        }

        // Skip various unused extensions
        this.skip(this.readSectionHeader().sectionSize);

        return { color, isTextured, ambient, specular, diffuse, texture };
    }

    public readTexture(): RwTexture {
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
