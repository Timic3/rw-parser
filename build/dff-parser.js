var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
System.register("utils/ByteStream", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var ByteStream;
    return {
        setters: [],
        execute: function () {
            ByteStream = /** @class */ (function () {
                function ByteStream(stream) {
                    this._cursor = 0;
                    this._stream = stream;
                }
                ByteStream.prototype.readUint8 = function () {
                    var uint8 = this._stream.readUInt8(this._cursor);
                    this._cursor++;
                    return uint8;
                };
                ByteStream.prototype.readUint16 = function () {
                    var uint16 = this._stream.readUInt16LE(this._cursor);
                    this._cursor += 2;
                    return uint16;
                };
                ByteStream.prototype.readUint32 = function () {
                    var uint32 = this._stream.readUInt32LE(this._cursor);
                    this._cursor += 4;
                    return uint32;
                };
                ByteStream.prototype.readInt32 = function () {
                    var int32 = this._stream.readInt32LE(this._cursor);
                    this._cursor += 4;
                    return int32;
                };
                ByteStream.prototype.readFloat = function () {
                    var float = this._stream.readFloatLE(this._cursor);
                    this._cursor += 4;
                    return float;
                };
                ByteStream.prototype.readString = function (size) {
                    var string = this._stream.toString('ascii', this._cursor, this._cursor + size);
                    this._cursor += size;
                    return string.replace(/\0/g, '');
                };
                ByteStream.prototype.getPosition = function () {
                    return this._cursor;
                };
                ByteStream.prototype.setPosition = function (position) {
                    this._cursor = position;
                };
                ByteStream.prototype.skip = function (size) {
                    this._cursor += size;
                };
                return ByteStream;
            }());
            exports_1("ByteStream", ByteStream);
        }
    };
});
System.register("renderware/RwSections", [], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    var RwSections;
    return {
        setters: [],
        execute: function () {
            (function (RwSections) {
                RwSections[RwSections["RwStruct"] = 1] = "RwStruct";
                RwSections[RwSections["RwString"] = 2] = "RwString";
                RwSections[RwSections["RwExtension"] = 3] = "RwExtension";
                RwSections[RwSections["RwTexture"] = 6] = "RwTexture";
                RwSections[RwSections["RwMaterial"] = 7] = "RwMaterial";
                RwSections[RwSections["RwMaterialList"] = 8] = "RwMaterialList";
                RwSections[RwSections["RwFrameList"] = 14] = "RwFrameList";
                RwSections[RwSections["RwGeometry"] = 15] = "RwGeometry";
                RwSections[RwSections["RwClump"] = 16] = "RwClump";
                RwSections[RwSections["RwAtomic"] = 20] = "RwAtomic";
                RwSections[RwSections["RwGeometryList"] = 26] = "RwGeometryList";
                RwSections[RwSections["RwMaterialEffectsPLG"] = 288] = "RwMaterialEffectsPLG";
                RwSections[RwSections["RwReflectionMaterial"] = 39056124] = "RwReflectionMaterial";
                RwSections[RwSections["RwFrame"] = 39056126] = "RwFrame";
            })(RwSections || (RwSections = {}));
            exports_2("RwSections", RwSections);
        }
    };
});
System.register("renderware/RwFile", ["utils/ByteStream"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var ByteStream_1, RwFile;
    return {
        setters: [
            function (ByteStream_1_1) {
                ByteStream_1 = ByteStream_1_1;
            }
        ],
        execute: function () {
            RwFile = /** @class */ (function (_super) {
                __extends(RwFile, _super);
                function RwFile(stream) {
                    return _super.call(this, stream) || this;
                }
                RwFile.prototype.readSectionHeader = function () {
                    var sectionType = this.readUint32();
                    var sectionSize = this.readUint32();
                    var versionNumber = this.readUint32();
                    return { sectionType: sectionType, sectionSize: sectionSize, versionNumber: versionNumber };
                };
                RwFile.prototype.readClump = function () {
                    this.readSectionHeader();
                    var objectCount = this.readUint32();
                    // Let's assume the following 8 bytes are paddings
                    this._cursor += 8;
                    return { objectCount: objectCount };
                };
                RwFile.prototype.readFrameList = function () {
                    this.readSectionHeader();
                    var numberOfFrames = this.readUint32();
                    var frames = Array();
                    for (var i = 0; i < numberOfFrames; i++) {
                        // All these could probably be moved to readFrameData()
                        var rotationMatrix = [];
                        for (var i_1 = 0; i_1 < 9; i_1++) {
                            rotationMatrix[i_1] = this.readFloat();
                        }
                        var coordinatesOffset = [];
                        for (var i_2 = 0; i_2 < 3; i_2++) {
                            coordinatesOffset[i_2] = this.readFloat();
                        }
                        var parentFrame = this.readInt32();
                        // Skip 4 bytes - not used
                        this._cursor += 4;
                        frames.push({ rotationMatrix: rotationMatrix, coordinatesOffset: coordinatesOffset, parentFrame: parentFrame });
                    }
                    return { numberOfFrames: numberOfFrames, frames: frames };
                };
                RwFile.prototype.readGeometryList = function () {
                    this.readSectionHeader();
                    var numberOfGeometricObjects = this.readUint32();
                    var geometries = Array();
                    for (var i = 0; i < numberOfGeometricObjects; i++) {
                        this.readSectionHeader();
                        this.readSectionHeader();
                        var geometryData = this.readGeometry();
                        geometries.push(geometryData);
                    }
                    return { numberOfGeometricObjects: numberOfGeometricObjects, geometries: geometries };
                };
                RwFile.prototype.readGeometry = function () {
                    var flags = this.readUint16();
                    var textureCoordinatesCount = this.readUint8();
                    var nativeGeometryFlags = this.readUint8();
                    var triangleCount = this.readUint32();
                    var vertexCount = this.readUint32();
                    var morphTargetCount = this.readUint32();
                    // TODO: Parse ambient, specular and diffuse if version < 0x34000 here
                    /*
                    const ambient = this.readFloat();
                    const specular = this.readFloat();
                    const diffuse = this.readFloat();
                    */
                    var triangleStrip = (flags & (1 << 0)) !== 0;
                    var includesVertex = (flags & (1 << 1)) !== 0;
                    var includesUVs = (flags & (1 << 2)) !== 0;
                    var includesColors = (flags & (1 << 3)) !== 0;
                    var includesNormals = (flags & (1 << 4)) !== 0;
                    var geometryLit = (flags & (1 << 5)) !== 0;
                    var modulateMaterialColor = (flags & (1 << 6)) !== 0;
                    var multipleUVSets = (flags & (1 << 7)) !== 0;
                    var colorInformation = [];
                    var textureMappingInformation = [];
                    var faceInformation = [];
                    if (includesColors) {
                        for (var i = 0; i < vertexCount; i++) {
                            colorInformation[i] = [];
                            // R, G, B, A
                            colorInformation[i][0] = this.readUint8();
                            colorInformation[i][1] = this.readUint8();
                            colorInformation[i][2] = this.readUint8();
                            colorInformation[i][3] = this.readUint8();
                        }
                    }
                    if (includesUVs || multipleUVSets) {
                        for (var i = 0; i < textureCoordinatesCount; i++) {
                            for (var i_3 = 0; i_3 < vertexCount; i_3++) {
                                textureMappingInformation[i_3] = [];
                                // U, V
                                textureMappingInformation[i_3][0] = this.readFloat();
                                textureMappingInformation[i_3][1] = this.readFloat();
                            }
                        }
                    }
                    for (var i = 0; i < triangleCount; i++) {
                        faceInformation[i] = [];
                        // Vertex 2, Vertex 1, Material ID / Flags, Vertex 3
                        faceInformation[i][0] = this.readUint16();
                        faceInformation[i][1] = this.readUint16();
                        faceInformation[i][2] = this.readUint16();
                        faceInformation[i][3] = this.readUint16();
                    }
                    // TODO: Repeat according to morphTargetCount
                    var boundingSphere = [];
                    // X, Y, Z, Radius
                    boundingSphere[0] = this.readFloat();
                    boundingSphere[1] = this.readFloat();
                    boundingSphere[2] = this.readFloat();
                    boundingSphere[3] = this.readFloat();
                    var hasPosition = this.readUint32();
                    var hasNormals = this.readUint32();
                    var vertexInformation = [];
                    for (var i = 0; i < vertexCount; i++) {
                        vertexInformation[i] = [];
                        // X, Y, Z
                        vertexInformation[i][0] = this.readFloat();
                        vertexInformation[i][1] = this.readFloat();
                        vertexInformation[i][2] = this.readFloat();
                    }
                    var normalInformation = [];
                    if (includesNormals) {
                        for (var i = 0; i < vertexCount; i++) {
                            normalInformation[i] = [];
                            // X, Y, Z
                            normalInformation[i][0] = this.readFloat();
                            normalInformation[i][1] = this.readFloat();
                            normalInformation[i][2] = this.readFloat();
                        }
                    }
                    var materialList = this.readMaterialList();
                    // Skipping extension for now
                    this.skip(this.readSectionHeader().sectionSize);
                    return {
                        colorInformation: colorInformation,
                        textureMappingInformation: textureMappingInformation,
                        faceInformation: faceInformation,
                        boundingSphere: boundingSphere,
                        hasPosition: hasPosition, hasNormals: hasNormals,
                        vertexInformation: vertexInformation,
                        normalInformation: normalInformation,
                        materialList: materialList
                    };
                };
                RwFile.prototype.readMaterialList = function () {
                    this.readSectionHeader();
                    this.readSectionHeader();
                    var materialInstanceCount = this.readUint32();
                    var materialIndexes = Array();
                    for (var i = 0; i < materialInstanceCount; i++) {
                        var materialIndex = this.readInt32();
                        materialIndexes.push(materialIndex);
                    }
                    var materialData = Array();
                    for (var i = 0; i < materialInstanceCount; i++) {
                        var materialIndex = materialIndexes[i];
                        if (materialIndex == -1) {
                            materialData.push(this.readMaterial());
                        }
                        else {
                            materialData.push(materialData[materialIndex]);
                        }
                    }
                    return { materialInstanceCount: materialInstanceCount, materialData: materialData };
                };
                RwFile.prototype.readMaterial = function () {
                    this.readSectionHeader();
                    this.readSectionHeader();
                    // Flags - not used
                    this.skip(4);
                    var color = [];
                    color[0] = this.readUint8();
                    color[1] = this.readUint8();
                    color[2] = this.readUint8();
                    color[3] = this.readUint8();
                    // Unknown - not used
                    this.skip(4);
                    var isTextured = this.readUint32();
                    // TODO: if version > 0x30400
                    var ambient = this.readFloat();
                    var specular = this.readFloat();
                    var diffuse = this.readFloat();
                    var texture = null;
                    if (isTextured > 0) {
                        texture = this.readTexture();
                    }
                    // Skipping extension for now
                    this.skip(this.readSectionHeader().sectionSize);
                    return { color: color, isTextured: isTextured, ambient: ambient, specular: specular, diffuse: diffuse, texture: texture };
                };
                RwFile.prototype.readTexture = function () {
                    this.readSectionHeader();
                    this.readSectionHeader();
                    var textureFilterFlags = this.readUint16();
                    // Unknown - not used
                    this.skip(2);
                    var nameSize = this.readSectionHeader().sectionSize;
                    var textureName = this.readString(nameSize);
                    this.skip(this.readSectionHeader().sectionSize);
                    // Skipping extension for now
                    this.skip(this.readSectionHeader().sectionSize);
                    return { textureFilterFlags: textureFilterFlags, textureName: textureName };
                };
                RwFile.prototype.readAtomic = function () {
                    this.readSectionHeader();
                    var frameIndex = this.readUint32();
                    var geometryIndex = this.readUint32();
                    // Skip unused bytes
                    this.skip(8);
                    return { frameIndex: frameIndex, geometryIndex: geometryIndex };
                };
                return RwFile;
            }(ByteStream_1.ByteStream));
            exports_3("RwFile", RwFile);
        }
    };
});
System.register("index", ["fs", "renderware/RwFile", "renderware/RwSections"], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    function parseModel(path) {
        var buffer = fs.readFileSync(path);
        var dffStream = new RwFile_1.RwFile(buffer);
        console.log('Reading DFF with byte length: ' + buffer.byteLength);
        var atomics = [];
        var dummies = [];
        var geometryList;
        var frameList;
        while (dffStream._cursor < buffer.byteLength) {
            var header = dffStream.readSectionHeader();
            if (header.sectionType === 0) {
                break;
            }
            if (header.sectionSize == 0) {
                continue;
            }
            switch (header.sectionType) {
                case RwSections_1.RwSections.RwClump:
                    break;
                case RwSections_1.RwSections.RwFrameList:
                    frameList = dffStream.readFrameList();
                    break;
                case RwSections_1.RwSections.RwExtension:
                    var extensionHeader = dffStream.readSectionHeader();
                    if (extensionHeader.sectionType !== RwSections_1.RwSections.RwFrame) {
                        // Not a string - skip
                        dffStream.skip(extensionHeader.sectionSize);
                    }
                    else {
                        dummies.push(dffStream.readString(extensionHeader.sectionSize));
                    }
                    break;
                case RwSections_1.RwSections.RwGeometryList:
                    geometryList = dffStream.readGeometryList();
                    break;
                case RwSections_1.RwSections.RwAtomic:
                    var atomic = dffStream.readAtomic();
                    atomics[atomic.geometryIndex] = atomic.frameIndex;
                    break;
                default:
                    // console.log(`Section type ${header.sectionType} not found. Skipping ${header.sectionSize} bytes.`);
                    dffStream.skip(header.sectionSize);
                    break;
            }
        }
        return {
            geometryList: JSON.stringify(geometryList),
            frameList: JSON.stringify(frameList),
            atomics: JSON.stringify(atomics),
            dummies: JSON.stringify(dummies)
        };
    }
    var fs, RwFile_1, RwSections_1;
    return {
        setters: [
            function (fs_1) {
                fs = fs_1;
            },
            function (RwFile_1_1) {
                RwFile_1 = RwFile_1_1;
            },
            function (RwSections_1_1) {
                RwSections_1 = RwSections_1_1;
            }
        ],
        execute: function () {
        }
    };
});
