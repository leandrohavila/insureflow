export const PORTAL_EVENTS = {
  whatsapp: "whatsapp_click",
  interest: "interest_click",
  visit: "visit_click",
} as const;

export type PortalEventName = (typeof PORTAL_EVENTS)[keyof typeof PORTAL_EVENTS];

export type PortalEventDetail = {
  event: PortalEventName;
  label?: string;
  href?: string;
  propertySlug?: string;
};

type DataLayerWindow = Window & { dataLayer?: Array<Record<string, string>> };

export function trackPortalEvent(detail: PortalEventDetail) {
  if (typeof window === "undefined") return;
  const payload = {
    event: detail.event,
    label: detail.label ?? "",
    href: detail.href ?? "",
    propertySlug: detail.propertySlug ?? "",
  };
  window.dispatchEvent(new CustomEvent("portal:track", { detail: payload }));
  const target = window as DataLayerWindow;
  target.dataLayer = target.dataLayer ?? [];
  target.dataLayer.push(payload);
}
