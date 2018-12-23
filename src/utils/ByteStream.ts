
export class ByteStream {
    _cursor = 0;
    _stream: Buffer;

    constructor(stream: Buffer) {
        this._stream = stream;
    }

    public readUint8() {
        const uint8 = this._stream.readUInt8(this._cursor);
        this._cursor++;
        return uint8;
    }

    public readUint16() {
        const uint16 = this._stream.readUInt16LE(this._cursor);
        this._cursor += 2;
        return uint16;
    }

    public readUint32() {
        const uint32 = this._stream.readUInt32LE(this._cursor);
        this._cursor += 4;
        return uint32;
    }

    public readFloat() {
        const float = this._stream.readFloatLE(this._cursor);
        this._cursor += 4;
        return float;
    }

    public readString(size: number) {
        const string = this._stream.toString('ascii', this._cursor, this._cursor + size);
        this._cursor += size;
        return string;
    }
}