import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  type Material,
  type Movement,
} from "@veca/content";
import { Select } from "@veca/ui/src/Select";
import { Plus, Package, Search, RefreshCw, X } from "lucide-react";
import { api, post } from "../../lib/api";
import { Field, Button, Notice } from "../../components/ui";
import {
  amount,
  unitName,
  Movements,
  useLiveRefresh,
  useMessage,
} from "./shared";
export function MaterialMovement({
  materials,
  leadId,
  onSaved,
  onCancel,
}: {
  materials: Material[];
  leadId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [material, setMaterial] = useState(materials[0]?.id || ""),
    [kind, setKind] = useState(leadId ? "consumption" : "receipt"),
    [busy, setBusy] = useState(false);
  const operation = useRef(crypto.randomUUID());
  const { error, setError, fail } = useMessage();
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await post(`/admin/crm/materials/${material}/movements`, {
        operationId: operation.current,
        kind,
        quantity: Number(form.get("quantity")),
        reason: form.get("reason"),
        leadId,
      });
      onSaved();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  const selected = materials.find((m) => m.id === material);
  return (
    <form className="ops-card ops-movement-form" onSubmit={save}>
      <div className="ops-card-heading">
        <h3>
          {leadId ? "Registrar materiales de la obra" : "Registrar una entrada"}
        </h3>
        <button
          type="button"
          className="ops-icon-button"
          onClick={onCancel}
          aria-label="Cerrar movimiento"
        >
          <X size={18} />
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      <div className="ops-form-grid">
        <Field label="Material">
          <Select
            label="Material"
            value={material}
            onChange={setMaterial}
            options={materials.map((m) => ({
              value: m.id,
              label: m.name,
              description: `${m.sku} · Disponible: ${amount(m.balance)} ${unitName(m.unit)}`,
            }))}
          />
        </Field>
        {leadId && (
          <Field label="Movimiento">
            <Select
              label="Movimiento"
              value={kind}
              onChange={setKind}
              options={[
                {
                  value: "consumption",
                  label: "Consumo en obra",
                  description: "Descontar del inventario",
                },
                {
                  value: "return",
                  label: "Devolución de obra",
                  description: "Reintegrar material al inventario",
                },
              ]}
            />
          </Field>
        )}
        <Field label={`Cantidad (${unitName(selected?.unit || "")})`}>
          <input
            name="quantity"
            type="number"
            required
            min="0.001"
            step="0.001"
            max="1000000"
          />
        </Field>
        <Field label="Detalle o motivo">
          <input
            name="reason"
            required
            minLength={4}
            maxLength={1000}
            placeholder={
              leadId
                ? "Ej. Ventanas del segundo piso"
                : "Ej. Recepción según guía del proveedor"
            }
          />
        </Field>
      </div>
      <p className="hint">
        Disponible: {amount(selected?.balance || 0)}{" "}
        {unitName(selected?.unit || "")}. El movimiento queda en el historial;
        cerrar la obra no vuelve a descontarlo.
      </p>
      <Button disabled={busy || !material}>
        {busy ? "Registrando…" : "Registrar movimiento"}
      </Button>
    </form>
  );
}
export function Inventory() {
  const [items, setItems] = useState<Material[]>([]),
    [moves, setMoves] = useState<Movement[]>([]),
    [search, setSearch] = useState(""),
    [create, setCreate] = useState(false),
    [movement, setMovement] = useState(false),
    [unit, setUnit] = useState("unit"),
    [category, setCategory] = useState("Vidrio"),
    [busy, setBusy] = useState(false);
  const { error, setError, fail } = useMessage();
  const refresh = useCallback(() => {
    void Promise.all([
      api<Material[]>("/admin/crm/materials"),
      api<Movement[]>("/admin/crm/movements"),
    ])
      .then(([m, h]) => {
        setItems(m);
        setMoves(h);
      })
      .catch(fail);
  }, []);
  useEffect(refresh, [refresh]);
  useLiveRefresh(refresh);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      await post("/admin/crm/materials", {
        ...data,
        unit,
        category,
        minimum: Number(data.minimum),
      });
      setCreate(false);
      refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  const filtered = items.filter((m) =>
    `${m.name} ${m.sku} ${m.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <main className="ops-page">
      <div className="ops-heading">
        <div>
          <p>Almacén y trazabilidad por obra</p>
          <h1>Materiales bajo control.</h1>
          <span>
            Entradas, consumo real y devoluciones. Cada movimiento conserva su
            motivo y responsable.
          </span>
        </div>
        <div className="ops-heading-actions">
          <Button variant="ghost" onClick={() => setCreate(!create)}>
            <Plus size={16} />
            Nuevo material
          </Button>
          <Button disabled={!items.length} onClick={() => setMovement(true)}>
            <Package size={17} />
            Registrar entrada
          </Button>
        </div>
      </div>
      <div className="ops-summary">
        <div>
          <span>Materiales</span>
          <strong>{items.length}</strong>
        </div>
        <div>
          <span>Por reponer</span>
          <strong>{items.filter((m) => m.balance <= m.minimum).length}</strong>
        </div>
        <div>
          <span>Sin existencias</span>
          <strong>{items.filter((m) => m.balance === 0).length}</strong>
        </div>
      </div>
      {error && <Notice error>{error}</Notice>}
      {create && (
        <form className="ops-card" onSubmit={add}>
          <h2>Nuevo material</h2>
          <p className="hint">
            Se crea con saldo cero. Registra después la recepción para conservar
            el origen del stock.
          </p>
          <div className="ops-form-grid">
            {[
              ["sku", "Código / SKU"],
              ["name", "Nombre del material"],
              ["location", "Ubicación en almacén"],
              ["description", "Especificación o medida"],
            ].map(([name, label]) => (
              <Field key={name} label={label}>
                <input
                  name={name}
                  required={name === "sku" || name === "name"}
                  maxLength={name === "description" ? 1000 : 160}
                />
              </Field>
            ))}
            <Field label="Unidad de medida">
              <Select
                label="Unidad de medida"
                value={unit}
                onChange={setUnit}
                options={MATERIAL_UNITS.map((u) => ({
                  value: u.id,
                  label: u.name,
                }))}
              />
            </Field>
            <Field label="Familia">
              <Select
                label="Familia"
                value={category}
                onChange={setCategory}
                options={MATERIAL_CATEGORIES.map((c) => ({
                  value: c,
                  label: c,
                }))}
              />
            </Field>
            <Field label="Saldo mínimo">
              <input
                name="minimum"
                type="number"
                defaultValue="0"
                min="0"
                max="1000000"
                step="0.001"
                required
              />
            </Field>
          </div>
          <Button disabled={busy}>
            {busy ? "Creando…" : "Crear material"}
          </Button>
        </form>
      )}
      {movement && (
        <MaterialMovement
          materials={items}
          leadId={null}
          onCancel={() => setMovement(false)}
          onSaved={() => {
            setMovement(false);
            refresh();
          }}
        />
      )}
      <div className="ops-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Buscar materiales"
            placeholder="Nombre, código o familia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          className="ops-icon-button"
          aria-label="Actualizar inventario"
          onClick={refresh}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <div className="ops-table-wrap">
        <table className="ops-material-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Familia</th>
              <th>Ubicación</th>
              <th>Disponible</th>
              <th>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>
                  <strong>{m.name}</strong>
                  <small>
                    {m.sku} · {m.description}
                  </small>
                </td>
                <td>{m.category}</td>
                <td>{m.location || "Sin ubicación"}</td>
                <td>
                  <strong>{amount(m.balance)}</strong> {unitName(m.unit)}
                </td>
                <td>{amount(m.minimum)}</td>
                <td>
                  <span
                    className={`ops-stock-status ${m.balance <= m.minimum ? "low" : ""}`}
                  >
                    {m.balance === 0
                      ? "Sin stock"
                      : m.balance <= m.minimum
                        ? "Reponer"
                        : "Disponible"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="ops-empty">
            <Package size={32} />
            <h2>
              {items.length
                ? "No hay coincidencias"
                : "El almacén empieza con tu primer material"}
            </h2>
            <p>
              Registra vidrios, perfiles, herrajes y consumibles con sus
              unidades reales.
            </p>
          </div>
        )}
      </div>
      <section className="ops-card">
        <div className="ops-card-heading">
          <h2>Últimos movimientos</h2>
          <span>Hasta 100 registros recientes</span>
        </div>
        <Movements items={moves} />
      </section>
    </main>
  );
}
