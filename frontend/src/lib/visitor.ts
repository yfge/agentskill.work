export function getVisitorId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const key = "agentskill_visitor_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}
