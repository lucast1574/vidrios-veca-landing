import { useEffect, useState } from "react";
import {
  LEAD_SEGMENTS,
  LEAD_STAGES,
  MATERIAL_UNITS,
  type Lead,
  type LeadInput,
  type LeadAttachment,
  type Movement,
} from "@veca/content";
import { API_BASE } from "../../lib/api";
export type LeadDetailData = {
  lead: Lead;
  attachments: LeadAttachment[];
  movements: Movement[];
};
export const stageName = (id: string) =>
  LEAD_STAGES.find((s) => s.id === id)?.name || id;
export const segmentName = (id: string) =>
  LEAD_SEGMENTS.find((s) => s.id === id)?.name || id;
export const unitName = (id: string) =>
  MATERIAL_UNITS.find((u) => u.id === id)?.name || id;
export const date = (s: string) =>
  new Date(s).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
export const amount = (n: number) =>
  n.toLocaleString("es-PE", { maximumFractionDigits: 3 });
export function leadInput(lead: Lead): LeadInput {
  const {
    name,
    email,
    phone,
    district,
    requestType,
    idea,
    version,
    segment,
    stage,
    assignedTo,
    contactResult,
    appointment,
    address,
    workPlan,
    contractStatus,
    contractReference,
    completionNote,
    discardReason,
  } = lead;
  return {
    name,
    email,
    phone,
    district,
    requestType,
    idea,
    version,
    segment,
    stage,
    assignedTo,
    contactResult,
    appointment:
      appointment && Number.isFinite(Date.parse(appointment))
        ? new Date(
            Date.parse(
              /(Z|[+-]\d{2}:\d{2})$/.test(appointment)
                ? appointment
                : appointment + ":00-05:00",
            ) -
              5 * 60 * 60 * 1000,
          )
            .toISOString()
            .slice(0, 16)
        : appointment,
    address,
    workPlan,
    contractStatus,
    contractReference,
    completionNote,
    discardReason,
  };
}
export function useLiveRefresh(refresh: () => void) {
  useEffect(() => {
    const stream = new EventSource(API_BASE + "/admin/crm/events", {
      withCredentials: true,
    });
    const update = (event: MessageEvent) => {
      try {
        if (JSON.parse(event.data).topic !== "heartbeat") refresh();
      } catch {}
    };
    stream.onmessage = update;
    stream.onopen = refresh;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 15000);
    return () => {
      stream.close();
      clearInterval(timer);
    };
  }, [refresh]);
}
export function Movements({ items }: { items: Movement[] }) {
  return items.length ? (
    <div className="ops-ledger">
      {items.map((m) => (
        <div key={m.id}>
          <span className={`ops-move-kind ${m.kind}`}>
            {m.kind === "consumption"
              ? "Salida"
              : m.kind === "return"
                ? "Devolución"
                : "Entrada"}
          </span>
          <div>
            <strong>{m.materialName}</strong>
            <p>{m.reason}</p>
            <small>
              {date(m.at)} · {m.actor}
            </small>
            {m.leadId && <a href={`#leads/${m.leadId}`}>Ver obra</a>}
          </div>
          <strong>
            {m.kind === "consumption" ? "−" : "+"}
            {amount(m.quantity)} <small>{unitName(m.unit)}</small>
          </strong>
          <small>Saldo: {amount(m.balanceAfter)}</small>
        </div>
      ))}
    </div>
  ) : (
    <p className="ops-empty-small">Todavía no hay movimientos registrados.</p>
  );
}
export function useMessage() {
  const [error, setError] = useState("");
  return {
    error,
    setError,
    fail: (e: unknown) => setError((e as Error).message),
  };
}
