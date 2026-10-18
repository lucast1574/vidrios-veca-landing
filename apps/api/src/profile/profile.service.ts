import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import sharp from "sharp";
import { AuthService } from "../auth/auth.service";
import { StorageService } from "../media/storage.service";
import type { SessionUser } from "@veca/content";
@Injectable()
export class ProfileService {
  constructor(
    private readonly auth: AuthService,
    private readonly storage: StorageService,
  ) {}
  private async user(id: string) {
    if (!ObjectId.isValid(id)) throw new NotFoundException();
    const user = await this.auth.users.findOne({ _id: new ObjectId(id) });
    if (!user) throw new NotFoundException();
    return user;
  }
  async upload(actor: SessionUser, file?: Express.Multer.File) {
    if (!actor.emailVerified)
      throw new ForbiddenException(
        "Verifica tu correo antes de cambiar la foto.",
      );
    if (!file) throw new BadRequestException("Selecciona una foto.");
    let photo: Buffer;
    try {
      const image = sharp(file.buffer, {
        limitInputPixels: 20_000_000,
        animated: false,
        failOn: "error",
      });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp", "avif"].includes(metadata.format || ""))
        throw Error();
      photo = await image
        .rotate()
        .resize(512, 512, { fit: "cover", position: "centre" })
        .webp({ quality: 86 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        "Selecciona una foto JPG, PNG, WebP o AVIF de hasta 4 MB y 20 megapíxeles.",
      );
    }
    const version = randomUUID(),
      key = `veca/avatars/${actor.id}/${version}.webp`;
    await this.storage.put(key, photo);
    let before;
    try {
      before = await this.auth.users.findOneAndUpdate(
        { _id: new ObjectId(actor.id) },
        {
          $set: {
            avatarKey: key,
            avatarVersion: version,
            avatarSource: "upload",
            updatedAt: new Date(),
          },
        },
        { returnDocument: "before" },
      );
      if (!before) throw new NotFoundException();
    } catch (error) {
      await this.storage.remove(key).catch(() => {});
      throw error;
    }
    if (before.avatarKey)
      await this.storage.remove(before.avatarKey).catch(() => {});
    return { user: await this.auth.view(await this.user(actor.id)) };
  }
  async preference(actor: SessionUser, source: "google" | "none") {
    const user = await this.user(actor.id);
    if (source === "google" && !user.googlePhotoUrl)
      throw new BadRequestException(
        "Inicia sesión con Google para sincronizar tu foto.",
      );
    const before = await this.auth.users.findOneAndUpdate(
      { _id: user._id },
      {
        $set: { avatarSource: source, updatedAt: new Date() },
        $unset: { avatarKey: "", avatarVersion: "" },
      },
      { returnDocument: "before" },
    );
    if (before?.avatarKey)
      await this.storage.remove(before.avatarKey).catch(() => {});
    return { user: await this.auth.view(await this.user(actor.id)) };
  }
  async google(actor: SessionUser, token: string) {
    await this.auth.synchronizeGooglePhoto(actor.id, token);
    return this.preference(actor, "google");
  }
  async read(actor: SessionUser, id: string) {
    if (
      actor.id !== id &&
      !(
        actor.status === "active" &&
        actor.emailVerified &&
        actor.permissions.includes("users")
      )
    )
      throw new ForbiddenException();
    const user = await this.user(id);
    if (user.avatarSource !== "upload" || !user.avatarKey)
      throw new NotFoundException();
    return this.storage.get(user.avatarKey);
  }
}
