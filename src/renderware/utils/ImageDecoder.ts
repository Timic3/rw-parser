// Source: https://github.com/Parik27/DragonFF/blob/master/gtaLib/txd.py
export class ImageDecoder {

	static readUInt16LE(buf: Uint8Array, offset: number): number {
		return buf[offset] | (buf[offset + 1] << 8);
	}

	static readUInt32LE(buf: Uint8Array, offset: number): number {
		return (
			buf[offset] |
			(buf[offset + 1] << 8) |
			(buf[offset + 2] << 16) |
			(buf[offset + 3] << 24)
		);
	}

	static decode565(bits: number): [number, number, number] {
		const r = Math.round(((bits >> 11) & 0b11111)  * 255 / 31);
		const g = Math.round(((bits >> 5)  & 0b111111) * 255 / 63);
		const b = Math.round((bits         & 0b11111)  * 255 / 31);
		return [r, g, b];
	}

	static decode555(bits:number): [number, number, number] {
		const r = Math.round(((bits >> 10) & 0b11111) * 255 / 31);
		const g = Math.round(((bits >> 5)  & 0b11111) * 255 / 31);
		const b = Math.round((bits         & 0b11111) * 255 / 31);
		return [r, g, b];
	}

	static decode1555(bits: number): [number, number, number, number] {
		const a = Math.round(((bits >> 15) & 0b1)     * 255);
		const r = Math.round(((bits >> 10) & 0b11111) * 255 / 31);
		const g = Math.round(((bits >> 5)  & 0b11111) * 255 / 31);
		const b = Math.round((bits         & 0b11111) * 255 / 31);
		return [a, r, g, b];
	}

	static decode4444(bits: number): [number, number, number, number] {
		const a = Math.round(((bits >> 12) & 0b1111) * 255 / 15);
		const r = Math.round(((bits >> 8)  & 0b1111) * 255 / 15);
		const g = Math.round(((bits >> 4)  & 0b1111) * 255 / 15);
		const b = Math.round((bits         & 0b1111) * 255 / 15);
		return [a, r, g, b];
	}

	// Using if color0 > color1 on bcN
	static color2Interpolation(color0:number, color1:number): number {
		return (2 * color0 + color1) / 3;
	}

	// Using if color0 <= color1 on bcN
	static color2Average(color0:number, color1:number): number {
		return (color0 + color1) / 2;
	}

	// Using if color0 > color1 on bcN
	static color3Interpolation(color0:number, color1:number): number {
		return (2 * color1 + color0) / 3;
	}

	static bc1(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let y = 0; y < height; y += 4) {
			for (let x = 0; x < width; x += 4) {
				const color0 = ImageDecoder.readUInt16LE(data, offset);
				const color1 = ImageDecoder.readUInt16LE(data, offset + 2);
				let bits = ImageDecoder.readUInt32LE(data, offset + 4);
				offset += 8;

				const [r0, g0, b0] = ImageDecoder.decode565(color0);
				const [r1, g1, b1] = ImageDecoder.decode565(color1);

				for (let j = 0; j < 4; j++) {
					for (let i = 0; i < 4; i++) {
						const control = bits & 3;
						bits >>= 2;

						let [r, g, b, a] = [0,0,0,0];

						switch (control) {
							case 0:
								[r, g, b, a] = [r0, g0, b0, 0xff];
								break;
							case 1:
								[r, g, b, a] = [r1, g1, b1, 0xff];
								break;
							case 2:
								if (color0 > color1) {
									r = ImageDecoder.color2Interpolation(r0, r1);
									g = ImageDecoder.color2Interpolation(g0, g1);
									b = ImageDecoder.color2Interpolation(b0, b1);
									a = 0xff;
								} else {
									r = ImageDecoder.color2Average(r0, r1);
									g = ImageDecoder.color2Average(g0, g1);
									b = ImageDecoder.color2Average(b0, b1);
									a = 0xff;
								}
								break;
							case 3:
								if (color0 > color1) {
									r = ImageDecoder.color3Interpolation(r0, r1);
									g = ImageDecoder.color3Interpolation(g0, g1);
									b = ImageDecoder.color3Interpolation(b0, b1);
									a = 0xff;
								} else {
									[r, g, b, a] = [0, 0, 0, 0];
								}
								break;
						}

						const idx = 4 * ((y + j) * width + (x + i));
						rgba[idx + 0] = r;
						rgba[idx + 1] = g;
						rgba[idx + 2] = b;
						rgba[idx + 3] = 0xff;
					}
				}
			}
		}

