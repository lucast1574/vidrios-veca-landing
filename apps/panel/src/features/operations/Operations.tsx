import { useEffect, useState } from "react";
import { LeadBoard } from "./LeadBoard";
import { LeadDetail } from "./LeadDetail";
import { Inventory } from "./Inventory";
function current() {
  const parts = location.hash.slice(1).split("/");
  return {
    id: parts[0] === "leads" ? parts[1] || "" : "",
    proposal: parts[2] || undefined,
  };
}
export function Operations({
  view,
  inventoryAccess = true,
}: {
  view: "leads" | "inventory";
  inventoryAccess?: boolean;
}) {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const update = () => setRoute(current());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  if (view === "inventory") return <Inventory />;
  return route.id ? (
    <LeadDetail
      key={route.id}
      id={route.id}
      inventoryAccess={inventoryAccess}
      proposal={route.proposal}
      back={() => {
        location.hash = "leads";
      }}
    />
  ) : (
    <LeadBoard
      open={(id, stage) => {
        location.hash = `leads/${id}${stage ? `/${stage}` : ""}`;
      }}
    />
  );
}
