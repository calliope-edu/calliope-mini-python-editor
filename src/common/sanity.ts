/**
 * Common types for content originally authored in Sanity.
 *
 * The editor no longer fetches Sanity at runtime; documentation content
 * lives as JSON snapshots under src/documentation/cms-snapshot/. See
 * bin/extract-cms.js to refresh them. Images are still served from the
 * Sanity image CDN via <img src> (no CORS involvement).
 */

export interface PortableTextBlock {
  _type: "block";
  _key: string;
  // Partial/lax modelling. We pass this straight to Sanity's rendering API.
  children: any;
  markDefs: any;
  style: string;
}

export type PortableText = Array<
  PortableTextBlock | { _type: string; children?: any; [other: string]: any }
>;

/**
 * Common image type.
 */
export interface SimpleImage {
  _type: "simpleImage";
  alt?: string;
  // The Sanity image asset.
  asset: any;
}

/**
 * Sanity's slug type.
 */
export interface Slug {
  _type: "slug";
  current: string;
}
