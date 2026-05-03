// Main app: auth gate, file picking, Supabase upload, render trigger, polling.
(function () {
  const cfg = window.APP_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    gate: $("#gate"),
    studio: $("#studio"),
    gateForm: $("#gate-form"),
    password: $("#password"),
    gateError: $("#gate-error"),
    whoName: $("#who-name"),
    files: $("#files"),
    uploadZone: $("#upload-zone"),
    fileList: $("#file-list"),
    generate: $("#generate"),
    generateHelp: $("#generate-help"),
    renderStatus: $("#render-status"),
    statusText: $("#status-text"),
    result: $("#result"),
    reelVideo: $("#reel-video"),
    download: $("#download"),
    another: $("#another"),
    error: $("#error"),
  };

  // ---------- Supabase client ----------
  let sb = null;
  function ensureSupabase() {
    if (sb) return sb;
    if (!window.supabase || !cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("YOUR-PROJECT")) {
      throw new Error("Supabase not configured. Edit js/config.js with your project URL and anon key.");
    }
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    return sb;
  }

  // ---------- Gate ----------
  function showStudio() {
    els.gate.hidden = true;
    els.studio.hidden = false;
  }

  function tryGate(pw) {
    if (pw === cfg.PASSWORD) {
      sessionStorage.setItem("reels-auth", "1");
      showStudio();
      return true;
    }
    return false;
  }

  if (sessionStorage.getItem("reels-auth") === "1") {
    showStudio();
  }

  els.gateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = tryGate(els.password.value.trim());
    els.gateError.hidden = ok;
    if (!ok) els.password.select();
  });

  // ---------- Who picker ----------
  $$('input[name="who"]').forEach((r) => {
    r.addEventListener("change", () => {
      els.whoName.textContent = r.value;
      validate();
    });
  });

  function getWho() {
    const r = document.querySelector('input[name="who"]:checked');
    return r ? r.value : null;
  }

  // ---------- File handling ----------
  /** @type {{ id: string, file: File, kind: 'image'|'video', preview: string }[]} */
  let items = [];

  function uid() { return Math.random().toString(36).slice(2, 9); }

  function addFiles(fileList) {
    const files = Array.from(fileList);
    for (const f of files) {
      if (items.length >= cfg.MAX_FILES) {
        showError(`Max ${cfg.MAX_FILES} items.`);
        break;
      }
      const isImg = f.type.startsWith("image/");
      const isVid = f.type.startsWith("video/");
      if (!isImg && !isVid) continue;
      const sizeMb = f.size / (1024 * 1024);
      if (sizeMb > cfg.MAX_FILE_MB) {
        showError(`${f.name} is ${sizeMb.toFixed(0)} MB. Max ${cfg.MAX_FILE_MB} MB per file.`);
        continue;
      }
      const item = {
        id: uid(),
        file: f,
        kind: isImg ? "image" : "video",
        preview: URL.createObjectURL(f),
      };
      items.push(item);
    }
    renderList();
    validate();
  }

  function removeItem(id) {
    const it = items.find((x) => x.id === id);
    if (it) URL.revokeObjectURL(it.preview);
    items = items.filter((x) => x.id !== id);
    renderList();
    validate();
  }

  function renderList() {
    els.fileList.innerHTML = "";
    items.forEach((it, i) => {
      const li = document.createElement("li");
      const media = document.createElement(it.kind === "video" ? "video" : "img");
      media.src = it.preview;
      if (it.kind === "video") {
        media.muted = true;
        media.playsInline = true;
        media.preload = "metadata";
      } else {
        media.alt = "";
        media.addEventListener("error", () => {
          li.classList.add("no-preview");
          media.remove();
          const ph = document.createElement("span");
          ph.className = "placeholder";
          ph.textContent = (it.file.name || "image").slice(0, 18);
          li.insertBefore(ph, li.firstChild);
        });
      }
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = it.kind === "video" ? "VID" : "IMG";
      const rm = document.createElement("button");
      rm.className = "remove";
      rm.type = "button";
      rm.setAttribute("aria-label", `Remove item ${i + 1}`);
      rm.textContent = "x";
      rm.addEventListener("click", () => removeItem(it.id));
      li.appendChild(media);
      li.appendChild(badge);
      li.appendChild(rm);
      els.fileList.appendChild(li);
    });
  }

  els.files.addEventListener("change", (e) => addFiles(e.target.files));

  // Drag and drop
  ["dragenter", "dragover"].forEach((ev) =>
    els.uploadZone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.uploadZone.classList.add("drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    els.uploadZone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.uploadZone.classList.remove("drag");
    })
  );
  els.uploadZone.addEventListener("drop", (e) => {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  function validate() {
    const ok = items.length >= cfg.MIN_FILES && getWho();
    els.generate.disabled = !ok;
    if (!getWho()) {
      els.generateHelp.textContent = "Pick your name to enable.";
    } else if (items.length < cfg.MIN_FILES) {
      els.generateHelp.textContent = `Add at least ${cfg.MIN_FILES} items to enable.`;
    } else {
      els.generateHelp.textContent = `Ready. ${items.length} items selected.`;
    }
  }

  function showError(msg) {
    els.error.textContent = msg;
    els.error.hidden = false;
    setTimeout(() => { els.error.hidden = true; }, 6000);
  }

  // ---------- Probe video duration ----------
  function probeDuration(file) {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = URL.createObjectURL(file);
      v.onloadedmetadata = () => {
        const d = isFinite(v.duration) ? v.duration : null;
        URL.revokeObjectURL(v.src);
        resolve(d);
      };
      v.onerror = () => resolve(null);
    });
  }

  // ---------- Upload to Supabase ----------
  async function uploadAll(items) {
    const client = ensureSupabase();
    const stamp = Date.now();
    const uploaded = [];
    let i = 0;
    for (const it of items) {
      i++;
      els.statusText.textContent = `Uploading ${i} of ${items.length}...`;
      const ext = (it.file.name.split(".").pop() || (it.kind === "video" ? "mp4" : "jpg")).toLowerCase();
      const path = `${stamp}/${uid()}.${ext}`;
      const { error } = await client.storage
        .from(cfg.STORAGE_BUCKET)
        .upload(path, it.file, { upsert: false, contentType: it.file.type });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data } = client.storage.from(cfg.STORAGE_BUCKET).getPublicUrl(path);
      let duration = null;
      if (it.kind === "video") duration = await probeDuration(it.file);
      uploaded.push({ url: data.publicUrl, kind: it.kind, duration });
    }
    return uploaded;
  }

  // ---------- Render ----------
  async function startRender(media) {
    const who = getWho();
    const built = window.ReelTemplate.buildReel(media, {
      trip_title: cfg.TRIP_TITLE,
      trip_place: cfg.TRIP_PLACE,
      who,
    });

    els.statusText.textContent = `Rendering with ${labelFor(built.meta.template)} look...`;

    const res = await fetch("/.netlify/functions/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: built.source, meta: built.meta }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Render request failed: ${err}`);
    }
    const data = await res.json();
    return { id: data.id, meta: built.meta };
  }

  async function pollRender(id) {
    const start = Date.now();
    while (Date.now() - start < 4 * 60 * 1000) {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await fetch(`/.netlify/functions/render-status?id=${encodeURIComponent(id)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === "succeeded") return data.url;
      if (data.status === "failed") throw new Error(data.error_message || "Render failed");
      els.statusText.textContent = `Rendering... ${data.status || "in progress"}`;
    }
    throw new Error("Render timed out. Try again with fewer or smaller clips.");
  }

  function labelFor(key) {
    return ({
      polaroid_stack: "Polaroid Stack",
      super8_home: "Super 8 Home Movie",
      cinema_239: "2.39:1 Cinema",
      kodachrome: "Kodachrome",
      old_reel: "Old Film Reel",
      vhs: "VHS",
    })[key] || "vintage";
  }

  // ---------- Generate handler ----------
  els.generate.addEventListener("click", async () => {
    els.error.hidden = true;
    els.result.hidden = true;
    els.renderStatus.hidden = false;
    els.generate.disabled = true;
    try {
      const uploaded = await uploadAll(items);
      const { id } = await startRender(uploaded);
      const reelUrl = await pollRender(id);
      els.reelVideo.src = reelUrl;
      els.download.href = reelUrl;
      els.download.download = `fauz-bday-reel-${Date.now()}.mp4`;
      els.result.hidden = false;
      els.result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      console.error(e);
      showError(e.message || "Something went wrong. Try again.");
    } finally {
      els.renderStatus.hidden = true;
      els.generate.disabled = false;
    }
  });

  els.another.addEventListener("click", () => {
    els.result.hidden = true;
    els.reelVideo.removeAttribute("src");
    els.reelVideo.load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  validate();
})();
