import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import path from "path";
import crypto from "crypto";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = () => process.env.R2_BUCKET_NAME!;
const publicBase = () => (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

/** Extract the R2 object key from a stored public URL. */
export function keyFromUrl(url: string): string {
  return url.replace(`${publicBase()}/`, "");
}

/** Upload a file and return its public URL. folder is the full path prefix, e.g. "products/sweets/kaju-katli" */
export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = "uploads"
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  const uid = crypto.randomUUID();
  const key = `${folder}/${uid}${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${publicBase()}/${key}`;
}

/** Delete a single object by its key. Silently ignores missing objects. */
export async function deleteObject(key: string): Promise<void> {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
  } catch (err) {
    console.warn("[R2 deleteObject]", key, err);
  }
}

/** Delete all objects whose key starts with the given prefix. */
export async function deleteFolder(prefix: string): Promise<void> {
  const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
  let continuationToken: string | undefined;

  do {
    const list = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET(),
        Prefix: normalized,
        ContinuationToken: continuationToken,
      })
    );

    const objects = list.Contents ?? [];
    if (objects.length > 0) {
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET(),
          Delete: {
            Objects: objects.map((o) => ({ Key: o.Key! })),
            Quiet: true,
          },
        })
      );
    }

    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);
}

/** Delete a list of public URLs from R2. */
export async function deleteUrls(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => deleteObject(keyFromUrl(url))));
}
