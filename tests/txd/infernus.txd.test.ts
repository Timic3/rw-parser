import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TxdParser, RwTxd } from '../../src/index';

describe('txd parsing - infernus', () => {
    let rwTxd: RwTxd;

    beforeAll(async () => {
        // Disable console debug for now, because of missing structures
        const consoleDebug = console.debug;
        console.debug = jest.fn();

        const txdParser = new TxdParser(await readFile(join(__dirname, '../assets/infernus.txd')));
        rwTxd = txdParser.parse();

        console.debug = consoleDebug;
    });

    test('texture dictionary', () => {
        expect(rwTxd.textureDictionary).toBeDefined();
    });

    test('texture dictionary - length', () => {
        expect(rwTxd.textureDictionary.textureCount).toBe(3);
        expect(rwTxd.textureDictionary.textureNatives).toHaveLength(rwTxd.textureDictionary.textureCount);
    });

    test('texture dictionary - natives - platform', () => {
        for (const textureNative of rwTxd.textureDictionary.textureNatives) {
            expect(textureNative.platformId).toBe(9);
        }
    });

    test('texture dictionary - natives - filter mode', () => {
        for (const textureNative of rwTxd.textureDictionary.textureNatives) {
            expect(textureNative.filterMode).toBe(1);
        }
    });

    test('texture dictionary - natives - uv addressing', () => {
        for (const textureNative of rwTxd.textureDictionary.textureNatives) {
            expect(textureNative.uAddressing).toBe(1);
            expect(textureNative.vAddressing).toBe(1);
        }
    });

    test('texture dictionary - natives - compression format', () => {
        expect(rwTxd.textureDictionary.textureNatives[0].compressed).toBeTruthy();
        expect(rwTxd.textureDictionary.textureNatives[0].d3dFormat).toBe('DXT1');

        expect(rwTxd.textureDictionary.textureNatives[1].compressed).toBeTruthy();
        expect(rwTxd.textureDictionary.textureNatives[1].d3dFormat).toBe('DXT1');

        expect(rwTxd.textureDictionary.textureNatives[2].compressed).toBeTruthy();
        expect(rwTxd.textureDictionary.textureNatives[2].d3dFormat).toBe('DXT3');
    });

    test('texture dictionary - natives - texture information and mip maps', () => {
        for (const textureNative of rwTxd.textureDictionary.textureNatives) {
            expect(textureNative.autoMipMaps).toBeFalsy();

            expect(textureNative.mipmapCount).toBe(1);
            expect(textureNative.mipmaps).toHaveLength(textureNative.mipmapCount);

            for (const mipmap of textureNative.mipmaps) {
                // We have 4 color channels for each pixel
                expect(mipmap).toHaveLength(textureNative.width * textureNative.height * 4);

                // Each color channel is an unsigned byte (0-255)
                const valuesInColorRange = mipmap.every(value => value >= 0 && value <= 255);
                expect(valuesInColorRange).toBeTruthy();
            }
        }

        expect(rwTxd.textureDictionary.textureNatives[0].alpha).toBeFalsy();
        expect(rwTxd.textureDictionary.textureNatives[1].alpha).toBeFalsy();
        expect(rwTxd.textureDictionary.textureNatives[2].alpha).toBeTruthy();

        // Color for top-left pixel, it is fully opaque
        expect(rwTxd.textureDictionary.textureNatives[0].mipmaps[0][0]).toBe(165);
        expect(rwTxd.textureDictionary.textureNatives[0].mipmaps[0][1]).toBe(170);
        expect(rwTxd.textureDictionary.textureNatives[0].mipmaps[0][2]).toBe(181);
        expect(rwTxd.textureDictionary.textureNatives[0].mipmaps[0][3]).toBe(255);

        // Color for bottom-right pixel, it is fully opaque
        expect(rwTxd.textureDictionary.textureNatives[0].mipmaps[0][4092]).toBe(156);
        expect(rwTxd.textureDictionary.textureNatives[0].mipmaps[0][4093]).toBe(154);
        expect(rwTxd.textureDictionary.textureNatives[0].mipmaps[0][4094]).toBe(165);
        expect(rwTxd.textureDictionary.textureNatives[0].mipmaps[0][4095]).toBe(255);
    });

    test('texture dictionary - natives - texture names and mask names', () => {
        expect(rwTxd.textureDictionary.textureNatives[0].textureName).toBe('infernus92wheel32');
        expect(rwTxd.textureDictionary.textureNatives[1].textureName).toBe('infernus92interior128');
        expect(rwTxd.textureDictionary.textureNatives[2].textureName).toBe('infernus92handle32');

        // No masks are present in Infernus model
        expect(rwTxd.textureDictionary.textureNatives[0].maskName).toBe('');
        expect(rwTxd.textureDictionary.textureNatives[1].maskName).toBe('');
        expect(rwTxd.textureDictionary.textureNatives[2].maskName).toBe('');
    });

    test('texture dictionary - natives - raster information', () => {
        expect(rwTxd.textureDictionary.textureNatives[0].rasterFormat).toBe(512);
        expect(rwTxd.textureDictionary.textureNatives[1].rasterFormat).toBe(512);
        expect(rwTxd.textureDictionary.textureNatives[2].rasterFormat).toBe(768);

        for (const textureNative of rwTxd.textureDictionary.textureNatives) {
            expect(textureNative.rasterType).toBe(4);
            expect(textureNative.filterMode).toBe(1);
            expect(textureNative.depth).toBe(16);
            expect(textureNative.cubeTexture).toBeFalsy();
        }
    });
});
