/// <reference types="node" />
declare module "utils/ByteStream" {
    export class ByteStream {
        _cursor: number;
        _stream: Buffer;
        constructor(stream: Buffer);
        readUint8(): number;
        readUint16(): number;
        readUint32(): number;
        readInt32(): number;
        readFloat(): number;
        readString(size: number): string;
        getPosition(): number;
        setPosition(position: number): void;
        skip(size: number): void;
    }
}
declare module "renderware/RwSections" {
    export enum RwSections {
        RwStruct = 1,
        RwString = 2,
        RwExtension = 3,
        RwTexture = 6,
        RwMaterial = 7,
        RwMaterialList = 8,
        RwFrameList = 14,
        RwGeometry = 15,
        RwClump = 16,
        RwAtomic = 20,
        RwGeometryList = 26,
        RwMaterialEffectsPLG = 288,
        RwReflectionMaterial = 39056124,
        RwFrame = 39056126,
    }
}
declare module "renderware/RwFile" {
    import { ByteStream } from "utils/ByteStream";
    export interface RwSectionHeader {
        sectionType: number;
        sectionSize: number;
        versionNumber: number;
    }
    export interface RwClump {
        objectCount: number;
    }
    export interface RwFrame {
        rotationMatrix: number[];
        coordinatesOffset: number[];
        parentFrame: number;
    }
    export interface RwFrameList {
        numberOfFrames: number;
        frames: Array<RwFrame>;
    }
    export interface RwTexture {
        textureFilterFlags: number;
        textureName: string;
    }
    export interface RwMaterial {
        color: number[];
        isTextured: number;
        ambient: number;
        specular: number;
        diffuse: number;
        texture: any;
    }
    export interface RwMaterialList {
        materialInstanceCount: number;
        materialData: Array<RwMaterial>;
    }
    export interface RwGeometry {
        colorInformation: number[][];
        textureMappingInformation: number[][];
        faceInformation: number[][];
        boundingSphere: number[];
        hasPosition: number;
        hasNormals: number;
        vertexInformation: number[][];
        normalInformation: number[][];
        materialList: RwMaterialList;
    }
    export interface RwGeometryList {
        numberOfGeometricObjects: number;
        geometries: Array<RwGeometry>;
    }
    export interface RwAtomic {
        frameIndex: number;
        geometryIndex: number;
    }
    export class RwFile extends ByteStream {
        constructor(stream: Buffer);
        readSectionHeader(): RwSectionHeader;
        readClump(): RwClump;
        readFrameList(): RwFrameList;
        readGeometryList(): RwGeometryList;
        readGeometry(): RwGeometry;
        readMaterialList(): RwMaterialList;
        readMaterial(): RwMaterial;
        readTexture(): RwTexture;
        readAtomic(): RwAtomic;
    }
}
declare module "index" {
}
