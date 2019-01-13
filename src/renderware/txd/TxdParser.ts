import { RwFile } from '../RwFile';

const Jimp = require('jimp');
const dxt = require('dxt-js');

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
    compressed: boolean,
    mipmaps: Array<number[]>
}

export class TxdParser extends RwFile {

    constructor(stream: Buffer) {
        super(stream)
    }

    parse() {
        return {
            textureDictionary: this.readTextureDictionary()
        };
    }

    public readTextureDictionary(): RwTextureDictionary {
        this.readSectionHeader();
        this.readSectionHeader();

        const textureCount = this.readUint16();
        this.skip(2);

        let textureNatives = Array<RwTextureNative>();

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

        const platformId = this.readUint32();
        const flags = this.readUint32();

        const filterMode = (flags & 0xFF);
        const uAddressing = (flags & 0xF00) >> 8;
        const vAddressing = (flags & 0xF000) >> 12;

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

        var mipmaps = Array<any>();

        for (let i = 0; i < mipmapCount; i++) {

            const rasterSize = this.readUint32();
            const raster = this.read(rasterSize);

            if (i == 0) {
                // Raw RGBA presentation
                var raw:any;

                if (compressed || d3dFormat.includes('DXT')) {
                    raw = dxt.decompress(raster, mipWidth, mipHeight, dxt.flags[d3dFormat]);
                } else {
                    raw = Array.from(raster);
                }

                let pixels: number[][] = [];

                for (let i = 0; i < raw.length; i += 4) {
                    const chunk = raw.slice(i, i + 4);
                    pixels.push(chunk);
                }

                let jimp = new Jimp(mipWidth, mipHeight, (_ : any, image : any) => {});

                let i = 0;
                for (let x = 0; x < mipHeight; x++) {
                    for (let y = 0; y < mipWidth; y++) {
                        const hex = Jimp.rgbaToInt(pixels[i][0], pixels[i][1], pixels[i][2], pixels[i][3]);
                        i++;
                        jimp.setPixelColor(hex, y, x);
                    }
                }

                mipmaps.push([...jimp.bitmap.data]);
            }

            mipWidth /= 2;
            mipHeight /= 2;
        }

        // Skip extension
        this.skip(this.readSectionHeader().sectionSize);

        return { platformId, filterMode, uAddressing, vAddressing, textureName, maskName, rasterFormat,
            d3dFormat, width, height, depth, mipmapCount, rasterType, alpha, cubeTexture, autoMipMaps, compressed, mipmaps };
    }

}
