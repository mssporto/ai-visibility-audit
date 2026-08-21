function startClock(el: HTMLElement): void {
  const format = () =>
    new Date().toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  el.textContent = format();
  setInterval(() => {
    el.textContent = format();
  }, 1000);
}

function init(): void {
  const clock = document.getElementById("corner-clock");
  if (clock) startClock(clock);

  const form = document.getElementById("checkin-form") as HTMLFormElement | null;
  const urlInput = document.getElementById("url-input") as HTMLInputElement | null;
  const submitButton = document.getElementById("checkin-submit") as HTMLButtonElement | null;
  const statusEl = document.getElementById("checkin-status");
  if (!form || !urlInput || !submitButton || !statusEl) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    // Basic client-side sanity check only — the real validation (protocol,
    // SSRF guard, etc.) happens server-side in the audit Function; this is
    // just to avoid navigating to /results with something that isn't a URL
    // at all.
    try {
      new URL(url);
    } catch {
      statusEl.textContent = "That doesn't look like a valid URL.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Examining…";
    window.location.href = `/results?url=${encodeURIComponent(url)}`;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export {};
