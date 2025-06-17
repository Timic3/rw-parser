import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TxdParser, RwTxd } from '../../src';

describe('txd parsing - dxtDecoding', () => {
    let rwTxd: RwTxd;
    let dxtJsOut:{[key: string]: number[]} = {};

    beforeAll(async () => {
        // Disable console debug for now, because of missing structures
        const consoleDebug = console.debug;
        console.debug = jest.fn();

        const txdParser = new TxdParser(await readFile(join(__dirname, '../assets/dxtDecoding.txd')));
        rwTxd = txdParser.parse();

        dxtJsOut = JSON.parse(await readFile(join(__dirname, '../assets/dxtDecoding.dxt-js.json'), 'utf8'));

        console.debug = consoleDebug;
    });

    test('texture dictionary', () => {
        expect(rwTxd.textureDictionary).toBeDefined();
    });

    test('texture dictionary - length', () => {
        expect(rwTxd.textureDictionary.textureCount).toBe(3);
        expect(rwTxd.textureDictionary.textureNatives).toHaveLength(rwTxd.textureDictionary.textureCount);
    });

    test('texture dictionary - decoding dxt1', () => {
        for (let i = 0; i < rwTxd.textureDictionary.textureNatives[0].mipmaps[0].length; i++) {
            const dxtJsValue = dxtJsOut['DXT1'][i];
            const calculatedValue = rwTxd.textureDictionary.textureNatives[0].mipmaps[0][i]
            expect(calculatedValue).toBeLessThanOrEqual(dxtJsValue + 1);
            expect(calculatedValue).toBeGreaterThanOrEqual(dxtJsValue - 1);
        }
    });

    test('texture dictionary - decoding dxt3', () => {
        for (let i = 0; i < rwTxd.textureDictionary.textureNatives[1].mipmaps[0].length; i++) {
            const dxtJsValue = dxtJsOut['DXT3'][i];
            const calculatedValue = rwTxd.textureDictionary.textureNatives[1].mipmaps[0][i]
            expect(calculatedValue).toBeLessThanOrEqual(dxtJsValue + 1);
            expect(calculatedValue).toBeGreaterThanOrEqual(dxtJsValue - 1);
        }
    });

    test('texture dictionary - decoding dxt5', () => {
        for (let i = 0; i < rwTxd.textureDictionary.textureNatives[2].mipmaps[0].length; i++) {
            const dxtJsValue = dxtJsOut['DXT5'][i];
            const calculatedValue = rwTxd.textureDictionary.textureNatives[2].mipmaps[0][i]
            expect(calculatedValue).toBeLessThanOrEqual(dxtJsValue + 1);
            expect(calculatedValue).toBeGreaterThanOrEqual(dxtJsValue - 1);
        }
    });
});
