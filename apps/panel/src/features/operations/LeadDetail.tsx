import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  LEAD_STAGES,
  LEAD_SEGMENTS,
  REQUEST_TYPES,
  type LeadInput,
  type Lead,
  type Material,
} from "@veca/content";
import { Select } from "@veca/ui/src/Select";
import {
  ArrowLeft,
  Save,
  Phone,
  Mail,
  Upload,
  FileText,
  RefreshCw,
  Plus,
} from "lucide-react";
import { api, post, API_BASE } from "../../lib/api";
import { Button, Field, Notice } from "../../components/ui";
import {
  amount,
  date,
  leadInput,
  segmentName,
  stageName,
  Movements,
  type LeadDetailData,
  useMessage,
  useLiveRefresh,
} from "./shared";
import { MaterialMovement } from "./Inventory";
const contracts = [
  { value: "pending", label: "Por definir" },
  { value: "preparing", label: "En preparación" },
  { value: "sent", label: "Enviado al cliente" },
  { value: "signed", label: "Firmado" },
  { value: "not_required", label: "No aplica" },
];
const phases = [
  "prelead",
  "contacted",
  "coordination",
  "execution",
  "completed",
];
export function LeadDetail({
  id,
  proposal,
  back,
}: {
  id: string;
  proposal?: string;
  back: () => void;
}) {
  const [data, setData] = useState<LeadDetailData | null>(null),
    [draft, setDraft] = useState<LeadInput | null>(null),
    [tab, setTab] = useState("overview"),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [materials, setMaterials] = useState<Material[]>([]),
    [movement, setMovement] = useState(false),
    [note, setNote] = useState(""),
    [caption, setCaption] = useState("");
  const { error, setError, fail } = useMessage();
  const upload = useRef<HTMLInputElement>(null);
  const refresh = useCallback(async () => {
    try {
      const next = await api<LeadDetailData>(`/admin/crm/leads/${id}`);
      setData(next);
      setDraft(leadInput(next.lead));
      setError("");
    } catch (e) {
      fail(e);
    }
  }, [id]);
  useEffect(() => {
    void refresh();
    void api<Material[]>("/admin/crm/materials").then(setMaterials).catch(fail);
  }, [refresh]);
  useEffect(() => {
    if (data && proposal && LEAD_STAGES.some((s) => s.id === proposal)) {
      setDraft({
        ...leadInput(data.lead),
        stage: proposal as LeadInput["stage"],
      });
      setNotice(
        "Cambio de etapa preparado. Completa los datos y guarda para confirmarlo.",
      );
    }
  }, [proposal, data?.lead.id]);
  const refreshRelated = useCallback(() => {
    void api<LeadDetailData>(`/admin/crm/leads/${id}`)
      .then((next) => {
        setData((old) =>
          old
            ? {
                ...old,
                attachments: next.attachments,
                movements: next.movements,
              }
            : old,
        );
        setDraft((old) => {
          if (old && next.lead.version !== old.version)
            setNotice(
              "La ficha cambió en otra sesión. Recárgala antes de guardar; tus cambios aún no se han enviado.",
            );
          return old;
        });
      })
      .catch(fail);
    void api<Material[]>("/admin/crm/materials").then(setMaterials).catch(fail);
  }, [id]);
  useLiveRefresh(refreshRelated);
  const dirty =
    !!data &&
    !!draft &&
    JSON.stringify(draft) !== JSON.stringify(leadInput(data.lead));
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigate = (event: Event) => {
      if (dirty && !confirm("Hay cambios sin guardar. ¿Salir de la ficha?"))
        event.preventDefault();
    };
    window.addEventListener("veca-before-navigate", navigate);
    window.addEventListener("beforeunload", protect);
    return () => {
      window.removeEventListener("beforeunload", protect);
      window.removeEventListener("veca-before-navigate", navigate);
    };
  }, [dirty]);
  function patch<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setDraft((old) => (old ? { ...old, [key]: value } : old));
    setNotice("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const saved = await api<Lead>(`/admin/crm/leads/${id}`, {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      setData((old) => (old ? { ...old, lead: saved } : old));
      setDraft(leadInput(saved));
      setNotice("Ficha guardada.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function addNote(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const lead = await post<Lead>(`/admin/crm/leads/${id}/notes`, {
        version: draft.version,
        text: note,
      });
      setNote("");
      setData((old) => (old ? { ...old, lead } : old));
      setDraft((old) => (old ? { ...old, version: lead.version } : old));
      setNotice("Nota registrada.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function file(file: File) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("caption", caption);
      await api(`/admin/crm/leads/${id}/files`, { method: "POST", body: form });
      const attachments = await api<LeadDetailData>(`/admin/crm/leads/${id}`);
      setData((old) =>
        old ? { ...old, attachments: attachments.attachments } : old,
      );
      setCaption("");
      setNotice("Archivo añadido a la ficha.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
      if (upload.current) upload.current.value = "";
    }
  }
  if (!data || !draft)
    return (
      <main className="ops-page">
        {error ? <Notice error>{error}</Notice> : <p>Cargando ficha…</p>}
        <Button
          variant="ghost"
          onClick={() => {
            if (
              !dirty ||
              confirm("Hay cambios sin guardar. ¿Salir de la ficha?")
            )
              back();
          }}
        >
          Volver al tablero
        </Button>
      </main>
    );
  const lead = data.lead;
  const index = phases.indexOf(lead.stage);
  const available = LEAD_STAGES.filter(
    (s) =>
      s.id === lead.stage ||
      s.id === "discarded" ||
      (lead.stage === "discarded"
        ? s.id === "prelead"
        : s.id === phases[index + 1]),
  );
  const formField = (key: keyof LeadInput, label: string, type = "text") => (
    <Field label={label}>
      <input
        type={type}
        onInput={
          type === "datetime-local"
            ? (e) => patch(key, e.currentTarget.value as never)
            : undefined
        }
        value={String(draft[key] ?? "")}
        onChange={(e) => patch(key, e.target.value as never)}
        maxLength={key === "workPlan" ? 6000 : 500}
      />
    </Field>
  );
  const area = (key: keyof LeadInput, label: string, rows = 3) => (
    <Field label={label}>
      <textarea
        rows={rows}
        value={String(draft[key] ?? "")}
        onChange={(e) => patch(key, e.target.value as never)}
        maxLength={6000}
      />
    </Field>
  );
  return (
    <main className="ops-page ops-detail">
      <div className="ops-detail-top">
        <button
          className="ops-back"
          onClick={() => {
            if (
              !dirty ||
              confirm("Hay cambios sin guardar. ¿Salir de la ficha?")
            )
              back();
          }}
        >
          <ArrowLeft size={17} />
          Oportunidades
        </button>
        <div>
          <span className={`ops-ticket ticket-${lead.segment}`}>
            {segmentName(lead.segment)}
          </span>
          <span className="ops-stage-label">{stageName(lead.stage)}</span>
        </div>
        <button
          className="ops-icon-button"
          title="Recargar ficha desde el servidor"
          aria-label="Recargar ficha"
          onClick={() => {
            if (
              !dirty ||
              confirm("Hay cambios sin guardar. ¿Recargar la ficha?")
            )
              void refresh();
          }}
        >
          <RefreshCw size={17} />
        </button>
      </div>
      <div className="ops-detail-heading">
        <div>
          <p>
            Ficha {id.slice(-8).toUpperCase()} ·{" "}
            {lead.source === "web" ? "Consulta web" : "Registro del equipo"}
          </p>
          <h1>{lead.name}</h1>
          <span>
            {lead.district} · Recibido el {date(lead.createdAt)}
          </span>
        </div>
        <div className="ops-contact-links">
          <a href={`tel:${lead.phone}`}>
            <Phone size={16} />
            {lead.phone}
          </a>
          <a href={`mailto:${lead.email}`}>
            <Mail size={16} />
            {lead.email}
          </a>
        </div>
      </div>
      <ol className="ops-stage-track">
        {LEAD_STAGES.slice(0, 5).map((s, i) => (
          <li key={s.id} className={i <= index ? "passed" : ""}>
            <span>{i + 1}</span>
            {s.name}
          </li>
        ))}
      </ol>
      <nav className="ops-detail-tabs" aria-label="Secciones de la ficha">
        {[
          ["overview", "Contacto y seguimiento"],
          ["work", "Coordinación y obra"],
          ["files", "Fotos y contratos"],
          ["materials", "Materiales"],
          ["history", "Historial"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && <Notice error>{error}</Notice>}
      {notice && (
        <p role="status" className="ops-success">
          {notice}
        </p>
      )}
      <form onSubmit={save} hidden={!["overview", "work"].includes(tab)}>
        <div className="ops-detail-layout">
          <section className="ops-card">
            {tab === "overview" ? (
              <>
                <h2>El cliente y su proyecto</h2>
                <div className="ops-form-grid">
                  {formField("name", "Nombre y apellido")}
                  {formField("phone", "Teléfono o WhatsApp", "tel")}
                  {formField("email", "Correo electrónico", "email")}
                  {formField("district", "Distrito")}
                  <Field label="Tipo de trabajo">
                    <Select
                      label="Tipo de trabajo"
                      value={draft.requestType}
                      onChange={(v) =>
                        patch("requestType", v as LeadInput["requestType"])
                      }
                      options={REQUEST_TYPES.map((t) => ({
                        value: t.id,
                        label: t.name,
                      }))}
                    />
                  </Field>
                  {formField("assignedTo", "Responsable de atención")}
                </div>
                {area("idea", "La consulta del cliente", 5)}
                {area(
                  "contactResult",
                  "Contacto exitoso: resultado y acuerdos",
                )}
              </>
            ) : (
              <>
                <h2>Coordinación y ejecución</h2>
                <p className="hint">
                  Completa esta información a medida que avanzas. Las fotos y
                  documentos se guardan en su propia sección.
                </p>
                <div className="ops-form-grid">
                  {formField(
                    "appointment",
                    "Cita de coordinación (hora de Lima)",
                    "datetime-local",
                  )}
                  {formField("address", "Dirección de la obra")}
                  <Field label="Estado del contrato">
                    <Select
                      label="Estado del contrato"
                      value={draft.contractStatus}
                      options={contracts}
                      onChange={(v) =>
                        patch(
                          "contractStatus",
                          v as LeadInput["contractStatus"],
                        )
                      }
                    />
                  </Field>
                  {formField(
                    "contractReference",
                    "Referencia o número del contrato",
                  )}
                </div>
                {area("workPlan", "Alcance de la obra y detalles técnicos", 6)}
                {area("completionNote", "Resultado y cierre de la obra", 4)}
              </>
            )}
          </section>
          <aside className="ops-card ops-detail-save">
            <h3>Seguimiento comercial</h3>
            <Field label="Tipo de oportunidad">
              <Select
                label="Tipo de oportunidad"
                value={draft.segment}
                onChange={(v) => patch("segment", v as LeadInput["segment"])}
                options={LEAD_SEGMENTS.map((s) => ({
                  value: s.id,
                  label: s.name,
                  description: s.description,
                }))}
              />
            </Field>
            <Field label="Etapa">
              <Select
                label="Etapa"
                value={draft.stage}
                onChange={(v) => {
                  patch("stage", v as LeadInput["stage"]);
                  if (["coordination", "execution", "completed"].includes(v))
                    setTab("work");
                }}
                options={available.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Field>
            {draft.stage === "discarded" &&
              area("discardReason", "Motivo de descarte")}
            <p className="hint">
              Cada avance se confirma al guardar. Contacto exitoso → fecha de
              coordinación → dirección y alcance → nota de cierre.
            </p>
            <Button disabled={busy}>
              <Save size={16} />
              {busy ? "Guardando…" : "Guardar ficha"}
            </Button>
          </aside>
        </div>
      </form>
      {tab === "files" && (
        <section className="ops-card">
          <div className="ops-card-heading">
            <div>
              <h2>Fotos de obra y contratos</h2>
              <p className="hint">
                Archivos privados. Añadirlos aquí no los publica en la landing.
              </p>
            </div>
            <Button disabled={busy} onClick={() => upload.current?.click()}>
              <Upload size={16} />
              {busy ? "Subiendo…" : "Añadir archivo"}
            </Button>
          </div>
          <Field label="Descripción del próximo archivo">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              placeholder="Ej. Estado inicial de la fachada / contrato firmado"
            />
          </Field>
          <input
            ref={upload}
            className="ops-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) void file(selected);
            }}
          />
          <div className="ops-files">
            {data.attachments.map((a) => (
              <a
                key={a.id}
                href={API_BASE + a.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {a.type === "photo" ? (
                  <img src={API_BASE + a.url} alt={a.caption || a.name} />
                ) : (
                  <div className="ops-pdf">
                    <FileText size={36} />
                    <span>Contrato PDF</span>
                  </div>
                )}
                <strong>{a.caption || a.name}</strong>
                <small>{date(a.createdAt)}</small>
              </a>
            ))}
          </div>
          {!data.attachments.length && (
            <p className="ops-empty-small">
              Documenta el antes, el avance y el resultado de la obra. También
              puedes añadir contratos PDF.
            </p>
          )}
        </section>
      )}
      {tab === "materials" && (
        <>
          <section className="ops-card">
            <div className="ops-card-heading">
              <div>
                <h2>Consumo y devoluciones</h2>
                <p className="hint">
                  El inventario se actualiza con cada movimiento confirmado. No
                  hay un segundo descuento al finalizar.
                </p>
              </div>
              <Button
                disabled={
                  !["execution", "completed"].includes(lead.stage) ||
                  !materials.length
                }
                onClick={() => setMovement(true)}
              >
                <Plus size={16} />
                Registrar uso
              </Button>
            </div>
            {!["execution", "completed"].includes(lead.stage) && (
              <p className="ops-empty-small">
                Esta opción se habilita cuando la obra está en ejecución.
              </p>
            )}
            {!materials.length && (
              <a href="#inventory">Añadir materiales al inventario</a>
            )}
            <Movements items={data.movements} />
          </section>
          {movement && (
            <MaterialMovement
              materials={materials}
              leadId={id}
              onCancel={() => setMovement(false)}
              onSaved={() => {
                setMovement(false);
                void api<Material[]>("/admin/crm/materials").then(setMaterials);
                void api<LeadDetailData>(`/admin/crm/leads/${id}`).then(
                  (next) =>
                    setData((old) =>
                      old ? { ...old, movements: next.movements } : old,
                    ),
                );
              }}
            />
          )}
        </>
      )}
      {tab === "history" && (
        <section className="ops-card">
          <h2>Historial de atención</h2>
          <form className="ops-note-form" onSubmit={addNote}>
            <textarea
              aria-label="Nueva nota de seguimiento"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Registra una llamada, acuerdo o avance…"
              required
              maxLength={4000}
              rows={3}
            />
            <Button disabled={busy}>Añadir nota</Button>
          </form>
          <ol className="ops-timeline">
            {[...lead.events].reverse().map((event, i) => (
              <li key={`${event.at}-${i}`}>
                <span>
                  {date(event.at)} · {event.actor}
                </span>
                <p>{event.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
