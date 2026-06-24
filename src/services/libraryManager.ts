import path from "path";
import os from "os";
import fs from "fs-extra";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";

const LIBRARY_PATH = path.join(os.homedir(), "GlimpseLibrary");
const GLIMPSE_DIR = path.join(LIBRARY_PATH, ".glimpse");
const DB_PATH = path.join(GLIMPSE_DIR, "glimpse.db");
const THUMBNAILS_DIR = path.join(GLIMPSE_DIR, "thumbnails");

let db: sqlite3.Database | null = null;

/**
 * Initialize the library folder structure and database
 */
export async function initializeLibrary() {
  return new Promise((resolve) => {
    try {
      // Create folders if they don't exist
      fs.ensureDirSync(LIBRARY_PATH);
      fs.ensureDirSync(GLIMPSE_DIR);
      fs.ensureDirSync(THUMBNAILS_DIR);

      // Initialize database
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error("❌ Failed to initialize database:", err);
          resolve({
            success: false,
            error: err.message,
          });
          return;
        }

        // Create tables
        db!.serialize(() => {
          db!.run(`
            CREATE TABLE IF NOT EXISTS folders (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              path TEXT NOT NULL UNIQUE,
              parentFolderId TEXT,
              dateCreated TEXT NOT NULL,
              FOREIGN KEY(parentFolderId) REFERENCES folders(id)
            )
          `);

          db!.run(`
            CREATE TABLE IF NOT EXISTS assets (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              path TEXT NOT NULL UNIQUE,
              type TEXT NOT NULL,
              folderId TEXT NOT NULL,
              dateAdded TEXT NOT NULL,
              dateModified TEXT NOT NULL,
              fileSize INTEGER,
              FOREIGN KEY(folderId) REFERENCES folders(id)
            )
          `);

          db!.run(`
            CREATE TABLE IF NOT EXISTS tags (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              color TEXT,
              dateCreated TEXT NOT NULL
            )
          `);

          db!.run(`
            CREATE TABLE IF NOT EXISTS asset_tags (
              assetId TEXT NOT NULL,
              tagId TEXT NOT NULL,
              PRIMARY KEY(assetId, tagId),
              FOREIGN KEY(assetId) REFERENCES assets(id),
              FOREIGN KEY(tagId) REFERENCES tags(id)
            )
          `);

          // Create indexes
          db!.run(
            `CREATE INDEX IF NOT EXISTS idx_assets_folderId ON assets(folderId)`,
          );
          db!.run(
            `CREATE INDEX IF NOT EXISTS idx_folders_parentId ON folders(parentFolderId)`,
          );

          // Create default folder
          db!.get(
            "SELECT id FROM folders WHERE name = 'All Assets'",
            (err, row: any) => {
              if (!row) {
                const folderId = uuidv4();
                const folderPath = "All Assets";

                // Create physical folder
                fs.ensureDirSync(path.join(LIBRARY_PATH, folderPath));

                // Create DB entry
                db!.run(
                  `INSERT INTO folders (id, name, path, parentFolderId, dateCreated)
                VALUES (?, ?, ?, NULL, ?)`,
                  [
                    folderId,
                    "All Assets",
                    folderPath,
                    new Date().toISOString(),
                  ],
                  () => {
                    console.log("✅ Library initialized at:", LIBRARY_PATH);
                    resolve({
                      success: true,
                      libraryPath: LIBRARY_PATH,
                    });
                  },
                );
              } else {
                console.log("✅ Library initialized at:", LIBRARY_PATH);
                resolve({
                  success: true,
                  libraryPath: LIBRARY_PATH,
                });
              }
            },
          );
        });
      });
    } catch (error) {
      console.error("❌ Failed to initialize library:", error);
      resolve({
        success: false,
        error: (error as Error).message,
      });
    }
  });
}

/**
 * Get the database instance
 */
export function getDb() {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeLibrary() first.",
    );
  }
  return db;
}

/**
 * Get all folders
 */
export function getFolders(): Promise<any[]> {
  return new Promise((resolve) => {
    const db = getDb();
    db.all(
      `SELECT id, name, path, parentFolderId, dateCreated FROM folders ORDER BY name`,
      (err, rows) => {
        resolve(rows || []);
      },
    );
  });
}

/**
 * Get default "All Assets" folder ID
 */
export function getDefaultFolderId(): Promise<string | null> {
  return new Promise((resolve) => {
    const db = getDb();
    db.get(
      "SELECT id FROM folders WHERE name = 'All Assets'",
      (err, row: any) => {
        resolve(row?.id || null);
      },
    );
  });
}

/**
 * Get assets in a specific folder
 */
