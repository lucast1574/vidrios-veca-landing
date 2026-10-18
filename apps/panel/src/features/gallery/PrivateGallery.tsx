import { useCallback, useState } from "react";
import {
  LEAD_SEGMENTS,
  LEAD_STAGES,
  PHOTO_TAGS,
  REQUEST_TYPES,
  type GalleryPhoto,
} from "@veca/content";
import { Select } from "@veca/ui/src/Select";
import {
  Images,
  LockKeyhole,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button, Notice } from "../../components/ui";
import { API_BASE } from "../../lib/api";
import { GalleryViewer } from "./GalleryViewer";
import {
  emptyGalleryFilters,
  useGallery,
  type GalleryFilters,
} from "./useGallery";
import "./gallery.css";
export function PrivateGallery({ canOpenLead }: { canOpenLead: boolean }) {
  const [filters, setFilters] = useState(emptyGalleryFilters),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<GalleryPhoto | null>(null),
    [advanced, setAdvanced] = useState(false);
  const { data, loading, error, refresh } = useGallery(filters, page);
  const close = useCallback(() => setSelected(null), []);
  const change = (key: keyof GalleryFilters, value: string) => {
    setFilters((old) => ({ ...old, [key]: value }));
    setPage(1);
  };
  const filtered = Object.values(filters).some(Boolean);
  return (
    <main className="ops-page private-gallery">
      <header className="gallery-heading">
        <div>
          <p className="overline">LAS FOTOS DEL EQUIPO, EN UN SOLO LUGAR</p>
          <h1>
            Galería<span>.</span>
          </h1>
          <p>
            Encuentra el antes, el avance y el resultado de cada obra sin buscar
            entre las fichas.
          </p>
        </div>
        <span className="gallery-private-note">
          <LockKeyhole size={17} />
          <span>
            Solo para el equipo<small>Nada se publica automáticamente</small>
          </span>
        </span>
      </header>
      <section
        className="gallery-tools"
        aria-label="Buscar y filtrar fotografías"
      >
        <label className="gallery-search">
          <Search size={20} />
          <input
            type="search"
            aria-label="Buscar fotografías"
            placeholder="Busca por descripción, cliente o distrito…"
            value={filters.search}
            onChange={(e) => change("search", e.target.value)}
          />
        </label>
        <div className="gallery-filter-line">
          <div
            className="gallery-usage-tabs"
            role="group"
            aria-label="Uso de las fotografías"
          >
            {[
              ["", "Todas las fotos"],
              ["clients", "Para mostrar a clientes"],
              ["internal", "Solo uso interno"],
            ].map(([value, text]) => (
              <button
                key={value}
                aria-pressed={filters.sharing === value}
                onClick={() => change("sharing", value)}
              >
                {text}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            aria-expanded={advanced}
            onClick={() => setAdvanced((v) => !v)}
          >
            <SlidersHorizontal size={16} /> Filtrar por obra
          </Button>
        </div>
        <div
          className="gallery-tag-filter"
          role="group"
          aria-label="Etiquetas de fotografías"
        >
          <button aria-pressed={!filters.tag} onClick={() => change("tag", "")}>
            Todas las etiquetas
          </button>
          {PHOTO_TAGS.map((tag) => (
            <button
              key={tag}
              aria-pressed={filters.tag === tag}
              onClick={() => change("tag", tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        {advanced && (
          <div className="gallery-advanced">
            <Select
              label="Tipo de obra"
              value={filters.requestType}
              options={[
                { value: "", label: "Todos los tipos de obra" },
                ...REQUEST_TYPES.map((v) => ({ value: v.id, label: v.name })),
              ]}
              onChange={(v) => change("requestType", v)}
            />
            <Select
              label="Etapa de la obra"
              value={filters.stage}
              options={[
                { value: "", label: "Todas las etapas" },
                ...LEAD_STAGES.map((v) => ({ value: v.id, label: v.name })),
              ]}
              onChange={(v) => change("stage", v)}
            />
            <Select
              label="Segmento"
              value={filters.segment}
              options={[
                { value: "", label: "Todos los segmentos" },
                ...LEAD_SEGMENTS.map((v) => ({ value: v.id, label: v.name })),
              ]}
              onChange={(v) => change("segment", v)}
            />
          </div>
        )}
      </section>
      <div className="gallery-result-line">
        <p aria-live="polite">
          {loading
            ? "Buscando fotografías…"
            : data
              ? `${data.total} ${data.total === 1 ? "fotografía" : "fotografías"}${filtered ? " en esta selección" : " en la galería"}`
              : "No se pudo cargar la galería"}
        </p>
        <div className="gallery-result-actions">
          <button
            onClick={refresh}
            disabled={loading}
            aria-label="Actualizar galería"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
          {filtered && (
            <button
              onClick={() => {
                setFilters(emptyGalleryFilters);
                setPage(1);
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
      {error && (
        <Notice error>
          {error} <button onClick={refresh}>Reintentar</button>
        </Notice>
      )}
      {loading ? (
        <div className="gallery-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="gallery-skeleton" key={i} />
          ))}
        </div>
      ) : !!data?.items.length ? (
        <div className="gallery-grid">
          {data.items.map((photo) => (
            <button
              className="gallery-card"
              key={photo.id}
              onClick={() => setSelected(photo)}
              aria-label={`Ver foto: ${photo.caption || photo.name}`}
            >
              <div className="gallery-card-image">
                <img
                  src={API_BASE + photo.url}
                  alt={photo.caption || photo.name}
                  loading="lazy"
                />
                <span className={`photo-use photo-use-${photo.sharing}`}>
                  {photo.sharing === "clients" ? (
                    <ShieldCheck size={13} />
                  ) : (
                    <LockKeyhole size={13} />
                  )}{" "}
                  {photo.sharing === "clients"
                    ? "Para clientes"
                    : "Uso interno"}
                </span>
              </div>
              <div className="gallery-card-copy">
                <p>
                  {
                    REQUEST_TYPES.find((v) => v.id === photo.lead.requestType)
                      ?.name
                  }{" "}
                  · {photo.lead.district}
                </p>
                <h2>{photo.caption || photo.name}</h2>
                <div className="gallery-photo-tags">
                  {photo.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <footer>
                  <span>{photo.lead.name}</span>
                  <span>
                    {LEAD_STAGES.find((v) => v.id === photo.lead.stage)?.name}
                  </span>
                </footer>
              </div>
            </button>
          ))}
        </div>
      ) : (
        !error && (
          <section className="gallery-empty">
            <Images size={38} />
            <h2>
              {filtered
                ? "Probemos otra mirada."
                : "Cada obra tiene algo que mostrar."}
            </h2>
            <p>
              {filtered
                ? "No hay fotografías con estos filtros. Prueba otro término o amplía la selección."
                : "Las fotos que añadas a los leads aparecerán aquí con su obra de origen. Los contratos permanecen en la ficha."}
            </p>
            {!filtered && canOpenLead && (
              <a href="#leads" className="btn btn-primary">
                Ir a los leads
              </a>
            )}
          </section>
        )
      )}
      {!!data && data.pages > 1 && (
        <nav className="gallery-pagination" aria-label="Páginas de fotografías">
          <Button
            variant="ghost"
            disabled={page <= 1 || loading}
            onClick={() => setPage((v) => v - 1)}
          >
            <ArrowLeft size={16} /> Anterior
          </Button>
          <span>
            {page} de {data.pages}
          </span>
          <Button
            variant="ghost"
            disabled={page >= data.pages || loading}
            onClick={() => setPage((v) => v + 1)}
          >
            Siguiente <ArrowRight size={16} />
          </Button>
        </nav>
      )}
      {selected && (
        <GalleryViewer
          key={selected.id}
          initial={selected}
          photos={data?.items || [selected]}
          canOpenLead={canOpenLead}
          onClose={close}
          onSaved={refresh}
        />
      )}
    </main>
  );
}
