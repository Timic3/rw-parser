export enum RwSections {
    // Core
    RwStruct = 0x0001,
    RwString = 0x0002,
    RwExtension = 0x0003,
    RwTexture = 0x0006,
    RwMaterial = 0x0007,
    RwMaterialList = 0x0008,
    RwFrameList = 0x000E,
    RwGeometry = 0x000F,
    RwClump = 0x0010,
    RwAtomic = 0x0014,
    RwTextureNative = 0x0015,
    RwTextureDictionary = 0x0016,
    RwGeometryList = 0x001A,
    RwSkin = 0x116,  
    RwAnim = 0x11E,

    // Toolkit
    RwMaterialEffectsPLG = 0x0120,

    // R* specific RW plugins
    RwReflectionMaterial = 0x0253F2FC,
    // This was renamed to RwNodeName from RwFrame to prevent confusion.
    // https://gtamods.com/wiki/Node_Name_(RW_Section)
    RwNodeName = 0x0253F2FE,
}
