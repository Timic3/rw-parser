import { RwFile } from '../RwFile';
import { ImageDecoder } from '../utils/ImageDecoder'
import {
    D3DFormat,
    PaletteType,
    PlatformType,
    RasterFormat
} from '../utils/ImageFormatEnums'

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

        const compressionFlags = this.readUint8(); //dxtType for III/VC

        // SA
        const alpha = (compressionFlags & (1 << 0)) !== 0;
        const cubeTexture = (compressionFlags & (1 << 1)) !== 0;
        const autoMipMaps = (compressionFlags & (1 << 2)) !== 0;
        const compressed = (compressionFlags & (1 << 3)) !== 0;

        const paletteType = (rasterFormat >> 13) & 0b11;

        let mipWidth = width;
        let mipHeight = height;

        let mipmaps: number[][] = [];

        const palette: Uint8Array = (paletteType !== PaletteType.PALETTE_NONE ? this.readPalette(paletteType, depth) : new Uint8Array(0));

        for (let i = 0; i < mipmapCount; i++) {

            const rasterSize = this.readUint32();
            const raster = this.read(rasterSize);

            if (i == 0) {
                // Raw RGBA presentation
                let bitmap: number[];

                if (0 !== palette.length) {
                    const rasterFormatsWithoutAlpha = [
                        RasterFormat.RASTER_565,
                        RasterFormat.RASTER_LUM,
                        RasterFormat.RASTER_888,
                        RasterFormat.RASTER_555
                    ];

                    const hasAlpha = ((platformId === PlatformType.D3D9 && alpha) || (platformId == PlatformType.D3D8 && !rasterFormatsWithoutAlpha.includes(rasterFormat)));

                    bitmap = Array.from(this.getBitmapWithPalette(paletteType, depth, hasAlpha, raster, palette, width, height));
                }
                else if (platformId === PlatformType.D3D8 && compressionFlags !== 0) {
                    bitmap = Array.from(this.getBitmapWithDXT('DXT' + compressionFlags, raster, width, height));
                }
                else if (platformId === PlatformType.D3D9 && compressed) {
                    bitmap = Array.from(this.getBitmapWithDXT(d3dFormat, raster, width, height));
                }
                else {
                    bitmap = Array.from(this.getBitmapWithRasterFormat(rasterFormat, raster, width, height))
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

    public readPalette(paletteType: number, depth: number): Uint8Array {
        const size = (paletteType === PaletteType.PALETTE_8 ? 1024 : (depth === 4 ? 64 : 128))

        return this.read(size);
    }

    public getBitmapWithPalette(paletteType: number, depth: number, hasAlpha: boolean, raster: Uint8Array, palette: Uint8Array, width: number, height: number): Uint8Array {
        if (paletteType !== PaletteType.PALETTE_8 && depth == 4) {
            return (hasAlpha
                    ? ImageDecoder.pal4(raster, palette, width, height)
                    : ImageDecoder.pal4NoAlpha(raster, palette, width, height)
            );
        }

        return (hasAlpha
                ? ImageDecoder.pal8(raster, palette, width, height)
                : ImageDecoder.pal8NoAlpha(raster, palette, width, height)
        )
    }

    public getBitmapWithDXT(dxtType:string, raster: Uint8Array, width: number, height: number): Uint8Array {
        switch (dxtType) {
            case D3DFormat.D3D_DXT1:
                return ImageDecoder.bc1(raster, width, height);
            case D3DFormat.D3D_DXT2:
                return ImageDecoder.bc2(raster, width, height, true);
            case D3DFormat.D3D_DXT3:
                return ImageDecoder.bc2(raster, width, height, false);
            case D3DFormat.D3D_DXT4:
                return ImageDecoder.bc3(raster, width, height, true);
            case D3DFormat.D3D_DXT5:
                return ImageDecoder.bc3(raster, width, height, false);
            // LUM8_A8 has compressed flag
            case D3DFormat.D3DFMT_A8L8:
                return ImageDecoder.lum8a8(raster, width, height);
            default:
                return new Uint8Array(0);
        }
    }

    public getBitmapWithRasterFormat (rasterFormat: number, raster: Uint8Array, width: number, height: number): Uint8Array {
        switch (rasterFormat) {
            case RasterFormat.RASTER_1555:
                return ImageDecoder.bgra1555(raster, width, height);
            case RasterFormat.RASTER_565:
                return ImageDecoder.bgra565(raster, width, height);
            case RasterFormat.RASTER_4444:
                return ImageDecoder.bgra4444(raster, width, height);
            case RasterFormat.RASTER_LUM:
                return ImageDecoder.lum8(raster, width, height);
            case RasterFormat.RASTER_8888:
                return ImageDecoder.bgra8888(raster, width, height);
            case RasterFormat.RASTER_888:
                return ImageDecoder.bgra888(raster, width, height);
            case RasterFormat.RASTER_555:
                return ImageDecoder.bgra555(raster, width, height);
            default:
                return new Uint8Array(0);
        }
    }
}
