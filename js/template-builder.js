// Builds randomized Creatomate "source" JSON for a cinematic vintage reel.
// Inspired by CapCut: Polaroid stack, Super 8, 2.39:1 cinema, Kodachrome, VHS, Old Reel.
// Every call returns a different look thanks to randomized template + grade + transitions
// + title font + speed + caption styling.

(function () {
  const W = 1080;
  const H = 1920;

  const GRADES = {
    kodachrome: { brightness: 4, contrast: 12, saturation: -8, gamma: 0.95, tint: "#e0a86b", tintAmount: 12 },
    sepia:      { brightness: -2, contrast: 6, saturation: -55, gamma: 0.95, tint: "#a87543", tintAmount: 38 },
    teal_orange:{ brightness: 0, contrast: 18, saturation: 6, gamma: 0.92, tint: "#00b3c4", tintAmount: 6 },
    vhs:        { brightness: -4, contrast: 22, saturation: 22, gamma: 1.05, tint: "#7a5cff", tintAmount: 5 },
    bw:         { brightness: 2, contrast: 18, saturation: -100, gamma: 0.95, tint: "#ffffff", tintAmount: 0 },
    super8:     { brightness: 6, contrast: 8, saturation: -22, gamma: 0.9, tint: "#d6a35a", tintAmount: 18 },
  };

  const FONTS = [
    { family: "Playfair Display", weight: 700, italic: false }, // serif elegance
    { family: "Cormorant Garamond", weight: 600, italic: true }, // editorial
    { family: "Bebas Neue", weight: 700, italic: false }, // condensed cinema
    { family: "Special Elite", weight: 400, italic: false }, // typewriter
    { family: "Caveat", weight: 700, italic: false }, // handwritten
  ];

  const TEMPLATE_KEYS = [
    "polaroid_stack",
    "super8_home",
    "cinema_239",
    "kodachrome",
    "old_reel",
    "vhs",
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Animations available across templates
  const ZOOM_IN = (start = "100%", end = "115%") => ({
    type: "scale", scope: "element", start_scale: start, end_scale: end, easing: "linear",
  });
  const ZOOM_OUT = () => ({
    type: "scale", scope: "element", start_scale: "115%", end_scale: "100%", easing: "linear",
  });
  const PAN_X = (dir = 1) => ({
    type: "x", scope: "element", start_x: `${50 - 6 * dir}%`, end_x: `${50 + 6 * dir}%`, easing: "linear",
  });
  const FADE_IN = { type: "fade", scope: "in", duration: 0.4 };
  const FADE_OUT = { type: "fade", scope: "out", duration: 0.4 };
  const FLASH_IN = { type: "fade", scope: "in", duration: 0.08 };

  // Picks a Ken Burns style for a clip
  function kenBurns() {
    const styles = [
      [ZOOM_IN()],
      [ZOOM_OUT()],
      [ZOOM_IN("100%", "112%"), PAN_X(1)],
      [ZOOM_IN("105%", "115%"), PAN_X(-1)],
    ];
    return pick(styles);
  }

  // Build the base composition shared by all templates
  function buildBase(media, opts) {
    const { duration, slotTime, grade, transitions, font, titleText, outroText, hasLetterbox } = opts;
    const elements = [];

    // Background (solid black so letterbox bars look intentional)
    elements.push({
      name: "Background",
      type: "shape",
      track: 1,
      time: 0,
      duration,
      width: "100%",
      height: "100%",
      fill_color: "#000000",
    });

    // Intro card (0 -> 1.6s)
    elements.push({
      name: "IntroCard",
      type: "text",
      track: 5,
      time: 0,
      duration: 1.6,
      x: "50%", y: "50%", x_anchor: "50%", y_anchor: "50%",
      width: "82%",
      text: titleText,
      font_family: font.family,
      font_weight: String(font.weight),
      font_style: font.italic ? "italic" : "normal",
      font_size: "9 vmin",
      fill_color: "#f5ead4",
      text_alignment_horizontal: "center",
      animations: [FADE_IN, FADE_OUT, ZOOM_IN("100%", "108%")],
    });

    // Media slots
    let t = 1.6;
    media.forEach((m, i) => {
      const isVideo = m.kind === "video";
      const useDuration = Math.min(slotTime, m.kind === "video" ? (m.duration || slotTime) : slotTime);
      const transition = transitions[i % transitions.length];
      const animations = [...kenBurns()];
      if (transition === "fade") animations.push(FADE_IN, FADE_OUT);
      if (transition === "flash") animations.push(FLASH_IN);

      elements.push({
        name: `Clip${i + 1}`,
        type: isVideo ? "video" : "image",
        track: 2,
        time: t,
        duration: useDuration,
        source: m.url,
        fit: "cover",
        x: "50%", y: "50%", x_anchor: "50%", y_anchor: "50%",
        width: "100%", height: "100%",
        audio_fade_in: 0.05,
        audio_fade_out: 0.05,
        volume: isVideo ? "65%" : "0%",
        animations,
      });
      t += useDuration;
    });

    // Outro card (last 1.8s)
    elements.push({
      name: "OutroCard",
      type: "text",
      track: 5,
      time: Math.max(0, t - 0.0),
      duration: 1.8,
      x: "50%", y: "60%", x_anchor: "50%", y_anchor: "50%",
      width: "82%",
      text: outroText,
      font_family: font.family,
      font_weight: String(font.weight),
      font_style: font.italic ? "italic" : "normal",
      font_size: "8 vmin",
      fill_color: "#f5ead4",
      text_alignment_horizontal: "center",
      animations: [FADE_IN, FADE_OUT],
    });

    // Letterbox bars
    if (hasLetterbox) {
      elements.push({
        name: "LetterTop",
        type: "shape",
        track: 9,
        time: 0,
        duration,
        width: "100%",
        height: "12%",
        x: "50%", y: "0%", x_anchor: "50%", y_anchor: "0%",
        fill_color: "#000000",
      });
      elements.push({
        name: "LetterBot",
        type: "shape",
        track: 9,
        time: 0,
        duration,
        width: "100%",
        height: "12%",
        x: "50%", y: "100%", x_anchor: "50%", y_anchor: "100%",
        fill_color: "#000000",
      });
    }

    // Color grade as a tinted overlay for warmth/coolness
    if (grade.tintAmount > 0) {
      elements.push({
        name: "Tint",
        type: "shape",
        track: 8,
        time: 0,
        duration,
        width: "100%", height: "100%",
        fill_color: grade.tint,
        opacity: `${grade.tintAmount}%`,
        blend_mode: "overlay",
      });
    }

    // Vignette
    elements.push({
      name: "Vignette",
      type: "shape",
      track: 10,
      time: 0,
      duration,
      width: "100%", height: "100%",
      fill_color: "#000000",
      opacity: "65%",
      blend_mode: "multiply",
      shadow_color: "#000000",
      mask_mode: "alpha",
    });

    return {
      output_format: "mp4",
      frame_rate: 30,
      width: W,
      height: H,
      duration,
      fill_color: "#000000",
      brightness: grade.brightness,
      contrast: grade.contrast,
      saturation: grade.saturation,
      gamma: grade.gamma,
      elements,
    };
  }

  function pickTemplate() {
    const templateKey = pick(TEMPLATE_KEYS);
    const presets = {
      polaroid_stack: { grade: GRADES.kodachrome, transitions: ["fade", "fade"], hasLetterbox: false, font: FONTS[0] },
      super8_home:    { grade: GRADES.super8,     transitions: ["flash", "cut"], hasLetterbox: false, font: FONTS[4] },
      cinema_239:     { grade: GRADES.teal_orange,transitions: ["fade", "fade"], hasLetterbox: true,  font: FONTS[1] },
      kodachrome:     { grade: GRADES.kodachrome, transitions: ["fade", "cut"],  hasLetterbox: false, font: FONTS[2] },
      old_reel:       { grade: GRADES.sepia,      transitions: ["flash", "flash"], hasLetterbox: true, font: FONTS[3] },
      vhs:            { grade: GRADES.vhs,        transitions: ["cut", "cut"],   hasLetterbox: false, font: FONTS[3] },
    };
    return { key: templateKey, ...presets[templateKey] };
  }

  /**
   * @param {Array<{url: string, kind: 'image'|'video', duration?: number}>} media
   * @param {{ trip_title: string, trip_place: string, who: string }} ctx
   * @returns {{ source: object, meta: { template: string, grade: string, font: string } }}
   */
  function buildReel(media, ctx) {
    if (!media || media.length < 1) throw new Error("No media provided");

    const tpl = pickTemplate();
    const ordered = shuffle(media).slice(0, 6);
    const slotTime = ordered.length <= 4 ? 4.2 : 3.4;
    const duration = +(1.6 + ordered.length * slotTime + 1.8).toFixed(2);

    const titleText = ctx.trip_title.toUpperCase();
    const outroText = `${ctx.trip_place}\nby ${ctx.who}`;

    const source = buildBase(ordered, {
      duration,
      slotTime,
      grade: tpl.grade,
      transitions: tpl.transitions,
      font: tpl.font,
      titleText,
      outroText,
      hasLetterbox: tpl.hasLetterbox,
    });

    return {
      source,
      meta: {
        template: tpl.key,
        grade: Object.keys(GRADES).find((k) => GRADES[k] === tpl.grade) || "custom",
        font: tpl.font.family,
      },
    };
  }

  window.ReelTemplate = { buildReel };
})();