		return rgba;
	}

	static bc2(data: Uint8Array, width: number, height: number, premultiplied: boolean): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let y = 0; y < height; y += 4) {
			for (let x = 0; x < width; x += 4) {
				const alpha0 = ImageDecoder.readUInt16LE(data, offset);
				const alpha1 = ImageDecoder.readUInt16LE(data, offset + 2);
				const alpha2 = ImageDecoder.readUInt16LE(data, offset + 4);
				const alpha3 = ImageDecoder.readUInt16LE(data, offset + 6);
				const color0 = ImageDecoder.readUInt16LE(data, offset + 8);
				const color1 = ImageDecoder.readUInt16LE(data, offset + 10);
				let bits = ImageDecoder.readUInt32LE(data, offset + 12);
				offset += 16;

				const [r0, g0, b0] = ImageDecoder.decode565(color0);
				const [r1, g1, b1] = ImageDecoder.decode565(color1);
				const alphas = [alpha0, alpha1, alpha2, alpha3];

				for (let j = 0; j < 4; j++) {
					for (let i = 0; i < 4; i++) {
						const control = bits & 3;
						bits >>= 2;

						let [r, g, b] = [0,0,0];

						switch (control) {
							case 0:
								[r, g, b] = [r0, g0, b0];
								break;
							case 1:
								[r, g, b] = [r1, g1, b1];
								break;
							case 2:
								if (color0 > color1) {
									r = ImageDecoder.color2Interpolation(r0, r1);
									g = ImageDecoder.color2Interpolation(g0, g1);
									b = ImageDecoder.color2Interpolation(b0, b1);
								} else {
									r = ImageDecoder.color2Average(r0, r1);
									g = ImageDecoder.color2Average(g0, g1);
									b = ImageDecoder.color2Average(b0, b1);
								}
								break;
							case 3:
								if (color0 > color1) {
									r = ImageDecoder.color3Interpolation(r0, r1);
									g = ImageDecoder.color3Interpolation(g0, g1);
									b = ImageDecoder.color3Interpolation(b0, b1);
								} else {
									[r, g, b] = [0, 0, 0];
								}
								break;
						}

						const a = ((alphas[j] >> (i * 4)) & 0xf) * 0x11;

						const idx = 4 * ((y + j) * width + (x + i));

						if (premultiplied && a > 0) {
							r = Math.min(Math.round((r * 255) / a), 255);
							g = Math.min(Math.round((g * 255) / a), 255);
							b = Math.min(Math.round((b * 255) / a), 255);
						}

						rgba[idx + 0] = r;
						rgba[idx + 1] = g;
						rgba[idx + 2] = b;
						rgba[idx + 3] = a;
					}
				}
			}
		}

		return rgba;
	}

	static bc3(data: Uint8Array, width: number, height: number, premultiplied: boolean): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let y = 0; y < height; y += 4) {
			for (let x = 0; x < width; x += 4) {
				const alpha0 = data[offset];
				const alpha1 = data[offset + 1];
				const alpha2 = ImageDecoder.readUInt16LE(data, offset + 2);
				const alpha3 = ImageDecoder.readUInt16LE(data, offset + 4);
				const alpha4 = ImageDecoder.readUInt16LE(data, offset + 6);
				const color0 = ImageDecoder.readUInt16LE(data, offset + 8);
				const color1 = ImageDecoder.readUInt16LE(data, offset + 10);
				let bits = ImageDecoder.readUInt32LE(data, offset + 12);
				offset += 16;

				const [r0, g0, b0] = ImageDecoder.decode565(color0);
				const [r1, g1, b1] = ImageDecoder.decode565(color1);

				let alphas: number[];
				if (alpha0 > alpha1) {
					alphas = [
						alpha0,
						alpha1,
						Math.round(alpha0 * (6 / 7) + alpha1 * (1 / 7)),
						Math.round(alpha0 * (5 / 7) + alpha1 * (2 / 7)),
						Math.round(alpha0 * (4 / 7) + alpha1 * (3 / 7)),
						Math.round(alpha0 * (3 / 7) + alpha1 * (4 / 7)),
						Math.round(alpha0 * (2 / 7) + alpha1 * (5 / 7)),
						Math.round(alpha0 * (1 / 7) + alpha1 * (6 / 7))
					];
				} else {
					alphas = [
						alpha0,
						alpha1,
						Math.round(alpha0 * (4 / 5) + alpha1 * (1 / 5)),
						Math.round(alpha0 * (3 / 5) + alpha1 * (2 / 5)),
						Math.round(alpha0 * (2 / 5) + alpha1 * (3 / 5)),
						Math.round(alpha0 * (1 / 5) + alpha1 * (4 / 5)),
						0,
						255
					];
				}

				const alphaIndices = [alpha4, alpha3, alpha2];

				for (let j = 0; j < 4; j++) {
					for (let i = 0; i < 4; i++) {
						const control = bits & 3;
						bits >>= 2;

						let [r, g, b] = [0,0,0];

						switch (control) {
							case 0:
								[r, g, b] = [r0, g0, b0];
								break;
							case 1:
								[r, g, b] = [r1, g1, b1];
								break;
							case 2:
								if (color0 > color1) {
									r = ImageDecoder.color2Interpolation(r0, r1);
									g = ImageDecoder.color2Interpolation(g0, g1);
									b = ImageDecoder.color2Interpolation(b0, b1);
								} else {
									r = ImageDecoder.color2Average(r0, r1);
									g = ImageDecoder.color2Average(g0, g1);
									b = ImageDecoder.color2Average(b0, b1);
								}
								break;
							case 3:
								if (color0 > color1) {
									r = ImageDecoder.color3Interpolation(r0, r1);
									g = ImageDecoder.color3Interpolation(g0, g1);
									b = ImageDecoder.color3Interpolation(b0, b1);
								} else {
									[r, g, b] = [0, 0, 0];
								}
								break;
						}

						const shift = 3 * (15 - ((3 - i) + j * 4));
						const shiftS = shift % 16;
						const rowS = Math.floor(shift / 16);
						const rowE = Math.floor((shift + 2) / 16);

						let alphaIndex = (alphaIndices[2 - rowS] >> shiftS) & 0x7;

						if (rowS !== rowE) {
							const shift_e = 16 - shiftS;
							alphaIndex += (alphaIndices[2 - rowE] & ((1 << (3 - shift_e)) - 1)) << shift_e;
						}

						const a = alphas[alphaIndex];

						const idx = 4 * ((y + j) * width + (x + i));

						if (premultiplied && a > 0) {
							r = Math.min(Math.round((r * 255) / a), 255);
							g = Math.min(Math.round((g * 255) / a), 255);
							b = Math.min(Math.round((b * 255) / a), 255);
						}

						rgba[idx + 0] = r;
						rgba[idx + 1] = g;
						rgba[idx + 2] = b;
						rgba[idx + 3] = a;
					}
				}
			}
		}

		return rgba;
	}

	static bgra1555(data: Uint8Array, width: number, height: number): Uint8Array {
		const rbga = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let i = 0; i < data.length; i += 2) {
			const color = ImageDecoder.readUInt16LE(data, i);
			const [a, r, g, b] = ImageDecoder.decode1555(color);

			rbga[offset++] = r;
			rbga[offset++] = g;
			rbga[offset++] = b;
			rbga[offset++] = a;
		}

		return rbga;
	}

	static bgra4444(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let i = 0; i < data.length; i += 2) {
			const color = ImageDecoder.readUInt16LE(data, i);
			const [a, r, g, b] = ImageDecoder.decode4444(color);

			rgba[offset++] = r;
			rgba[offset++] = g;
			rgba[offset++] = b;
			rgba[offset++] = a;
		}

		return rgba;
	}

	static bgra555(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let i = 0; i < data.length; i += 2) {
			const color = ImageDecoder.readUInt16LE(data, i);
			const [r, g, b] = ImageDecoder.decode555(color);

			rgba[offset++] = r;
			rgba[offset++] = g;
			rgba[offset++] = b;
			rgba[offset++] = 0xff;
		}

		return rgba;
	}

	static bgra565(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let i = 0; i < data.length; i += 2) {
			const color = ImageDecoder.readUInt16LE(data, i);
			const [r, g, b] = ImageDecoder.decode565(color);

			rgba[offset++] = r;
			rgba[offset++] = g;
			rgba[offset++] = b;
			rgba[offset++] = 0xff;
		}

		return rgba;
	}

	static bgra888(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		for (let i = 0; i < data.length; i += 4) {
			rgba[i + 0] = data[i + 2];
			rgba[i + 1] = data[i + 1];
			rgba[i + 2] = data[i + 0];
			rgba[i + 3] = 0xff;
		}

		return rgba;
	}

	static bgra8888(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		for (let i = 0; i < data.length; i += 4) {
			rgba[i + 0] = data[i + 2];
			rgba[i + 1] = data[i + 1];
			rgba[i + 2] = data[i + 0];
			rgba[i + 3] = data[i + 3];
		}

		return rgba;
	}

	static lum8(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);

		for (let i = 0; i < data.length; i++) {
			const offset = i * 4;
			const luminance = data[i];
			rgba[offset + 0] = luminance; // R
			rgba[offset + 1] = luminance; // G
			rgba[offset + 2] = luminance; // B
			rgba[offset + 3] = 0xff;
		}

		return rgba;
	}

	static lum8a8(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let i = 0; i < data.length; i += 2) {
			const luminance = data[i];
			const alpha = data[i + 1];

			rgba[offset++] = luminance;
			rgba[offset++] = luminance;
			rgba[offset++] = luminance;
			rgba[offset++] = alpha;
		}

		return rgba;
	}

	static pal4(data: Uint8Array, palette: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let i = 0; i < data.length; i++) {
			const b = data[i];
			const idx1 = (b >> 4) & 0xf;
			const idx2 = b & 0xf;

			// Copying RGBA from the palette for two pixels
			rgba[offset++] = palette[idx1 * 4 + 0]; // R
			rgba[offset++] = palette[idx1 * 4 + 1]; // G
			rgba[offset++] = palette[idx1 * 4 + 2]; // B
			rgba[offset++] = palette[idx1 * 4 + 3]; // A

			rgba[offset++] = palette[idx2 * 4 + 0]; // R
			rgba[offset++] = palette[idx2 * 4 + 1]; // G
			rgba[offset++] = palette[idx2 * 4 + 2]; // B
			rgba[offset++] = palette[idx2 * 4 + 3]; // A
		}

		return rgba;
	}

	static pal4NoAlpha(data: Uint8Array, palette: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		let offset = 0;

		for (let i = 0; i < data.length; i++) {
			const b = data[i];
			const colorIndex1 = (b >> 4) & 0xf;
			const colorIndex2 = b & 0xf;

			// First pixel
			rgba[offset++] = palette[colorIndex1 * 4 + 0]; // R
			rgba[offset++] = palette[colorIndex1 * 4 + 1]; // G
			rgba[offset++] = palette[colorIndex1 * 4 + 2]; // B
			rgba[offset++] = 0xff;

			// Second pixel
			rgba[offset++] = palette[colorIndex2 * 4 + 0]; // R
			rgba[offset++] = palette[colorIndex2 * 4 + 1]; // G
			rgba[offset++] = palette[colorIndex2 * 4 + 2]; // B
			rgba[offset++] = 0xff;
		}

		return rgba;
	}

	static pal8(data: Uint8Array, palette: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);

		for (let i = 0; i < data.length; i++) {
			const colorIndex = data[i];

			// Copy RGBA from palette
			rgba[i * 4 + 0] = palette[colorIndex * 4 + 0]; // R
			rgba[i * 4 + 1] = palette[colorIndex * 4 + 1]; // G
			rgba[i * 4 + 2] = palette[colorIndex * 4 + 2]; // B
			rgba[i * 4 + 3] = palette[colorIndex * 4 + 3]; // A
		}

		return rgba;
	}

	static pal8NoAlpha(data: Uint8Array, palette: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);

		for (let i = 0; i < data.length; i++) {
			const colorIndex = data[i];

			// Copy RGB from palette
			rgba[i * 4 + 0] = palette[colorIndex * 4 + 0]; // R
			rgba[i * 4 + 1] = palette[colorIndex * 4 + 1]; // G
			rgba[i * 4 + 2] = palette[colorIndex * 4 + 2]; // B
			rgba[i * 4 + 3] = 0xff;
		}

		return rgba;
	}
}