import { codespacesApiBaseUrl, getApiBaseUrl, normalizeApiBaseUrl, setStoredApiBaseUrl, clearStoredApiBaseUrl } from "../services/apiConfig.js";

export function ConnectionSettings({ service, status = "connected", onRetry }) {
  const details = document.createElement("details");
  details.className = "connection-settings";
  const summary = document.createElement("summary");
  summary.innerHTML = `Server connection <span class="connection-status ${status}">${status}</span>`;
  details.append(summary);

  const body = document.createElement("div");
  body.className = "connection-settings-body";
  const label = document.createElement("label");
  label.textContent = "Backend URL";
  const input = document.createElement("input");
  input.type = "url";
  input.value = getApiBaseUrl();
  input.placeholder = codespacesApiBaseUrl;
  input.setAttribute("aria-label", "Backend URL");
  const actions = document.createElement("div");
  actions.className = "connection-actions";
  const test = button("Test connection");
  const save = button("Save");
  const reset = button("Use automatic");
  actions.append(test, save, reset);
  const message = document.createElement("p");
  message.className = "connection-message";
  body.append(label, input, actions, message);
  details.append(body);

  function setStatus(next, text = "") {
    const statusElement = summary.querySelector(".connection-status");
    statusElement.className = `connection-status ${next}`;
    statusElement.textContent = next;
    message.textContent = text;
  }

  test.addEventListener("click", async () => {
    let normalized;
    try {
      normalized = normalizeApiBaseUrl(input.value);
    } catch {
      setStatus("invalid", "Enter a valid backend URL, without requiring /api/health.");
      return;
    }
    setStatus("connecting", "Testing /api/health...");
    try {
      await service.getHealth(normalized);
      input.value = normalized;
      setStatus("connected", "The backend responded successfully.");
    } catch (error) {
      setStatus("unavailable", error.message);
    }
  });

  save.addEventListener("click", () => {
    try {
      input.value = setStoredApiBaseUrl(input.value);
      setStatus("connecting", "Saved. Retry the content request to reconnect.");
      onRetry?.();
    } catch {
      setStatus("invalid", "Enter a valid backend URL.");
    }
  });

  reset.addEventListener("click", () => {
    input.value = clearStoredApiBaseUrl();
    setStatus("connecting", "Automatic API mode restored.");
    onRetry?.();
  });

  return details;
}

function button(text) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = text;
  return element;
}
