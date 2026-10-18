import { PHOTO_TAGS, type PhotoMetadata } from "@veca/content";
import { Select } from "@veca/ui/src/Select";
import { Field } from "../../components/ui";
export function PhotoMetadataFields({
  value,
  onChange,
}: {
  value: PhotoMetadata;
  onChange: (value: PhotoMetadata) => void;
}) {
  return (
    <div className="photo-metadata-fields">
      <Field label="Descripción de la foto">
        <textarea
          value={value.caption}
          maxLength={500}
          rows={2}
          placeholder="Ej. Mampara terminada y detalle de las uniones"
          onChange={(e) => onChange({ ...value, caption: e.target.value })}
        />
      </Field>
      <Field
        label="Uso de la foto"
        hint="Ninguna opción publica la foto en la web."
      >
        <Select
          label="Uso de la foto"
          value={value.sharing}
          onChange={(v) =>
            onChange({ ...value, sharing: v as PhotoMetadata["sharing"] })
          }
          options={[
            {
              value: "internal",
              label: "Solo uso interno",
              description: "No mostrar a clientes ni publicar",
            },
            {
              value: "clients",
              label: "Autorizada para mostrar a clientes",
              description:
                "El cliente ha autorizado mostrar esta foto en una conversación",
            },
          ]}
        />
      </Field>
      <fieldset className="photo-tag-picker">
        <legend>Etiquetas de la foto</legend>
        <div>
          {PHOTO_TAGS.map((tag) => (
            <button
              type="button"
              key={tag}
              aria-pressed={value.tags.includes(tag)}
              onClick={() =>
                onChange({
                  ...value,
                  tags: value.tags.includes(tag)
                    ? value.tags.filter((t) => t !== tag)
                    : [...value.tags, tag],
                })
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
