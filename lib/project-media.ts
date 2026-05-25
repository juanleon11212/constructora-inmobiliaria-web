import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIRECTORY, "project-media.json");
const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads", "proyectos");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const acceptedImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ProjectProgress = {
  id: string;
  date: string;
  percentage: number;
  note: string;
  image: string;
};

export type ProjectMedia = {
  coverImage?: string;
  progress: ProjectProgress[];
};

type MediaStore = Record<string, ProjectMedia>;

export function validateProjectImage(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  if (!acceptedImageTypes[value.type]) {
    throw new Error("La imagen debe ser JPG, PNG o WEBP.");
  }

  if (value.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen no puede superar los 5 MB.");
  }

  return value;
}

async function readStore(): Promise<MediaStore> {
  try {
    const contents = await readFile(STORE_PATH, "utf8");
    return JSON.parse(contents) as MediaStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeStore(store: MediaStore) {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  const temporaryPath = `${STORE_PATH}.${randomUUID()}.tmp`;

  await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf8");
  await rename(temporaryPath, STORE_PATH);
}

async function saveImage(idProject: number, file: File, type: "principal" | "avance") {
  const extension = acceptedImageTypes[file.type];
  const projectDirectory = path.join(UPLOAD_DIRECTORY, String(idProject));
  const name = `${type}-${Date.now()}-${randomUUID()}.${extension}`;

  await mkdir(projectDirectory, { recursive: true });
  await writeFile(path.join(projectDirectory, name), Buffer.from(await file.arrayBuffer()));

  return `/uploads/proyectos/${idProject}/${name}`;
}

export async function getProjectMedia(idProject: number): Promise<ProjectMedia> {
  const store = await readStore();
  return store[String(idProject)] ?? { progress: [] };
}

export async function saveProjectCover(idProject: number, file: File) {
  const image = await saveImage(idProject, file, "principal");
  const store = await readStore();
  const current = store[String(idProject)] ?? { progress: [] };

  store[String(idProject)] = { ...current, coverImage: image };
  await writeStore(store);

  return image;
}

export async function addProjectProgress(
  idProject: number,
  input: { date: string; percentage: number; note: string; file: File }
) {
  const image = await saveImage(idProject, input.file, "avance");
  const store = await readStore();
  const current = store[String(idProject)] ?? { progress: [] };
  const entry: ProjectProgress = {
    id: randomUUID(),
    date: input.date,
    percentage: input.percentage,
    note: input.note,
    image,
  };

  store[String(idProject)] = {
    ...current,
    progress: [entry, ...current.progress],
  };
  await writeStore(store);

  return entry;
}
