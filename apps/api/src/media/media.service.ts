import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import sharp, { type OutputInfo } from "sharp";
import { ObjectId } from "mongodb";
import { Database } from "../database/database.module";
import { StorageService } from "./storage.service";
import { AuthService } from "../auth/auth.service";
import { config } from "../common/config";
@Injectable()
export class MediaService {
  constructor(
    private readonly database: Database,
    private readonly storage: StorageService,
    private readonly auth: AuthService,
  ) {}
  async upload(file: Express.Multer.File) {
    if (!file) throw new BadRequestException("Selecciona una imagen.");
    let data: Buffer, info: OutputInfo;
    try {
      const image = sharp(file.buffer, {
        limitInputPixels: 40_000_000,
        animated: false,
        failOn: "error",
      });
      const meta = await image.metadata();
      if (!["jpeg", "png", "webp", "avif"].includes(meta.format || ""))
        throw new Error("format");
      const result = await image
        .rotate()
        .resize({
          width: 2400,
          height: 2400,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 86 })
        .toBuffer({ resolveWithObject: true });
      data = result.data;
      info = result.info;
    } catch {
      throw new BadRequestException(
        "Sube una foto JPG, PNG, WebP o AVIF de hasta 12 MB y 40 megapíxeles.",
      );
    }
    const id = new ObjectId(),
      key = `veca/projects/${id}.webp`;
    await this.storage.put(key, data);
    const url = `${config.PUBLIC_API_URL}/media/${id}`;
    await this.database.db.collection("media").insertOne({
      _id: id,
      key,
      url,
      width: info.width,
      height: info.height,
      status: "ready",
      createdAt: new Date(),
    });
    return {
      id: String(id),
      url,
      width: info.width,
      height: info.height,
      alt: "",
      caption: "",
      positionX: 50,
      positionY: 50,
    };
  }
  async read(id: string, token: string) {
    if (!ObjectId.isValid(id)) throw new NotFoundException();
    const media = await this.database.db
      .collection("media")
      .findOne({ _id: new ObjectId(id), status: "ready" });
    if (!media) throw new NotFoundException();
    const publicUse = await this.database.db
      .collection("projects")
      .countDocuments({ "published.images.id": id });
    if (!publicUse) await this.auth.authenticate(token);
    return this.storage.get(media.key);
  }
}
