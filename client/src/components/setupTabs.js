export function SetupTabs({ activeTab, tabs, onChange }) {
  const nav = document.createElement("div");
  nav.className = "setup-tabs";
  nav.setAttribute("role", "tablist");
  nav.setAttribute("aria-label", "Encounter setup sections");

  tabs.forEach((tab, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "setup-tab";
    button.textContent = tab.label;
    button.id = `tab-${tab.id}`;
    button.dataset.tab = tab.id;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(tab.id === activeTab));
    button.setAttribute("aria-controls", `panel-${tab.id}`);
    button.tabIndex = tab.id === activeTab ? 0 : -1;
    button.addEventListener("click", () => onChange(tab.id));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0
        : event.key === "End" ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      onChange(tabs[nextIndex].id);
      requestAnimationFrame(() => nav.querySelector(`[data-tab="${tabs[nextIndex].id}"]`)?.focus());
    });
    nav.append(button);
  });
  return nav;
}
