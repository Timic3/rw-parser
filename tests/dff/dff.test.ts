import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DffParser, RwDff } from '../../src/index';

describe('dff parsing - infernus', () => {
    let rwDff: RwDff;

    beforeAll(async () => {
        // Disable console debug for now, because of missing structures
        const consoleDebug = console.debug;
        console.debug = jest.fn();

        const dffParser = new DffParser(await readFile(join(__dirname, '../assets/infernus.dff')));
        rwDff = dffParser.parse();

        console.debug = consoleDebug;
    });

    it('should be SA version', () => {
        expect(rwDff.version).toBe('RenderWare 3.6.0.3 (SA)');
        expect(rwDff.versionNumber).toBe(0x36003);
    });

    it('should have atomic dictionary', () => {
        expect(rwDff.atomics).toHaveLength(15);

        expect(rwDff.atomics[1]).toBe(14);
        expect(rwDff.atomics[4]).toBe(31);
        expect(rwDff.atomics[14]).toBe(21);
    });

    it('should have dummies', () => {
        expect(rwDff.dummies).toHaveLength(36);

        expect(rwDff.dummies[0]).toBe('infernus');
        expect(rwDff.dummies[2]).toBe('wheel_lb_dummy');
        expect(rwDff.dummies[3]).toBe('wheel_rf_dummy');
        expect(rwDff.dummies[35]).toBe('wheel');
    });

    it('should have frames', () => {
        const frameList = rwDff.frameList;

        expect(frameList).toBeDefined();
        expect(frameList!.frameCount).toBe(36);
        expect(frameList!.frames).toHaveLength(frameList!.frameCount);

        expect(frameList!.frames[0].parentFrame).toBe(-1);
        expect(frameList!.frames[1].parentFrame).toBe(0);
        expect(frameList!.frames[2].parentFrame).toBe(0);
        expect(frameList!.frames[3].parentFrame).toBe(0);
        expect(frameList!.frames[4].parentFrame).toBe(0);
        expect(frameList!.frames[35].parentFrame).toBe(3);

        expect(frameList!.frames[0].coordinatesOffset).toStrictEqual({ x: 0, y: 0, z: 0 });
        expect(frameList!.frames[1].coordinatesOffset).toStrictEqual({ x: 0.7049300670623779, y: 2.6824448108673096, z: -0.19089847803115845 });
        expect(frameList!.frames[35].coordinatesOffset).toStrictEqual({ x: 0, y: 0, z: 0 });

        expect(frameList!.frames[0].rotationMatrix).toStrictEqual({ right: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0}, at: { x: 0, y: 0, z: 1} });
        expect(frameList!.frames[20].rotationMatrix).toStrictEqual({ right: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0}, at: { x: 0, y: 0, z: 1} });
        expect(frameList!.frames[35].rotationMatrix).toStrictEqual({ right: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0}, at: { x: 0, y: 0, z: 1} });
    });

    it('should have geometry list', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList).toBeDefined();
        expect(geometryList!.geometricObjectCount).toBe(15);
        expect(geometryList!.geometries).toHaveLength(geometryList!.geometricObjectCount);

        expect(geometryList!.geometries[0].hasVertices).toBeTruthy();
        expect(geometryList!.geometries[14].hasVertices).toBeTruthy();

        expect(geometryList!.geometries[0].hasNormals).toBeTruthy();
        expect(geometryList!.geometries[14].hasNormals).toBeTruthy();
    });
});
