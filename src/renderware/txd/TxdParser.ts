import { RwFile } from '../RwFile';

const dxt = require('dxt-js');

export interface RwTxd {
    textureDictionary: RwTextureDictionary,
}

export interface RwTextureDictionary {
    textureCount: number,
    textureNatives: RwTextureNative[],
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
    compressed: boolean,
    mipmaps: number[][],
}

export class TxdParser extends RwFile {

    constructor(stream: Buffer) {
        super(stream);
    }

    parse(): RwTxd {
        return {
            textureDictionary: this.readTextureDictionary(),
        };
    }

    public readTextureDictionary(): RwTextureDictionary {
        this.readSectionHeader();
        this.readSectionHeader();

        const textureCount = this.readUint16();
        this.skip(2);

        let textureNatives: RwTextureNative[] = [];

        for (let i = 0; i < textureCount; i++) {
            let textureNative = this.readTextureNative();
            textureNatives.push(textureNative);
        }

        // Skip unused extension
        this.skip(this.readSectionHeader().sectionSize);

        return { textureCount, textureNatives };
    }

    public readTextureNative() : RwTextureNative {
        this.readSectionHeader();
        this.readSectionHeader();

        // TODO: Structure this part better
        // Texture format
        const platformId = this.readUint32();
        const flags = this.readUint32();

        const filterMode = (flags & 0xFF);
        const uAddressing = (flags & 0xF00) >> 8;
        const vAddressing = (flags & 0xF000) >> 12;

        const textureName = this.readString(32);
        const maskName = this.readString(32);

        // Raster format
        const rasterFormat = this.readUint32();

        const d3dFormat = this.readString(4);
        const width = this.readUint16();
        const height = this.readUint16();
        const depth = this.readUint8();
        const mipmapCount = this.readUint8();
        const rasterType = this.readUint8();

        const _isPAL4 = rasterType & 0x4000;
        const _isPAL8 = rasterType & 0x2000;

        const compressionFlags = this.readUint8();

        const alpha = (compressionFlags & (1 << 0)) !== 0;
        const cubeTexture = (compressionFlags & (1 << 1)) !== 0;
        const autoMipMaps = (compressionFlags & (1 << 2)) !== 0;
        const compressed = (compressionFlags & (1 << 3)) !== 0;

        let mipWidth = width;
        let mipHeight = height;

        let mipmaps: number[][] = [];

        for (let i = 0; i < mipmapCount; i++) {

            const rasterSize = this.readUint32();
            const raster = this.read(rasterSize);

            if (i == 0) {
                // Raw RGBA presentation
                let bitmap: number[];

                if (compressed || d3dFormat.includes('DXT')) {
                    bitmap = Array.from(dxt.decompress(raster, mipWidth, mipHeight, dxt.flags[d3dFormat]));
                } else {
                    // TODO: Make raster format an enum and add more formats
                    // All formats are in D3D9 color order (BGRA), so we swap them

                    switch (rasterFormat) {
                        // FORMAT_8888, depth 32 (D3DFMT_A8R8G8B8)
                        case 0x0500:
                        // FORMAT_888 (RGB 8 bits each, D3DFMT_X8R8G8B8)
                        case 0x0600:
                            for (let i = 0; i < raster.length; i += 4) {
                                // Fancy array destructuring, just swaps R and B values
                                [raster[i], raster[i + 2]] = [raster[i + 2], raster[i]];
                            }
                            break;
                    }

                    bitmap = Array.from(raster);
                }

                mipmaps.push(bitmap);
            }

            mipWidth /= 2;
            mipHeight /= 2;
        }

        // Skip extension
        this.skip(this.readSectionHeader().sectionSize);

        return {
            platformId,
            filterMode,
            uAddressing, vAddressing,
            textureName, maskName,
            rasterFormat,
            d3dFormat,
            width, height, depth,
            mipmapCount,
            rasterType,
            alpha,
            cubeTexture,
            autoMipMaps,
            compressed,
            mipmaps,
        };
    }
}
