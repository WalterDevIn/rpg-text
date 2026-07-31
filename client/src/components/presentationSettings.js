export function PresentationSettings({ preferences, onChange }) {
  const details = document.createElement("details");
  details.className = "presentation-settings";
  details.innerHTML = `<summary>PRESENTATION <span class="presentation-settings-status"></span></summary><div class="presentation-settings-body"></div>`;
  const body = details.querySelector(".presentation-settings-body");
  const values = preferences.get();
  const sound = checkbox("Sound enabled", values.soundEnabled, (checked) => onChange({ soundEnabled: checked }));
  const animation = checkbox("Text animation", values.textAnimationEnabled, (checked) => onChange({ textAnimationEnabled: checked }));
  const volume = document.createElement("label");
  volume.textContent = "Master volume";
  const slider = document.createElement("input");
  slider.type = "range"; slider.min = "0"; slider.max = "1"; slider.step = ".05"; slider.value = values.masterVolume; slider.setAttribute("aria-label", "Master volume");
  slider.addEventListener("input", () => onChange({ masterVolume: Number(slider.value) }));
  volume.append(slider);
  body.append(sound, animation, volume);
  return details;
}

function checkbox(labelText, checked, onInput) {
  const label = document.createElement("label");
  const input = document.createElement("input"); input.type = "checkbox"; input.checked = checked; input.addEventListener("change", () => onInput(input.checked));
  label.append(input, document.createTextNode(` ${labelText}`));
  return label;
}
