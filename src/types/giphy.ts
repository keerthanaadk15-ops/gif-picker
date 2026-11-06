export interface GiphyImageData {
  url: string;
  mp4: string;
  mp4_size?: string;
  width: string;
  height: string;
  size?: string;
  frames?: string;
  webp?: string;
}

export interface GiphyMp4Only {
  mp4: string;
  mp4_size: string;
  width: string;
  height: string;
}

export interface GiphyGif {
  type: string;
  id: string;
  title: string;
  /** Canonical GIPHY page URL – this is what gets copied to share in chats */
  url: string;
  embed_url: string;
  images: {
    /** Full-resolution, used to copy the share URL */
    original: GiphyImageData;
    /** MP4-only, smaller than original – used for in-app video rendering */
    original_mp4: GiphyMp4Only;
    /** Fixed 200px height – ideal for grid cards */
    fixed_height: GiphyImageData;
    downsized: GiphyImageData;
  };
}

export interface GiphyPagination {
  total_count: number;
  count: number;
  offset: number;
}

export interface GiphyMeta {
  status: number;
  msg: string;
  response_id: string;
}

export interface GiphySearchResponse {
  data: GiphyGif[];
  pagination: GiphyPagination;
  meta: GiphyMeta;
}

export type SearchState = 'idle' | 'loading' | 'success' | 'error' | 'rate-limited';
