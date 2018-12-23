
export class ByteStream {
    _cursor = 0;
    _stream: Uint8Array;

    constructor(stream: Uint8Array) {
        this._stream = stream;
    }

    public readUint8() {
        return this._stream[this._cursor++];
    }

    public readUint16() {
        const uint16 =  (this._stream[this._cursor + 1] << 8) +
                        (this._stream[this._cursor])
        this._cursor += 2;
        return uint16;
    }

    public readUint32() {
        const uint32 =  (this._stream[this._cursor + 3] << 24) + 
                        (this._stream[this._cursor + 2] << 16) +
                        (this._stream[this._cursor + 1] << 8) +
                        (this._stream[this._cursor]);
        this._cursor += 4;
        return uint32;
    }
}