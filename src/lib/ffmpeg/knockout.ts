/**
 * BFS Flood-Fill Background Knockout Algorithm
 * Isolates 3D floating dioramas by flood-filling the solid background from the 4 image borders.
 */

import { KnockoutOptions } from "../types/pipeline";

export interface RgbaImage {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

export class BackgroundKnockout {
  public floodFillKnockout(
    image: RgbaImage,
    options?: KnockoutOptions
  ): RgbaImage {
    const { width, height, data } = image;
    const tolerance = options?.tolerance ?? 36;
    const edgeSoftness = options?.edgeSoftness ?? 2;
    const borders = options?.floodFillSeedBorders ?? ["top", "bottom", "left", "right"];

    const targetBg = options?.targetBackgroundColor || {
      r: data[0],
      g: data[1],
      b: data[2],
    };

    const totalPixels = width * height;
    const visited = new Uint8Array(totalPixels);
    const queue: number[] = [];

    const enqueue = (x: number, y: number) => {
      const idx = y * width + x;
      if (!visited[idx]) {
        visited[idx] = 1;
        queue.push(idx);
      }
    };

    if (borders.includes("top")) {
      for (let x = 0; x < width; x++) enqueue(x, 0);
    }
    if (borders.includes("bottom")) {
      for (let x = 0; x < width; x++) enqueue(x, height - 1);
    }
    if (borders.includes("left")) {
      for (let y = 0; y < height; y++) enqueue(0, y);
    }
    if (borders.includes("right")) {
      for (let y = 0; y < height; y++) enqueue(width - 1, y);
    }

    const colorDistance = (r: number, g: number, b: number): number => {
      const dr = r - targetBg.r;
      const dg = g - targetBg.g;
      const db = b - targetBg.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    let head = 0;
    while (head < queue.length) {
      const pixelIdx = queue[head++];
      const x = pixelIdx % width;
      const y = Math.floor(pixelIdx / width);
      const byteOffset = pixelIdx * 4;

      const r = data[byteOffset];
      const g = data[byteOffset + 1];
      const b = data[byteOffset + 2];

      const dist = colorDistance(r, g, b);

      if (dist <= tolerance) {
        data[byteOffset + 3] = 0;

        if (x > 0) {
          const nIdx = y * width + (x - 1);
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
        if (x < width - 1) {
          const nIdx = y * width + (x + 1);
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
        if (y > 0) {
          const nIdx = (y - 1) * width + x;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
        if (y < height - 1) {
          const nIdx = (y + 1) * width + x;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      } else if (dist <= tolerance + (edgeSoftness * 12)) {
        const featherFactor = (dist - tolerance) / (edgeSoftness * 12);
        data[byteOffset + 3] = Math.round(featherFactor * 255);
      }
    }

    return { data, width, height };
  }

  public async knockoutBuffer(
    buffer: Buffer,
    options?: KnockoutOptions
  ): Promise<Buffer> {
    const str = buffer.toString("utf8");
    if (str.includes("<svg")) {
      const transparentSvg = str.replace(
        /<rect width="100%" height="100%" fill="[^"]*" \/>/,
        `<rect width="100%" height="100%" fill="none" />`
      );
      return Buffer.from(transparentSvg, "utf8");
    }

    return buffer;
  }
}

export const backgroundKnockout = new BackgroundKnockout();
