import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DffParser, RwDff } from '../../src/index';

describe('dff parsing - infernus', () => {
    const FLOATING_POINT_ERROR = 6;

    let rwDff: RwDff;

    beforeAll(async () => {
        // Disable console debug for now, because of missing structures
        const consoleDebug = console.debug;
        console.debug = jest.fn();

        const dffParser = new DffParser(await readFile(join(__dirname, '../assets/infernus.dff')));
        rwDff = dffParser.parse();

        console.debug = consoleDebug;
    });

    test('SA version', () => {
        expect(rwDff.version).toBe('RenderWare 3.6.0.3 (SA)');
        expect(rwDff.versionNumber).toBe(0x36003);
    });

    test('atomics - length', () => {
        expect(rwDff.atomics).toHaveLength(15);
    });

    test('atomics - index matching', () => {
        expect(rwDff.atomics[1]).toBe(14);
        expect(rwDff.atomics[4]).toBe(31);
        expect(rwDff.atomics[14]).toBe(21);
    });

    test('dummies - length', () => {
        expect(rwDff.dummies).toHaveLength(36);
    });

    test('dummies - names', () => {
        expect(rwDff.dummies[0]).toBe('infernus');
        expect(rwDff.dummies[2]).toBe('wheel_lb_dummy');
        expect(rwDff.dummies[3]).toBe('wheel_rf_dummy');
        expect(rwDff.dummies[35]).toBe('wheel');
    })

    test('frames - length', () => {
        const frameList = rwDff.frameList;

        expect(frameList).toBeDefined();
        expect(frameList!.frameCount).toBe(36);
        expect(frameList!.frames).toHaveLength(frameList!.frameCount);
    });

    test('frames - parent frames', () => {
        const frameList = rwDff.frameList;

        expect(frameList!.frames[0].parentFrame).toBe(-1);
        expect(frameList!.frames[1].parentFrame).toBe(0);
        expect(frameList!.frames[2].parentFrame).toBe(0);
        expect(frameList!.frames[3].parentFrame).toBe(0);
        expect(frameList!.frames[4].parentFrame).toBe(0);
        expect(frameList!.frames[35].parentFrame).toBe(3);
    });

    test('frames - coordinate offsets', () => {
        const frameList = rwDff.frameList;

        expect(frameList!.frames[0].coordinatesOffset).toStrictEqual({ x: 0, y: 0, z: 0 });
        expect(frameList!.frames[1].coordinatesOffset).toStrictEqual({
            x: expect.closeTo(0.7049300670623779, FLOATING_POINT_ERROR),
            y: expect.closeTo(2.6824448108673096, FLOATING_POINT_ERROR),
            z: expect.closeTo(-0.19089847803115845, FLOATING_POINT_ERROR),
        });
        expect(frameList!.frames[35].coordinatesOffset).toStrictEqual({ x: 0, y: 0, z: 0 });
    });

    test('frames - rotation matrices', () => {
        const frameList = rwDff.frameList;

        expect(frameList!.frames[0].rotationMatrix).toStrictEqual({ right: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0}, at: { x: 0, y: 0, z: 1} });
        expect(frameList!.frames[20].rotationMatrix).toStrictEqual({ right: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0}, at: { x: 0, y: 0, z: 1} });
        expect(frameList!.frames[35].rotationMatrix).toStrictEqual({ right: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0}, at: { x: 0, y: 0, z: 1} });
    });

    test('geometries - length', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList).toBeDefined();
        expect(geometryList!.geometricObjectCount).toBe(15);
        expect(geometryList!.geometries).toHaveLength(geometryList!.geometricObjectCount);
    });

    test('geometries - vertices', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].hasVertices).toBeTruthy();
        expect(geometryList!.geometries[14].hasVertices).toBeTruthy();

        expect(geometryList!.geometries[0].vertexInformation).toHaveLength(298);
        expect(geometryList!.geometries[14].vertexInformation).toHaveLength(1970);

        expect(geometryList!.geometries[0].vertexInformation[0]).toStrictEqual({
            x: expect.closeTo(0.011610686779022217, FLOATING_POINT_ERROR),
            y: expect.closeTo(-0.34009382128715515, FLOATING_POINT_ERROR),
            z: expect.closeTo(6.604368252283166e-8, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[0].vertexInformation[4]).toStrictEqual({
            x: expect.closeTo(0.1446995735168457, FLOATING_POINT_ERROR),
            y: expect.closeTo(-0.2580587565898895, FLOATING_POINT_ERROR),
            z: expect.closeTo(8.390583872142088e-8, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[0].vertexInformation[297]).toStrictEqual({
            x: expect.closeTo(-0.14533735811710358, FLOATING_POINT_ERROR),
            y: expect.closeTo(-0.08830816298723221, FLOATING_POINT_ERROR),
            z: expect.closeTo(0.0366043820977211, FLOATING_POINT_ERROR),
        });

        expect(geometryList!.geometries[14].vertexInformation[0]).toStrictEqual({
            x: expect.closeTo(0.3073364496231079, FLOATING_POINT_ERROR),
            y: expect.closeTo(-2.5099005699157715, FLOATING_POINT_ERROR),
            z: expect.closeTo(-0.1551474928855896, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[14].vertexInformation[4]).toStrictEqual({
            x: expect.closeTo(0.16569989919662476, FLOATING_POINT_ERROR),
            y: expect.closeTo(0.4999864399433136, FLOATING_POINT_ERROR),
            z: expect.closeTo(0.6087576150894165, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[14].vertexInformation[1969]).toStrictEqual({
            x: expect.closeTo(0.9978775978088379, FLOATING_POINT_ERROR),
            y: expect.closeTo(-2.4458563327789307, FLOATING_POINT_ERROR),
            z: expect.closeTo(0.18402734398841858, FLOATING_POINT_ERROR),
        });
    });

    test('geometries - normals', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].hasNormals).toBeTruthy();
        expect(geometryList!.geometries[14].hasNormals).toBeTruthy();

        expect(geometryList!.geometries[0].normalInformation).toHaveLength(298);
        expect(geometryList!.geometries[14].normalInformation).toHaveLength(1970);

        expect(geometryList!.geometries[0].normalInformation[0]).toStrictEqual({
            x: 1,
            y: expect.closeTo(-4.381484686177828e-8, FLOATING_POINT_ERROR),
            z: expect.closeTo(1.0953176164457332e-14, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[0].normalInformation[4]).toStrictEqual({
            x: expect.closeTo(0.9856113791465759, FLOATING_POINT_ERROR),
            y: expect.closeTo(0.16902732849121094, FLOATING_POINT_ERROR),
            z: expect.closeTo(-6.338092362057068e-7, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[0].normalInformation[297]).toStrictEqual({
            x: expect.closeTo(-0.6688096523284912, FLOATING_POINT_ERROR),
            y: expect.closeTo(-0.2820257246494293, FLOATING_POINT_ERROR),
            z: expect.closeTo(0.687862753868103, FLOATING_POINT_ERROR),
        });

        expect(geometryList!.geometries[14].normalInformation[0]).toStrictEqual({
            x: expect.closeTo(0.007420234382152557, FLOATING_POINT_ERROR),
            y: expect.closeTo(-0.727088987827301, FLOATING_POINT_ERROR),
            z: expect.closeTo(0.6865031719207764, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[14].normalInformation[4]).toStrictEqual({
            x: expect.closeTo(0.027043940499424934, FLOATING_POINT_ERROR),
            y: expect.closeTo(0.3288946747779846, FLOATING_POINT_ERROR),
            z: expect.closeTo(0.9439793229103088, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[14].normalInformation[1969]).toStrictEqual({
            x: expect.closeTo(0.12367071956396103, FLOATING_POINT_ERROR),
            y: expect.closeTo(-0.9902437329292297, FLOATING_POINT_ERROR),
            z: expect.closeTo(0.06421008706092834, FLOATING_POINT_ERROR),
        });
    });

    test('geometries - triangles', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].triangleInformation).toHaveLength(250);
        expect(geometryList!.geometries[14].triangleInformation).toHaveLength(1710);

        expect(geometryList!.geometries[0].triangleInformation[0]).toStrictEqual({
            vector: { x: 0, y: 3, z: 2 },
            materialId: 0
        });
        expect(geometryList!.geometries[0].triangleInformation[249]).toStrictEqual({
            vector: { x: 239, y: 245, z: 243 },
            materialId: 3,
        });

        expect(geometryList!.geometries[14].triangleInformation[0]).toStrictEqual({
            vector: { x: 789, y: 787, z: 345 },
            materialId: 0,
        });
        expect(geometryList!.geometries[14].triangleInformation[1709]).toStrictEqual({
            vector: { x: 1923, y: 1924, z: 1921 },
            materialId: 15,
        });
    });

    test('geometries - vertex colors', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].vertexColorInformation).toHaveLength(0);
        expect(geometryList!.geometries[14].vertexColorInformation).toHaveLength(0);
    });

    test('geometries - vertex colors', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].vertexColorInformation).toHaveLength(0);
        expect(geometryList!.geometries[14].vertexColorInformation).toHaveLength(0);
    });

    test('geometries - texture mapping', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].textureCoordinatesCount).toBe(1);
        expect(geometryList!.geometries[3].textureCoordinatesCount).toBe(1);
        expect(geometryList!.geometries[14].textureCoordinatesCount).toBe(2);

        expect(geometryList!.geometries[0].textureMappingInformation).toHaveLength(1);
        expect(geometryList!.geometries[3].textureMappingInformation).toHaveLength(1);
        expect(geometryList!.geometries[14].textureMappingInformation).toHaveLength(2);

        expect(geometryList!.geometries[0].textureMappingInformation[0]).toHaveLength(298);

        expect(geometryList!.geometries[0].textureMappingInformation[0][0]).toStrictEqual({ u: 0, v: 0 });
        expect(geometryList!.geometries[0].textureMappingInformation[0][3]).toStrictEqual({ u: 0, v: 0 });
        expect(geometryList!.geometries[0].textureMappingInformation[0][4]).toStrictEqual({
            u: expect.closeTo(0.25177517533302307, FLOATING_POINT_ERROR),
            v: expect.closeTo(0.21977180242538452, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[0].textureMappingInformation[0][297]).toStrictEqual({
            u: expect.closeTo(0.47249314188957214, FLOATING_POINT_ERROR),
            v: expect.closeTo(0.7319334745407104, FLOATING_POINT_ERROR),
        });

        expect(geometryList!.geometries[14].textureMappingInformation[0]).toHaveLength(1970);
        expect(geometryList!.geometries[14].textureMappingInformation[1]).toHaveLength(1970);

        expect(geometryList!.geometries[14].textureMappingInformation[0][0]).toStrictEqual({
            u: expect.closeTo(0.5662949681282043, FLOATING_POINT_ERROR),
            v: expect.closeTo(0.3044554591178894, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[14].textureMappingInformation[0][1969]).toStrictEqual({
            u: expect.closeTo(0.599575400352478, FLOATING_POINT_ERROR),
            v: expect.closeTo(0.9228058457374573, FLOATING_POINT_ERROR),
        });

        expect(geometryList!.geometries[14].textureMappingInformation[1][0]).toStrictEqual({
            u: expect.closeTo(0.9831116199493408, FLOATING_POINT_ERROR),
            v: expect.closeTo(2.8383376598358154, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[14].textureMappingInformation[1][1969]).toStrictEqual({
            u: expect.closeTo(0.9713996648788452, FLOATING_POINT_ERROR),
            v: expect.closeTo(2.7169623374938965, FLOATING_POINT_ERROR),
        });
    });
    
    test('geometries - materials', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].materialList.materialInstanceCount).toBe(4);
        expect(geometryList!.geometries[14].materialList.materialInstanceCount).toBe(16);

        expect(geometryList!.geometries[0].materialList.materialData).toHaveLength(4);
        expect(geometryList!.geometries[14].materialList.materialData).toHaveLength(16);

        expect(geometryList!.geometries[0].materialList.materialData[0].isTextured).toBeFalsy();
        expect(geometryList!.geometries[0].materialList.materialData[0].color).toStrictEqual({ r: 0, g: 0, b: 0, a: 255 });
        expect(geometryList!.geometries[0].materialList.materialData[0].ambient).toBe(1);
        expect(geometryList!.geometries[0].materialList.materialData[0].diffuse).toBe(1);
        expect(geometryList!.geometries[0].materialList.materialData[0].specular).toBe(0);
        expect(geometryList!.geometries[0].materialList.materialData[0].texture).toBeUndefined();

        expect(geometryList!.geometries[0].materialList.materialData[1].isTextured).toBeTruthy();
        expect(geometryList!.geometries[0].materialList.materialData[1].color).toStrictEqual({ r: 255, g: 255, b: 255, a: 255 });
        expect(geometryList!.geometries[0].materialList.materialData[1].ambient).toBe(0.5);

        expect(geometryList!.geometries[0].materialList.materialData[2].texture).toBeDefined();
        expect(geometryList!.geometries[0].materialList.materialData[2].texture).toStrictEqual({
            textureFiltering: 6,
            textureName: 'infernus92wheel32',
            uAddressing: 1,
            vAddressing: 1,
            usesMipLevels: true,
        });

        expect(geometryList!.geometries[0].materialList.materialData[3].isTextured).toBeTruthy();
        expect(geometryList!.geometries[0].materialList.materialData[3].ambient).toBeCloseTo(0.4000000059604645, FLOATING_POINT_ERROR);
        expect(geometryList!.geometries[0].materialList.materialData[3].texture).toBeDefined();
        expect(geometryList!.geometries[0].materialList.materialData[3].texture).toStrictEqual({
            textureFiltering: 6,
            textureName: 'infernus92interior128',
            uAddressing: 1,
            vAddressing: 1,
            usesMipLevels: true,
        });
    });

    test('geometries - bin mesh', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].binMesh.meshCount).toBe(4);
        expect(geometryList!.geometries[14].binMesh.meshCount).toBe(16);

        expect(geometryList!.geometries[0].binMesh.meshes).toHaveLength(4);
        expect(geometryList!.geometries[14].binMesh.meshes).toHaveLength(16);

        expect(geometryList!.geometries[0].binMesh.meshes[0].indexCount).toBe(4);
        expect(geometryList!.geometries[0].binMesh.meshes[3].indexCount).toBe(210);

        expect(geometryList!.geometries[0].binMesh.meshes[0].indices).toHaveLength(4);
        expect(geometryList!.geometries[0].binMesh.meshes[3].indices).toHaveLength(210);

        expect(geometryList!.geometries[14].binMesh.meshes[15].indices[0]).toBe(1937);
        expect(geometryList!.geometries[14].binMesh.meshes[15].indices[100]).toBe(1909);

        expect(geometryList!.geometries[14].binMesh.meshes[14].materialIndex).toBe(11);
    });

    test('geometries - bounding sphere', () => {
        const geometryList = rwDff.geometryList;

        expect(geometryList!.geometries[0].boundingSphere).toStrictEqual({
            vector: {
                x: expect.closeTo(0.00005014240741729736, FLOATING_POINT_ERROR),
                y: expect.closeTo(1.4901161193847656e-8, FLOATING_POINT_ERROR),
                z: expect.closeTo(1.4901161193847656e-8, FLOATING_POINT_ERROR),
            },
            radius: expect.closeTo(0.37136194109916687, FLOATING_POINT_ERROR),
        });
        expect(geometryList!.geometries[14].boundingSphere).toStrictEqual({
            vector: {
                x: expect.closeTo(-5.364418029785156e-7, FLOATING_POINT_ERROR),
                y: expect.closeTo(0.15884768962860107, FLOATING_POINT_ERROR),
                z: expect.closeTo(0.011729836463928223, FLOATING_POINT_ERROR),
            },
            radius: expect.closeTo(2.849857807159424, FLOATING_POINT_ERROR),
        });
    });
});
