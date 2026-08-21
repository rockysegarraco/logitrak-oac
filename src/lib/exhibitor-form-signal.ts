const EVENT = "open-exhibitor-form";

let pending = false;
const listeners = new Set<() => void>();

export function requestOpenExhibitorForm() {
  if (listeners.size === 0) {
    // No dashboard mounted yet (e.g. mid-navigation) — queue the request.
    pending = true;
    return;
  }
  listeners.forEach((l) => l());
}

export function subscribeOpenExhibitorForm(listener: () => void) {
  listeners.add(listener);
  if (pending) {
    pending = false;
    // Let the subscriber finish mounting first.
    setTimeout(listener, 0);
  }
  return () => {
    listeners.delete(listener);
  };
}

export const OPEN_EXHIBITOR_FORM_EVENT = EVENT;
