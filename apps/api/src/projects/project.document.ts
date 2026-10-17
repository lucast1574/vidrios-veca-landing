import type { ObjectId } from "mongodb";
import type { ProjectInput, Project } from "@veca/content";
export interface ProjectDocument {
  _id: ObjectId;
  slug: string;
  draft: ProjectInput;
  published: Project | null;
  publishedVersion?: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
