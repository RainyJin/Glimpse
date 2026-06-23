export interface Asset {
  id: string;
  name: string;
  path: string;
  type: "image" | "video" | "document" | "file";
  folderId: string;
  dateAdded: string; // ← STRING, not Date
  dateModified: string; // ← STRING, not Date
  fileSize: number;
  thumbnail?: string;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  parentFolderId: string | null;
  dateCreated: string;
}
