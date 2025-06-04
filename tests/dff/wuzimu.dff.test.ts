import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DffParser, RwDff } from '../../src/index';


// This test for skin and bones only
describe('dff parsing - wuzimu', () => {
    const FLOATING_POINT_ERROR = 6;
    let rwDff: RwDff;

    beforeAll(async () => {
        const consoleDebug = console.debug;
        console.debug = jest.fn();

        const dffParser = new DffParser(await readFile(join(__dirname, '../assets/wuzimu.dff')));
        rwDff = dffParser.parse();

        console.debug = consoleDebug;
    });
    
    test('SA version', () => {
        expect(rwDff.version).toBe('RenderWare 3.6.0.3 (SA)');
        expect(rwDff.versionNumber).toBe(0x36003);
    });

    test('dummies - length', () => {
        expect(rwDff.dummies).toHaveLength(32);
    });

    test('dummies - names', () => {
        expect(rwDff.dummies[0]).toBe('Normal');
        expect(rwDff.dummies[1]).toBe(' Pelvis');
        expect(rwDff.dummies[2]).toBe(' R Thigh');   
        expect(rwDff.dummies[15]).toBe('Jaw');
        expect(rwDff.dummies[30]).toBe(' R Foot');
        expect(rwDff.dummies[31]).toBe(' R Toe0');
    })

    test('frames - length', () => {
        const frameList = rwDff.frameList;

        expect(frameList).toBeDefined();
        expect(frameList!.frameCount).toBe(33);
        expect(frameList!.frames).toHaveLength(frameList!.frameCount);
    });

    test('frames - parent frames', () => {
        const frameList = rwDff.frameList;

        expect(frameList!.frames[0].parentFrame).toBe(-1);
        expect(frameList!.frames[1].parentFrame).toBe(0);
        expect(frameList!.frames[2].parentFrame).toBe(1);
        expect(frameList!.frames[3].parentFrame).toBe(2);
        expect(frameList!.frames[6].parentFrame).toBe(5);
        expect(frameList!.frames[15].parentFrame).toBe(13);
        expect(frameList!.frames[31].parentFrame).toBe(30);
        expect(frameList!.frames[32].parentFrame).toBe(31);
    });

    test('frames - coordinate offsets', () => {
        const frameList = rwDff.frameList;

        expect(frameList!.frames[0].coordinatesOffset).toStrictEqual({ x: 0, y: 0, z: 0 });
        expect(frameList!.frames[1].coordinatesOffset).toStrictEqual({ x: 0, y: 0, z: 0 });
        expect(frameList!.frames[16].coordinatesOffset).toStrictEqual({ 
            x: expect.closeTo(0.011230167001485825, FLOATING_POINT_ERROR),
            y: expect.closeTo(0.0154640581458807, FLOATING_POINT_ERROR), 
            z: expect.closeTo(-0.004240759648382664, FLOATING_POINT_ERROR) });
        expect(frameList!.frames[32].coordinatesOffset).toStrictEqual({  
            x: expect.closeTo(0.10200118273496628, FLOATING_POINT_ERROR),
            y: expect.closeTo(0.1541077196598053, FLOATING_POINT_ERROR), 
            z: expect.closeTo(0.0, FLOATING_POINT_ERROR) });
    });

    test('frames - rotation matrices', () => {
        const frameList = rwDff.frameList;

        expect(frameList!.frames[0].rotationMatrix).toStrictEqual({ 
            right: { x: 1, y: 0, z: 0 }, 
            up: { x: 0, y: 1, z: 0}, 
            at: { x: 0, y: 0, z: 1} });
        expect(frameList!.frames[10].rotationMatrix).toStrictEqual({ 
            right: { x: expect.closeTo(0.9785407781600952, FLOATING_POINT_ERROR), y: expect.closeTo(0.20605318248271942, FLOATING_POINT_ERROR), z: expect.closeTo(0.0, FLOATING_POINT_ERROR)}, 
            up: { x: expect.closeTo(-0.20605315268039703, FLOATING_POINT_ERROR), y: expect.closeTo(0.97854083776474, FLOATING_POINT_ERROR), z: expect.closeTo(0.0, FLOATING_POINT_ERROR)}, 
            at: { x: expect.closeTo(0.0, FLOATING_POINT_ERROR), y: expect.closeTo(0.0, FLOATING_POINT_ERROR), z: expect.closeTo(1.0, FLOATING_POINT_ERROR)} });
        expect(frameList!.frames[32].rotationMatrix).toStrictEqual({ 
            right: { x: 0, y: 1, z: expect.closeTo(0.0, FLOATING_POINT_ERROR) }, 
            up: { x: -1, y: 0, z: 0}, 
            at: { x: 0, y: 0, z: 1} });
    });

    
});
