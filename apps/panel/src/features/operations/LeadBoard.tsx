import { useCallback, useEffect, useRef, useState } from "react";
import {
  LEAD_STAGES,
  LEAD_SEGMENTS,
  REQUEST_TYPES,
  type Lead,
} from "@veca/content";
import { Select } from "@veca/ui/src/Select";
import {
  ArrowUpRight,
  Plus,
  Search,
  Phone,
  Mail,
  GripVertical,
  RefreshCw,
} from "lucide-react";
import { api, post } from "../../lib/api";
import { Button, Field, Notice } from "../../components/ui";
import { date, segmentName, useLiveRefresh, useMessage } from "./shared";
type List = {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<string, number>;
};
export function LeadBoard({
  open,
}: {
  open: (id: string, stage?: string) => void;
}) {
  const [data, setData] = useState<List | null>(null),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [segment, setSegment] = useState("all"),
    [create, setCreate] = useState(false),
    [busy, setBusy] = useState(false),
    [requestType, setRequestType] = useState("repair");
  const { error, setError, fail } = useMessage();
  const submissionId = useRef(crypto.randomUUID());
  const pages = useRef(1);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const refresh = useCallback(() => {
    void Promise.all(
      Array.from({ length: pages.current }, (_, index) =>
        api<List>(
          `/admin/crm/leads?search=${encodeURIComponent(query)}&segment=${segment}&page=${index + 1}`,
        ),
      ),
    )
      .then((results) =>
        setData({
          ...results[results.length - 1],
          items: results.flatMap((r) => r.items),
        }),
      )
      .catch(fail);
  }, [query, segment]);
  useEffect(() => {
    pages.current = 1;
    refresh();
  }, [query, segment]);
  useEffect(refresh, [refresh]);
  useLiveRefresh(refresh);
  async function loadMore() {
    if (!data) return;
    try {
      const next = await api<List>(
        `/admin/crm/leads?search=${encodeURIComponent(query)}&segment=${segment}&page=${data.page + 1}`,
      );
      pages.current = next.page;
      setData({ ...next, items: [...data.items, ...next.items] });
    } catch (e) {
      fail(e);
    }
  }
  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      const r = await post<{ reference: string }>("/admin/crm/leads", {
        ...fields,
        requestType,
        submissionId: submissionId.current,
        website: "",
      });
      submissionId.current = crypto.randomUUID();
      setCreate(false);
      open(r.reference);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  const items = (data?.items || []).filter(
    (l) => segment === "all" || l.segment === segment,
  );
  return (
    <main className="ops-page">
      <div className="ops-heading">
        <div>
          <p>Atención comercial y seguimiento de obras</p>
          <h1>
            De la primera consulta
            <br />a la última instalación.
          </h1>
          <span>
            Contactos, coordinación y avance de cada oportunidad en un solo
            lugar.
          </span>
        </div>
        <Button onClick={() => setCreate(!create)}>
          <Plus size={17} />
          {create ? "Cerrar formulario" : "Registrar oportunidad"}
        </Button>
      </div>
      <div className="ops-summary">
        {LEAD_STAGES.slice(0, 5).map((stage) => (
          <div key={stage.id}>
            <span>{stage.name}</span>
            <strong>{data?.counts[stage.id] || 0}</strong>
          </div>
        ))}
      </div>
      {error && (
        <Notice error>
          {error}
          <button onClick={refresh}>Reintentar</button>
        </Notice>
      )}
      {create && (
        <form className="ops-card ops-create-form" onSubmit={add}>
          <h2>Registrar una oportunidad</h2>
          <div className="ops-form-grid">
            {[
              ["name", "Nombre y apellido", "text"],
              ["phone", "Teléfono", "tel"],
              ["email", "Correo", "email"],
              ["district", "Distrito", "text"],
            ].map(([name, label, type]) => (
              <Field key={name} label={label}>
                <input name={name} type={type} required maxLength={180} />
              </Field>
            ))}
            <Field label="Tipo de trabajo">
              <Select
                label="Tipo de trabajo"
                value={requestType}
                options={REQUEST_TYPES.map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
                onChange={setRequestType}
              />
            </Field>
            <Field label="Idea o necesidad">
              <textarea
                name="idea"
                required
                minLength={10}
                maxLength={4000}
                rows={3}
              />
            </Field>
          </div>
          <Button disabled={busy}>
            {busy ? "Guardando…" : "Crear prelead"}
          </Button>
        </form>
      )}
      <div className="ops-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Buscar oportunidades"
            placeholder="Nombre, teléfono, correo o distrito…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Select
          label="Filtrar por tipo de oportunidad"
          value={segment}
          onChange={setSegment}
          options={[
            { value: "all", label: "Todos los tipos" },
            ...LEAD_SEGMENTS.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <button
          className="ops-icon-button"
          onClick={refresh}
          aria-label="Actualizar tablero"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <div className="ops-kanban" aria-label="Tablero de oportunidades">
        {LEAD_STAGES.map((stage) => {
          const group = items.filter((l) => l.stage === stage.id);
          return (
            <section
              className={`ops-column stage-${stage.id}`}
              key={stage.id}
              aria-label={stage.name}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/veca-lead");
                const lead = items.find((l) => l.id === id);
                if (!lead || lead.stage === stage.id) return;
                const phases = LEAD_STAGES.filter((s) => s.id !== "discarded");
                const next =
                  phases[phases.findIndex((s) => s.id === lead.stage) + 1]?.id;
                if (
                  stage.id !== "discarded" &&
                  stage.id !== (lead.stage === "discarded" ? "prelead" : next)
                ) {
                  setError(
                    "Avanza una etapa a la vez. Abre la ficha para completar el seguimiento.",
                  );
                  return;
                }
                open(id, stage.id);
              }}
            >
              <header>
                <span className="ops-stage-dot" />
                <h2>{stage.name}</h2>
                <span>{group.length}</span>
              </header>
              <div className="ops-column-body">
                {group.map((lead) => (
                  <button
                    className="ops-lead-card"
                    key={lead.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/veca-lead", lead.id)
                    }
                    onClick={() => open(lead.id)}
                  >
                    <div>
                      <span className={`ops-ticket ticket-${lead.segment}`}>
                        {segmentName(lead.segment)}
                      </span>
                      <GripVertical size={14} />
                    </div>
                    <h3>{lead.name}</h3>
                    <p>
                      {lead.district} ·{" "}
                      {
                        REQUEST_TYPES.find((t) => t.id === lead.requestType)
                          ?.name
                      }
                    </p>
                    <p className="ops-card-idea">{lead.idea}</p>
                    <div className="ops-card-contact">
                      <span>
                        <Phone size={12} />
                        {lead.phone}
                      </span>
                      <span>
                        <Mail size={12} />
                        {lead.email}
                      </span>
                    </div>
                    <footer>
                      <span>
                        {new Date(lead.createdAt).toLocaleDateString("es-PE")}
                      </span>
                      <span>
                        {lead.source === "web" ? "Web" : "Equipo"}
                        <ArrowUpRight size={14} />
                      </span>
                    </footer>
                  </button>
                ))}
                {!group.length && (
                  <p className="ops-column-empty">
                    {data
                      ? "Sin oportunidades en esta etapa"
                      : "Cargando tablero…"}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <div className="ops-board-bottom">
        <p>
          Abre una ficha para completar los datos y avanzar. Al arrastrar una
          tarjeta se prepara el cambio; no se guarda hasta confirmarlo en la
          ficha.
        </p>
        {data && (
          <span>
            Mostrando {data.items.length} de {data.total} oportunidades
          </span>
        )}
        {data && data.items.length < data.total && (
          <Button variant="ghost" onClick={() => void loadMore()}>
            Cargar más
          </Button>
        )}
      </div>
    </main>
  );
}
