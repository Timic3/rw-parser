import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DffParser, RwDff } from '../../src/index';
import exp from 'node:constants';


// This test for skin and bones sections
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

    test('bones - length', () => {
        expect(rwDff.animNodes.length).toStrictEqual(32);
        expect(rwDff.animNodes[0].bones.length).toStrictEqual(32);
    });

    test('bones - ids', () => {
        expect(rwDff.animNodes[0].boneId).toStrictEqual(0);
        expect(rwDff.animNodes[1].boneId).toStrictEqual(1);
        expect(rwDff.animNodes[2].boneId).toStrictEqual(51);
        expect(rwDff.animNodes[3].boneId).toStrictEqual(41);
        expect(rwDff.animNodes[15].boneId).toStrictEqual(8);
        expect(rwDff.animNodes[30].boneId).toStrictEqual(53);
        expect(rwDff.animNodes[31].boneId).toStrictEqual(54);
        expect(rwDff.animNodes[0].bones[0].boneId).toStrictEqual(0);
        expect(rwDff.animNodes[0].bones[2].boneId).toStrictEqual(2);
        expect(rwDff.animNodes[0].bones[7].boneId).toStrictEqual(6);
        expect(rwDff.animNodes[0].bones[18].boneId).toStrictEqual(24);
        expect(rwDff.animNodes[0].bones[31].boneId).toStrictEqual(54);
    });

    test('bones - bone count', () => {
        expect(rwDff.animNodes[0].bonesCount).toStrictEqual(32);
        expect(rwDff.animNodes[3].bonesCount).toStrictEqual(0);
        expect(rwDff.animNodes[15].bonesCount).toStrictEqual(0);
        expect(rwDff.animNodes[31].bonesCount).toStrictEqual(0);
;
    });

    test('skin - bone count', () => {
        const skin = rwDff.geometryList?.geometries[0].skin!;

        expect(skin.boneCount).toStrictEqual(32);
        expect(skin.usedBoneCount).toStrictEqual(31);

    });

    test('skin - vertex weights', () => {
        const skin = rwDff.geometryList?.geometries[0].skin!;
        
        expect(skin.maxWeightsPerVertex).toStrictEqual(4);
        expect(skin.vertexWeights.length).toStrictEqual(990);

        expect(skin.vertexWeights[0][0]).toBeCloseTo(0.5773563385009766,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[0][1]).toBeCloseTo(0.42264366149902344,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[0][2]).toBeCloseTo(0,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[0][3]).toBeCloseTo(0,FLOATING_POINT_ERROR);

        expect(skin.vertexWeights[654][0]).toBeCloseTo(1,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[654][1]).toBeCloseTo(0,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[654][2]).toBeCloseTo(0,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[654][3]).toBeCloseTo(0,FLOATING_POINT_ERROR);

        expect(skin.vertexWeights[989][0]).toBeCloseTo(1,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[989][1]).toBeCloseTo(0,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[989][2]).toBeCloseTo(0,FLOATING_POINT_ERROR);
        expect(skin.vertexWeights[989][3]).toBeCloseTo(0,FLOATING_POINT_ERROR);
    });

    test('skin - bone-vertex map', () => {
        const skin = rwDff.geometryList?.geometries[0].skin!;
        
        expect(skin.boneVertexIndices[0][0]).toStrictEqual(28);
        expect(skin.boneVertexIndices[0][1]).toStrictEqual(24);
        expect(skin.boneVertexIndices[0][2]).toStrictEqual(0);
        expect(skin.boneVertexIndices[0][3]).toStrictEqual(0);

        expect(skin.boneVertexIndices[525][0]).toStrictEqual(5);
        expect(skin.boneVertexIndices[525][1]).toStrictEqual(6);
        expect(skin.boneVertexIndices[525][2]).toStrictEqual(0);
        expect(skin.boneVertexIndices[525][3]).toStrictEqual(0);

        expect(skin.boneVertexIndices[989][0]).toStrictEqual(5);
        expect(skin.boneVertexIndices[989][1]).toStrictEqual(0);
        expect(skin.boneVertexIndices[989][2]).toStrictEqual(0);
        expect(skin.boneVertexIndices[989][3]).toStrictEqual(0);
    });

    test('skin - inverse bone matrices', () => {
        const skin = rwDff.geometryList?.geometries[0].skin!;
        
        expect(skin.inverseBoneMatrices.length).toStrictEqual(32);

        expect(skin.inverseBoneMatrices[0]).toStrictEqual( {
            right: { 
                x: expect.closeTo(1, FLOATING_POINT_ERROR), 
                y: expect.closeTo(0, FLOATING_POINT_ERROR), 
                z: expect.closeTo(0, FLOATING_POINT_ERROR), 
                t: expect.closeTo(0, FLOATING_POINT_ERROR) },
            up: { 
                x: expect.closeTo(0, FLOATING_POINT_ERROR), 
                y: expect.closeTo(1, FLOATING_POINT_ERROR), 
                z: expect.closeTo(0, FLOATING_POINT_ERROR), 
                t: expect.closeTo(0, FLOATING_POINT_ERROR) },
            at: { 
                x: expect.closeTo(0, FLOATING_POINT_ERROR), 
                y: expect.closeTo(0, FLOATING_POINT_ERROR), 
                z: expect.closeTo(1, FLOATING_POINT_ERROR), 
                t: expect.closeTo(1.8175872244174958e-20, FLOATING_POINT_ERROR) },
            transform: { 
                x: expect.closeTo(0, FLOATING_POINT_ERROR), 
                y: expect.closeTo(0, FLOATING_POINT_ERROR), 
                z: expect.closeTo(0, FLOATING_POINT_ERROR), 
                t: expect.closeTo(1.485376372184306e-43, FLOATING_POINT_ERROR) } });

        expect(skin.inverseBoneMatrices[31]).toStrictEqual( {
            right: {
                x: expect.closeTo(1, FLOATING_POINT_ERROR),
                y: expect.closeTo(-9.176544324418501e-8, FLOATING_POINT_ERROR),
                z: expect.closeTo(-9.58358531422121e-11, FLOATING_POINT_ERROR),
                t: expect.closeTo(0, FLOATING_POINT_ERROR) },
            up: {
                x: expect.closeTo(-9.313955162681964e-10, FLOATING_POINT_ERROR),
                y: expect.closeTo(-1.2224200318655676e-8, FLOATING_POINT_ERROR),
                z: expect.closeTo(-1, FLOATING_POINT_ERROR),
                t: expect.closeTo(0, FLOATING_POINT_ERROR) },
            at: {
                x: expect.closeTo(8.127337736141271e-8, FLOATING_POINT_ERROR),
                y: expect.closeTo(0.9999998807907104, FLOATING_POINT_ERROR),
                z: expect.closeTo(-5.962812021920172e-9, FLOATING_POINT_ERROR),
                t: expect.closeTo(1.8175872244174958e-20, FLOATING_POINT_ERROR) },
            transform: {
                x: expect.closeTo(-0.15182293951511383, FLOATING_POINT_ERROR),
                y: expect.closeTo(1.0362001657485962, FLOATING_POINT_ERROR),
                z: expect.closeTo(-0.1699587106704712, FLOATING_POINT_ERROR),
                t: expect.closeTo(1.485376372184306e-43, FLOATING_POINT_ERROR) } });

    });

});
