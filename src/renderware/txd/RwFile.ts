
const dxt = require('dxt-js');
const fs = require('fs');
import { ByteStream } from "../../utils/ByteStream";
import { RwSections } from '../RwSections';

// To be moved

export interface RwSectionHeader {
    sectionType: number,
    sectionSize: number,
    versionNumber: number
}

export interface RwTextureDictionary {
    textureCount: number,
    textureNatives: Array<RwTextureNative>
}

export interface RwTextureNative {
    platformId: number,
    filterMode: number,
    uAddressing: number,
    vAddressing: number,
    textureName: string,
    maskName: string,
    rasterFormat: number,
    d3dFormat: string,
    width: number,
    height: number,
    depth: number,
    mipmapCount: number,
    rasterType: number,
    alpha: boolean,
    cubeTexture: boolean,
    autoMipMaps: boolean,
    compressed: boolean
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

    public readTextureDictionary() : RwTextureDictionary {
        this.readSectionHeader();
        this.readSectionHeader();

        const textureCount = this.readUint16();
        this.skip(2);

        let textureNatives = Array<RwTextureNative>();

        for (let i = 0; i < 1; i++) {
            let textureNative = this.readTextureNative();
            textureNatives.push(textureNative);

            console.log(textureNative);
        }

        // Skip unused extension
        this.skip(this.readSectionHeader().sectionSize);

        return { textureCount, textureNatives };
    }

    public readTextureNative() : RwTextureNative {
        this.readSectionHeader();
        this.readSectionHeader();

        const platformId = this.readUint32();
        const flags = this.readUint32();

        const filterMode = (flags & 0xFF000000) >> 24;
        const uAddressing = (flags & 0xF000000) >> 20;
        const vAddressing = (flags & 0xF0000) >> 16;

        const textureName = this.readString(32);
        const maskName = this.readString(32);

        const rasterFormat = this.readUint32();

        const d3dFormat = this.readString(4);
        const width = this.readUint16();
        const height = this.readUint16();
        const depth = this.readUint8();
        const mipmapCount = this.readUint8();
        const rasterType = this.readUint8();

        const isPAL4 = rasterType & 0x4000;
        const isPAL8 = rasterType & 0x2000;

        const compressionFlags = this.readUint8();

        const alpha = (compressionFlags & (1 << 0)) !== 0;
        const cubeTexture = (compressionFlags & (1 << 1)) !== 0;
        const autoMipMaps = (compressionFlags & (1 << 2)) !== 0;
        const compressed = (compressionFlags & (1 << 3)) !== 0;

        let mipWidth = width;
        let mipHeight = height;

        for (let i = 0; i < mipmapCount; i++) {
            mipWidth /= 2;
            mipHeight /= 2;

            const rasterSize = this.readUint32();

            console.log(rasterSize);
            console.log(mipWidth);
            console.log('+++');

            const raster = this.read(rasterSize);

            // Raw RGBA presentation
            const raw = dxt.decompress(raster, width, height, dxt.flags.DXT1);
        }

        return { platformId, filterMode, uAddressing, vAddressing, textureName, maskName, rasterFormat,
            d3dFormat, width, height, depth, mipmapCount, rasterType, alpha, cubeTexture, autoMipMaps, compressed };
    }
}
