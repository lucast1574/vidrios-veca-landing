import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PERMISSIONS, type RoleDefinition } from "@veca/content";
import { Database } from "../database/database.module";
@Injectable()
export class RolesService {
  constructor(private readonly database: Database) {}
  async list(): Promise<RoleDefinition[]> {
    const roles = await this.database.db
      .collection<RoleDefinition>("roles")
      .find({})
      .sort({ name: 1 })
      .toArray();
    return roles.map(({ id, name, description, permissions, revision }) => ({
      id,
      name,
      description,
      revision,
      permissions: Array.isArray(permissions)
        ? permissions.filter((p) => PERMISSIONS.includes(p))
        : [],
    }));
  }
  async defaults() {
    const settings = await this.database.db
      .collection("access_settings")
      .findOne({ name: "defaults" });
    if (!settings)
      throw new ServiceUnavailableException(
        "La configuración de acceso no está disponible.",
      );
    return settings;
  }
}