export function getAssetsByFolder(folderId: string): Promise<any[]> {
  return new Promise((resolve) => {
    const db = getDb();
    db.all(
      `SELECT id, name, path, type, folderId, dateAdded, dateModified, fileSize
       FROM assets WHERE folderId = ? ORDER BY dateAdded DESC`,
      [folderId],
      (err, rows) => {
        resolve(rows || []);
      },
    );
  });
}

/**
 * Add asset to database
 */
function addAssetToDb(asset: {
  name: string;
  path: string;
  type: string;
  folderId: string;
  fileSize: number;
}): Promise<string> {
  return new Promise((resolve) => {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO assets (id, name, path, type, folderId, dateAdded, dateModified, fileSize)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        asset.name,
        asset.path,
        asset.type,
        asset.folderId,
        now,
        now,
        asset.fileSize,
      ],
      () => resolve(id),
    );
  });
}

/**
 * Move files from source to library + add to DB
 */
export async function importAssets(
  files: { filePath: string; fileName: string }[],
  targetFolderId?: string,
) {
  const folderId = targetFolderId || (await getDefaultFolderId());
  if (!folderId) {
    throw new Error("No target folder specified and no default folder found");
  }

  const db = getDb();

  return new Promise(async (resolve) => {
    db.get(
      "SELECT path FROM folders WHERE id = ?",
      [folderId],
      async (err, row: any) => {
        if (!row) {
          throw new Error("Target folder not found");
        }

        const targetFolderPath = row.path;
        const importedAssets = [];

        for (const file of files) {
          try {
            const fileName = path.basename(file.filePath);
            const relativeLibraryPath = path.join(targetFolderPath, fileName);
            const absoluteLibraryPath = path.join(
              LIBRARY_PATH,
              relativeLibraryPath,
            );

            // Move file to library
            await fs.move(file.filePath, absoluteLibraryPath, {
              overwrite: false,
            });

            // Get file size
            const stats = await fs.stat(absoluteLibraryPath);

            // Get file type
            const type = getFileType(fileName);

            // Add to database
            const assetId = await addAssetToDb({
              name: fileName,
              path: relativeLibraryPath,
              type,
              folderId: folderId as string,
              fileSize: stats.size,
            });

            importedAssets.push({
              id: assetId,
              name: fileName,
              path: relativeLibraryPath,
              type,
              fileSize: stats.size,
              folderId,
              dateAdded: new Date().toISOString(),
              dateModified: new Date().toISOString(),
            });

            console.log(`✅ Imported: ${fileName}`);
          } catch (error) {
            console.error(`❌ Failed to import ${file.fileName}:`, error);
          }
        }

        resolve(importedAssets);
      },
    );
  });
}

/**
 * Get file type from extension
 */
function getFileType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const videoExts = [".mp4", ".mov", ".avi", ".mkv"];
  const docExts = [".pdf", ".doc", ".docx", ".txt"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (docExts.includes(ext)) return "document";
  return "file";
}

/**
 * Close database connection
 */
export function closeLibrary() {
  if (db) {
    db.close();
    db = null;
  }
}

export function getLibraryPath() {
  return LIBRARY_PATH;
}

/**
 * Create a new folder
 */
export function createFolder(
  folderName: string,
  parentFolderId?: string,
): Promise<{ id: string; name: string; path: string }> {
  return new Promise((resolve, reject) => {
    const db = getDb();

    // Get parent folder path
    let parentPath = "";
    if (parentFolderId) {
      db.get(
        "SELECT path FROM folders WHERE id = ?",
        [parentFolderId],
        (err, row: any) => {
          if (!row) {
            reject(new Error("Parent folder not found"));
            return;
          }
          doCreateFolder(row.path);
        },
      );
    } else {
      doCreateFolder("");
    }

    function doCreateFolder(parentPath: string) {
      try {
        const folderId = uuidv4();
        const folderPath = parentPath
          ? path.join(parentPath, folderName)
          : folderName;
        const absoluteFolderPath = path.join(LIBRARY_PATH, folderPath);

        // Create physical folder
        fs.ensureDirSync(absoluteFolderPath);

        // Create DB entry
        db.run(
          `INSERT INTO folders (id, name, path, parentFolderId, dateCreated)
           VALUES (?, ?, ?, ?, ?)`,
          [
            folderId,
            folderName,
            folderPath,
            parentFolderId || null,
            new Date().toISOString(),
          ],
          () => {
            console.log(`✅ Created folder: ${folderName}`);
            resolve({
              id: folderId,
              name: folderName,
              path: folderPath,
            });
          },
        );
      } catch (error) {
        reject(error);
      }
    }
  });
}

/**
 * Delete a folder (and all its contents recursively)
 */
