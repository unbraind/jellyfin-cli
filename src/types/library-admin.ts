export interface AddVirtualFolderParams {
  name: string;
  collectionType?: string;
  paths?: string[];
  refreshLibrary?: boolean;
}

export interface AddMediaPathParams {
  name: string;
  path: string;
  networkPath?: string;
  refreshLibrary?: boolean;
}

export interface UpdateMediaPathParams {
  name: string;
  pathInfo: {
    Path?: string | null;
    NetworkPath?: string | null;
  };
}
