// services/thumbnailManager.ts
import path from "path";
import os from "os";
import fs from "fs-extra";
import sharp from "sharp";

const LIBRARY_PATH = path.join(os.homedir(), "GlimpseLibrary");
const THUMBNAILS_DIR = path.join(LIBRARY_PATH, ".glimpse", "thumbnails");

const THUMBNAIL_SIZE = 200;

const inFlightGenerations = new Map<string, Promise<void>>();

async function isThumbnailValid(thumbnailPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(thumbnailPath);
    if (stat.size === 0) return false;
    await sharp(thumbnailPath).stats();
    return true;
  } catch {
    return false;
  }
}

async function ensureThumbnail(
  assetFullPath: string,
  thumbnailPath: string,
): Promise<void> {
  if (await fs.pathExists(thumbnailPath)) {
    if (await isThumbnailValid(thumbnailPath)) {
      return;
    }
    console.warn("Cached thumbnail is corrupt, regenerating:", thumbnailPath);
    await fs.remove(thumbnailPath).catch(() => {});
  }

  const existing = inFlightGenerations.get(thumbnailPath);
  if (existing) {
    return existing;
  }

  const genPromise = (async () => {
    await fs.ensureDir(THUMBNAILS_DIR);

    const tmpPath = `${thumbnailPath}.tmp-${process.pid}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    try {
      await sharp(assetFullPath)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
          fit: "cover",
          position: "center",
        })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png() // switched from webp -> png to rule out a webp render bug
        .toFile(tmpPath);

      await fs.move(tmpPath, thumbnailPath, { overwrite: true });

      const fileStats = await fs.stat(thumbnailPath);
      console.log(
        `✅ Generated thumbnail: ${path.basename(thumbnailPath)}, size: ${fileStats.size} bytes`,
      );
    } catch (err) {
      await fs.remove(tmpPath).catch(() => {});
      throw err;
    }
  })();

  inFlightGenerations.set(thumbnailPath, genPromise);
  try {
    await genPromise;
  } finally {
    inFlightGenerations.delete(thumbnailPath);
  }
}

export async function getThumbnail(assetPath: string): Promise<string | null> {
  try {
    const assetFullPath = path.join(LIBRARY_PATH, assetPath);

    if (!(await fs.pathExists(assetFullPath))) {
      console.warn("Asset file not found:", assetFullPath);
      return null;
    }

    const ext = path.extname(assetFullPath).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    if (!imageExts.includes(ext)) {
      return null;
    }

    const thumbnailName = Buffer.from(assetPath)
      .toString("base64")
      .replace(/[/+=]/g, "_");
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${thumbnailName}.png`); // .png, not .webp

    try {
      await ensureThumbnail(assetFullPath, thumbnailPath);
    } catch (sharpError) {
      console.error("Sharp error generating thumbnail:", sharpError);
      return null;
    }

    const thumbnailBuffer = await fs.readFile(thumbnailPath);
    const base64 = thumbnailBuffer.toString("base64");
    return `data:image/png;base64,${base64}`; // mime type updated to match
  } catch (error) {
    console.error("Error generating thumbnail for", assetPath, ":", error);
    return null;
  }
}

export async function getDominantColors(assetPath: string): Promise<string[]> {
  try {
    const assetFullPath = path.join(LIBRARY_PATH, assetPath);

    if (!(await fs.pathExists(assetFullPath))) {
      return [];
    }

    const ext = path.extname(assetFullPath).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    if (!imageExts.includes(ext)) {
      return [];
    }

    return [];
  } catch (error) {
    console.error("Error getting dominant colors for", assetPath, ":", error);
    return [];
  }
}

export async function clearThumbnailCache() {
  try {
    await fs.emptyDir(THUMBNAILS_DIR);
    console.log("✅ Thumbnail cache cleared");
  } catch (error) {
    console.error("Error clearing thumbnail cache:", error);
  }
}
