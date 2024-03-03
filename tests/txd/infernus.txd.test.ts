import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TxdParser, RwTxd } from '../../src/index';

describe('txd parsing - infernus', () => {
    const FLOATING_POINT_ERROR = 6;

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
        expect(rwTxd.textureDictionary.textureNatives).toHaveLength(3);
    });
});
