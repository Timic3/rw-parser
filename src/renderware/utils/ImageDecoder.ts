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
		const r = (bits >> 11) & 0b11111;
		const g = (bits >> 5)  & 0b111111;
		const b = bits         & 0b11111;

		return [
			(r << 3) | (r >> 2),
			(g << 2) | (g >> 4),
			(b << 3) | (b >> 2)
		];
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

	/*
		bc1 - block compression format, using for DXT1
		compress 4x4 block of pixels
		format:
		+---------------+
		|     color0    | color0 in palette. 16bit (RGB 565 format)
		+---------------+
		|     color1    | color1 in palette. 16bit (RGB 565 format)
		+---+---+---+---+
		| a | b | c | d | a-p color palette index 2bit * 16
		+---+---+---+---+
		| e | f | g | h |
		+---+---+---+---+
		| i | j | k | l |
		+---+---+---+---+
		| m | n | o | p | total: 8byte in 4x4 colors
		+---+---+---+---+

		color2 and color3 in the palette are calculated by interpolating other colors or choosing the average between them.
		color0 > color1 => interpolation, else => average
	*/
	static bc1(data: Uint8Array, width: number, height: number): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		const colorPalette = new Uint8Array(16);
		let offset = 0;

		for (let y = 0; y < height; y += 4) {
			for (let x = 0; x < width; x += 4) {
				const color0 = ImageDecoder.readUInt16LE(data, offset);
				const color1 = ImageDecoder.readUInt16LE(data, offset + 2);
				let colorBits = ImageDecoder.readUInt32LE(data, offset + 4);
				offset += 8;

				let [c0r, c0g, c0b] = ImageDecoder.decode565(color0);
				let [c1r, c1g, c1b] = ImageDecoder.decode565(color1);

				if (color0 > color1) {
					colorPalette[0] = c0r; colorPalette[1] = c0g; colorPalette[2] = c0b;
					colorPalette[4] = c1r; colorPalette[5] = c1g; colorPalette[6] = c1b;
					colorPalette[8] = (2 * c0r + c1r + 1) / 3;
					colorPalette[9] = (2 * c0g + c1g + 1) / 3;
					colorPalette[10] = (2 * c0b + c1b + 1) / 3;
					colorPalette[12] = (c0r + 2 * c1r + 1) / 3;
					colorPalette[13] = (c0g + 2 * c1g + 1) / 3;
					colorPalette[14] = (c0b + 2 * c1b + 1) / 3;
				}
				else {
					colorPalette[0] = c0r; colorPalette[1] = c0g; colorPalette[2] = c0b;
					colorPalette[4] = c1r; colorPalette[5] = c1g; colorPalette[6] = c1b;
					colorPalette[8] = (c0r + c1r + 1) >> 1;
					colorPalette[9] = (c0g + c1g + 1) >> 1;
					colorPalette[10] = (c0b + c1b + 1) >> 1;
					colorPalette[12] = 0; colorPalette[13] = 0; colorPalette[14] = 0;
				}

				const baseIndex = (y * width + x) * 4;
				for (let k = 0; k < 16; k++) {
					const colorIdx = colorBits & 0x3;
					colorBits >>>= 2;

					const j = k >> 2;
					const i = k & 3;
					const idx = baseIndex + ((j * width + i) << 2);

					rgba[idx + 0] = colorPalette[colorIdx * 4];
					rgba[idx + 1] = colorPalette[colorIdx * 4 + 1];
					rgba[idx + 2] = colorPalette[colorIdx * 4 + 2];

					if (color0 <= color1 && colorIdx === 3) {
						rgba[idx + 3] = 0;
					} else {
						rgba[idx + 3] = 255;
					}
				}
			}
		}

		return rgba;
	}

	/*
		bc2 - block compression format, using for DXT2 and DXT3
		compress 4x4 block of pixels with 4x4 4bit alpha
		format:
		+---+---+---+---+
		| a | b | c | d | a-p pixel alpha. 4bit * 16
		+---+---+---+---+
		| e | f | g | h |
		+---+---+---+---+
		| i | j | k | l |
		+---+---+---+---+
		| m | n | o | p |
		+---+---+---+---+
		|               | bc1 collor compression. 8byte
		|   bc1 block   |
		|               | total: 16byte in 4x4 colors
		+---------------+

		in DXT2, the color data is interpreted as being premultiplied by alpha
	*/
	static bc2(data: Uint8Array, width: number, height: number, premultiplied: boolean): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		const colorPalette = new Uint8Array(16);

		const alphaTable = new Uint8Array(16);
		for (let i = 0; i < 16; i++) {
			alphaTable[i] = (i * 255 + 7.5) / 15 | 0;
		}

		let offset = 0;

		for (let y = 0; y < height; y += 4) {
			for (let x = 0; x < width; x += 4) {
				const alpha0 = ImageDecoder.readUInt32LE(data, offset);
				const alpha1 = ImageDecoder.readUInt32LE(data, offset + 4);
				offset += 8;

				const color0 = ImageDecoder.readUInt16LE(data, offset);
				const color1 = ImageDecoder.readUInt16LE(data, offset + 2);
				let colorBits = ImageDecoder.readUInt32LE(data, offset + 4);
				offset += 8;

				let [c0r, c0g, c0b] = ImageDecoder.decode565(color0);
				let [c1r, c1g, c1b] = ImageDecoder.decode565(color1);

				if (color0 > color1) {
					colorPalette[0] = c0r; colorPalette[1] = c0g; colorPalette[2] = c0b;
					colorPalette[4] = c1r; colorPalette[5] = c1g; colorPalette[6] = c1b;
					colorPalette[8] = (2 * c0r + c1r + 1) / 3;
					colorPalette[9] = (2 * c0g + c1g + 1) / 3;
					colorPalette[10] = (2 * c0b + c1b + 1) / 3;
					colorPalette[12] = (c0r + 2 * c1r + 1) / 3;
					colorPalette[13] = (c0g + 2 * c1g + 1) / 3;
					colorPalette[14] = (c0b + 2 * c1b + 1) / 3;
				}
				else {
					colorPalette[0] = c0r; colorPalette[1] = c0g; colorPalette[2] = c0b;
					colorPalette[4] = c1r; colorPalette[5] = c1g; colorPalette[6] = c1b;
					colorPalette[8] = (c0r + c1r + 1) >> 1;
					colorPalette[9] = (c0g + c1g + 1) >> 1;
					colorPalette[10] = (c0b + c1b + 1) >> 1;
					colorPalette[12] = 0; colorPalette[13] = 0; colorPalette[14] = 0;
				}

				const baseIndex = ((y * width + x) << 2);

				for (let k = 0; k < 16; k++) {
					const j = k >> 2;
					const i = k & 3;

					const idx = baseIndex + ((((j * width + i) << 2)));

					const colorIdx = colorBits & 0x3;
					colorBits >>>= 2;

					rgba[idx + 0] = colorPalette[colorIdx * 4];
					rgba[idx + 1] = colorPalette[colorIdx * 4 + 1];
					rgba[idx + 2] = colorPalette[colorIdx * 4 + 2];

					const bitPos = (j << 2) + i;
					const byteIndex = bitPos >> 3;
					const shift = (bitPos & 7) << 2;

					const alpha4 = ((byteIndex === 0 ? alpha0 : alpha1) >>> shift) & 0xF;
					const alpha = alphaTable[alpha4];

					if (premultiplied && alpha > 0 && alpha < 255) {
						const factor = 255 / alpha;
						rgba[idx + 0] = Math.min(255, Math.round(rgba[idx + 0] * factor));
						rgba[idx + 1] = Math.min(255, Math.round(rgba[idx + 1] * factor));
						rgba[idx + 2] = Math.min(255, Math.round(rgba[idx + 2] * factor));
					}

					rgba[idx + 3] = alpha;
				}
			}
		}

		return rgba;
	}

	/*
		bc3 - block compression format, using for DXT4 and DXT5
		compress 4x4 block of pixels with alpha
		format:
		+---------------+
		|     alpha0    | min alpha value. 8bit
		+---------------+
		|     alpha1    | max alpha value. 8bit
		+---+---+---+---+
		| a | b | c | d | bc1-like alpha block but 3bit * 16 (index in alpha palette)
		+---+---+---+---+
		| e | f | g | h |
		+---+---+---+---+
		| i | j | k | l |
		+---+---+---+---+
		| m | n | o | p |
		+---+---+---+---+
		|               | bc1 color compression. 8byte
		|   bc1 block   |
		|               | total: 16byte in 4x4 colors
		+---------------+

		in DXT4, the color data is interpreted as being premultiplied by alpha
	*/
	static bc3(data: Uint8Array, width: number, height: number, premultiplied: boolean): Uint8Array {
		const rgba = new Uint8Array(4 * width * height);
		const alphaPalette = new Uint8Array(8);
		const colorPalette = new Uint8Array(16);
		const alphaIndices = new Uint8Array(16);
		let offset = 0;

		for (let y = 0; y < height; y += 4) {
			for (let x = 0; x < width; x += 4) {
				const alpha0 = data[offset++];
				const alpha1 = data[offset++];

				const alphaBits = data.subarray(offset, offset + 6);
				offset += 6;

				const color0 = ImageDecoder.readUInt16LE(data, offset);
				const color1 = ImageDecoder.readUInt16LE(data, offset + 2);
				let colorBits = ImageDecoder.readUInt32LE(data, offset + 4);
				offset += 8;

				let [c0r, c0g, c0b] = ImageDecoder.decode565(color0);
				let [c1r, c1g, c1b] = ImageDecoder.decode565(color1);

				if (color0 > color1) {
					colorPalette[0] = c0r; colorPalette[1] = c0g; colorPalette[2] = c0b;
					colorPalette[4] = c1r; colorPalette[5] = c1g; colorPalette[6] = c1b;
					colorPalette[8] = (2 * c0r + c1r + 1) / 3;
					colorPalette[9] = (2 * c0g + c1g + 1) / 3;
					colorPalette[10] = (2 * c0b + c1b + 1) / 3;
					colorPalette[12] = (c0r + 2 * c1r + 1) / 3;
					colorPalette[13] = (c0g + 2 * c1g + 1) / 3;
					colorPalette[14] = (c0b + 2 * c1b + 1) / 3;
				}
				else {
					colorPalette[0] = c0r; colorPalette[1] = c0g; colorPalette[2] = c0b;
					colorPalette[4] = c1r; colorPalette[5] = c1g; colorPalette[6] = c1b;
					colorPalette[8] = (c0r + c1r + 1) >> 1;
					colorPalette[9] = (c0g + c1g + 1) >> 1;
					colorPalette[10] = (c0b + c1b + 1) >> 1;
					colorPalette[12] = 0; colorPalette[13] = 0; colorPalette[14] = 0;
				}

				if (alpha0 > alpha1) {
					alphaPalette[0] = alpha0;
					alphaPalette[1] = alpha1;
					alphaPalette[2] = (alpha0 * 6 + alpha1 * 1 + 3) / 7;
					alphaPalette[3] = (alpha0 * 5 + alpha1 * 2 + 3) / 7;
					alphaPalette[4] = (alpha0 * 4 + alpha1 * 3 + 3) / 7;
					alphaPalette[5] = (alpha0 * 3 + alpha1 * 4 + 3) / 7;
					alphaPalette[6] = (alpha0 * 2 + alpha1 * 5 + 3) / 7;
					alphaPalette[7] = (alpha0 * 1 + alpha1 * 6 + 3) / 7;
				}
				else {
					alphaPalette[0] = alpha0;
					alphaPalette[1] = alpha1;
					alphaPalette[2] = (alpha0 * 4 + alpha1 * 1 + 2) / 5;
					alphaPalette[3] = (alpha0 * 3 + alpha1 * 2 + 2) / 5;
					alphaPalette[4] = (alpha0 * 2 + alpha1 * 3 + 2) / 5;
					alphaPalette[5] = (alpha0 * 1 + alpha1 * 4 + 2) / 5;
					alphaPalette[6] = 0;
					alphaPalette[7] = 255;
				}

				for (let k = 0; k < 16; k++) {
					const bitOffset = k * 3;
					const byteOffset = bitOffset >> 3;
					const shift = bitOffset & 7;

					if (shift <= 5) {
						alphaIndices[k] = (alphaBits[byteOffset] >> shift) & 0x7;
					} else {
						const part1 = (alphaBits[byteOffset] >> shift) & 0x7;
						const part2 = (alphaBits[byteOffset + 1] << (8 - shift)) & 0x7;
						alphaIndices[k] = part1 | part2;
					}
				}

				const baseIndex = (y * width + x) << 2;
				let bits = colorBits;

				for (let k = 0; k < 16; k++) {
					const j = k >> 2;
					const i = k & 3;

					const idx = baseIndex + ((((j * width + i) << 2)));
					const colorIdx = bits & 0x3;
					bits >>>= 2;

					const alpha = alphaPalette[alphaIndices[k] & 0x7];

					rgba[idx + 0] = colorPalette[colorIdx * 4];
					rgba[idx + 1] = colorPalette[colorIdx * 4 + 1];
					rgba[idx + 2] = colorPalette[colorIdx * 4 + 2];
					rgba[idx + 3] = alpha;

					if (premultiplied && alpha > 0 && alpha < 255) {
						const factor = 255 / alpha;
						rgba[idx] = Math.min(255, Math.round(rgba[idx] * factor));
						rgba[idx + 1] = Math.min(255, Math.round(rgba[idx + 1] * factor));
						rgba[idx + 2] = Math.min(255, Math.round(rgba[idx + 2] * factor));
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