export function deleteFolder(folderId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb();

    db.get(
      "SELECT path FROM folders WHERE id = ?",
      [folderId],
      async (err, row: any) => {
        if (!row) {
          reject(new Error("Folder not found"));
          return;
        }

        try {
          const folderPath = row.path;
          const absoluteFolderPath = path.join(LIBRARY_PATH, folderPath);

          // Delete physical folder and all contents
          await fs.remove(absoluteFolderPath);

          // Delete from database
          db.run("DELETE FROM folders WHERE id = ?", [folderId], () => {
            console.log(`✅ Deleted folder: ${folderPath}`);
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

/**
 * Rename a folder
 */
export function renameFolder(folderId: string, newName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb();

    db.get(
      "SELECT path, parentFolderId FROM folders WHERE id = ?",
      [folderId],
      async (err, row: any) => {
        if (!row) {
          reject(new Error("Folder not found"));
          return;
        }

        try {
          const oldPath = row.path;
          const parentPath = oldPath.includes("\\")
            ? oldPath.substring(0, oldPath.lastIndexOf("\\"))
            : "";
          const newPath = parentPath ? path.join(parentPath, newName) : newName;

          const oldAbsolutePath = path.join(LIBRARY_PATH, oldPath);
          const newAbsolutePath = path.join(LIBRARY_PATH, newPath);

          // Rename physical folder
          await fs.rename(oldAbsolutePath, newAbsolutePath);

          // Update database
          db.run(
            `UPDATE folders SET path = ?, name = ? WHERE id = ?`,
            [newPath, newName, folderId],
            () => {
              console.log(`✅ Renamed folder to: ${newName}`);
              resolve();
            },
          );
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

/**
 * Create a new tag
 */
export function createTag(
  tagName: string,
  color?: string,
): Promise<{ id: string; name: string; color: string }> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    const tagId = uuidv4();
    const tagColor = color || "#3B82F6"; // Default blue

    db.run(
      `INSERT INTO tags (id, name, color, dateCreated)
       VALUES (?, ?, ?, ?)`,
      [tagId, tagName, tagColor, new Date().toISOString()],
      () => {
        console.log(`✅ Created tag: ${tagName}`);
        resolve({
          id: tagId,
          name: tagName,
          color: tagColor,
        });
      },
    );
  });
}

/**
 * Get all tags
 */
export function getAllTags(): Promise<any[]> {
  return new Promise((resolve) => {
    const db = getDb();
    db.all(
      `SELECT id, name, color, dateCreated FROM tags ORDER BY name`,
      (err, rows) => {
        resolve(rows || []);
      },
    );
  });
}

/**
 * Get tags for a specific asset
 */
export function getAssetTags(assetId: string): Promise<any[]> {
  return new Promise((resolve) => {
    const db = getDb();
    db.all(
      `SELECT t.id, t.name, t.color FROM tags t
       JOIN asset_tags at ON t.id = at.tagId
       WHERE at.assetId = ?
       ORDER BY t.name`,
      [assetId],
      (err, rows) => {
        resolve(rows || []);
      },
    );
  });
}

/**
 * Add tag to asset
 */
export function addTagToAsset(assetId: string, tagId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(
      `INSERT OR IGNORE INTO asset_tags (assetId, tagId) VALUES (?, ?)`,
      [assetId, tagId],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

/**
 * Remove tag from asset
 */
export function removeTagFromAsset(
  assetId: string,
  tagId: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(
      `DELETE FROM asset_tags WHERE assetId = ? AND tagId = ?`,
      [assetId, tagId],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

/**
 * Delete a tag
 */
export function deleteTag(tagId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(`DELETE FROM asset_tags WHERE tagId = ?`, [tagId], () => {
      db.run(`DELETE FROM tags WHERE id = ?`, [tagId], () => {
        console.log(`✅ Deleted tag`);
        resolve();
      });
    });
  });
}

/**
 * Clean up database - remove assets with missing files
 */
export function cleanupMissingAssets(): Promise<number> {
  return new Promise((resolve) => {
    const db = getDb();

    db.all(`SELECT id, path FROM assets`, async (err, rows: any[]) => {
      if (!rows || rows.length === 0) {
        resolve(0);
        return;
      }

      let deletedCount = 0;

      for (const row of rows) {
        const assetFullPath = path.join(LIBRARY_PATH, row.path);

        // Check if file exists
        const exists = await fs.pathExists(assetFullPath);

        if (!exists) {
          // Delete from database
          db.run(`DELETE FROM assets WHERE id = ?`, [row.id], () => {
            console.log(`🧹 Removed missing asset from DB: ${row.path}`);
          });
          deletedCount++;
        }
      }

      console.log(
        `✅ Cleanup complete: removed ${deletedCount} missing assets`,
      );
      resolve(deletedCount);
    });
  });
}
