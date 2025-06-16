
// Source: https://gtamods.com/wiki/RenderWare

export default class RwVersion {
    static readonly versions: { [versionNumber: number]: string } = {
        0x31000: 'RenderWare 3.1.0.0 (III on PS2)',
        0x32000: 'RenderWare 3.2.0.0 (III on PC)',
        0x33002: 'RenderWare 3.3.0.2 (III on PC, VC on PS2)',
        0x34003: 'RenderWare 3.4.0.3 (VC on PC)',
        0x34005: 'RenderWare 3.4.0.5 (III on PS2, VC on Android/PC)',
        0x35000: 'RenderWare 3.5.0.0 (III/VC on Xbox)',
        0x36003: 'RenderWare 3.6.0.3 (SA)',
    };

    public static unpackVersion(version: number) {
        if (version & 0xFFFF0000) {
            return (version >> 14 & 0x3FF00) + 0x30000 | (version >> 16 & 0x3F);
        }
        return version;
    }

    public static unpackBuild(version: number) {
        if (version & 0xFFFF0000) {
            return version & 0xFFFF;
        }
        return 0;
    }
}
