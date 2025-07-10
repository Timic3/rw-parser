export enum RasterFormat {
    RASTER_1555 = 0x0100,
    RASTER_565  = 0x0200,
    RASTER_4444 = 0x0300,
    RASTER_LUM  = 0x0400,
    RASTER_8888 = 0x0500,
    RASTER_888  = 0x0600,
    RASTER_555  = 0x0a00,
}

export enum D3DFormat {
    D3DFMT_A8L8 = "3",
    D3D_DXT1    = "DXT1",
    D3D_DXT2    = "DXT2",
    D3D_DXT3    = "DXT3",
    D3D_DXT4    = "DXT4",
    D3D_DXT5    = "DXT5",
}

export enum PaletteType {
    PALETTE_NONE = 0,
    PALETTE_8    = 1,
}

export enum PlatformType {
    D3D8 = 0x8,
    D3D9 = 0x9,
}