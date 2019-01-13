
export class IplParser {
    _stream: Buffer

    constructor(stream: Buffer) {
        this._stream = stream;
    }

    parse() {
        // text: ModelId, NULL, Interior, PosX, PosY, PosZ, RotX, RotY, RotZ, RotW, LOD
        // binary: PosX [4], PosY [4], PosZ [4], RotX [4], RotY [4], RotZ [4], RotW [4], ModelId [4], Interior [4], LOD [4]
    }

}