/**
 * Defines the add virtual folder params contract used across typed Jellyfin boundaries.
 */
export interface AddVirtualFolderParams {
  name: string;
  collectionType?: string;
  paths?: string[];
  refreshLibrary?: boolean;
}

/**
 * Defines the add media path params contract used across typed Jellyfin boundaries.
 */
export interface AddMediaPathParams {
  name: string;
  path: string;
  networkPath?: string;
  refreshLibrary?: boolean;
}

/**
 * Defines the update media path params contract used across typed Jellyfin boundaries.
 */
export interface UpdateMediaPathParams {
  name: string;
  pathInfo: {
    Path?: string | null;
    NetworkPath?: string | null;
  };
}
