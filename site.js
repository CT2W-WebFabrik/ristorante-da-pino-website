(() => {
  const hours = window.HOURS || {};
  const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const names = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

  function berlinNow() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const get = type => parts.find(p => p.type === type).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: Number(get("hour")) * 60 + Number(get("minute")) };
  }

  function statusText() {
    const { day, min } = berlinNow();
    const today = hours[day] || [];
    const open = today.find(([o, c]) => min >= toMin(o) && min < toMin(c));
    if (open) return [true, `Jetzt geöffnet, heute bis ${open[1]} Uhr`];
    const later = today.find(([o]) => min < toMin(o));
    if (later) return [false, `Gerade geschlossen, heute wieder ab ${later[0]} Uhr`];
    for (let k = 1; k <= 7; k++) {
      const d = (day + k) % 7;
      if ((hours[d] || []).length) {
        const when = k === 1 ? "morgen" : names[d];
        return [false, `${today.length ? "Gerade geschlossen" : "Heute Ruhetag"}, ${when} ab ${hours[d][0][0]} Uhr`];
      }
    }
    return [false, ""];
  }

  const [isOpen, text] = statusText();
  document.querySelectorAll("[data-status]").forEach(el => {
    el.textContent = text;
    el.classList.toggle("open", isOpen);
    el.hidden = !text;
  });
  const today = berlinNow().day;
  document.querySelectorAll(".hours tr").forEach(tr => {
    if (tr.dataset.days.split(",").map(Number).includes(today)) tr.classList.add("today");
  });

  const toggle = document.getElementById("pickup-only");
  const apply = () => document.body.classList.toggle("pickup-only", toggle.checked);
  toggle?.addEventListener("change", apply);
  document.querySelector("[data-pickup-jump]")?.addEventListener("click", () => {
    toggle.checked = true;
    apply();
    document.getElementById("karte").scrollIntoView({ behavior: "smooth" });
  });

  const chips = [...document.querySelectorAll(".chips a")];
  const byId = new Map(chips.map(a => [a.hash.slice(1), a]));
  const seen = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const chip = byId.get(e.target.id);
      chips.forEach(a => a.removeAttribute("aria-current"));
      chip.setAttribute("aria-current", "true");
      const bar = chip.closest("ul");
      bar.scrollTo({ left: chip.parentElement.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll(".carta .sec").forEach(s => seen.observe(s));
})();
