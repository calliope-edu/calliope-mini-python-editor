/**
 * (c) 2022, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * Drop-in replacement for the Sanity image URL builder. CMS images are
 * shipped in the build under public/cms/images/<id>-<WxH>.<ext> — see
 * bin/extract-cms-images.js. The builder ignores width/dpr/quality/etc.
 * transformations and emits the original-resolution local URL.
 */

export const defaultQuality = 80;

const refToFilename = (ref: string): string => {
  // "image-abc-1024x768-jpg" -> "abc-1024x768.jpg"
  const without = ref.replace(/^image-/, "");
  const lastDash = without.lastIndexOf("-");
  if (lastDash === -1) return without;
  return without.slice(0, lastDash) + "." + without.slice(lastDash + 1);
};

class ChainableImage {
  constructor(private ref: string) {}
  width(_n: number) { return this; }
  height(_n: number) { return this; }
  dpr(_n: number) { return this; }
  quality(_n: number) { return this; }
  fit(_s: string) { return this; }
  auto(_s: string) { return this; }
  url(): string {
    if (!this.ref) return "";
    const base = process.env.PUBLIC_URL || "";
    return `${base}/cms/images/${refToFilename(this.ref)}`;
  }
}

class ImageBuilder {
  image(asset: { _ref?: string; _type?: string } | null | undefined): ChainableImage {
    return new ChainableImage(asset?._ref ?? "");
  }
}

export const imageUrlBuilder = new ImageBuilder();

export const getAspectRatio = (imageRef: string): string | undefined => {
  const dimensionsArr = imageRef.match(/\d+x\d+/g);
  if (!dimensionsArr) {
    return undefined;
  }
  const dimensions = dimensionsArr.join().split("x");
  const [width, height] = dimensions.map((n: string) => Number(n));
  return (width / height).toString();
};
