// Builds randomized Creatomate "source" JSON for a cinematic vintage reel.
// Inspired by CapCut: Polaroid stack, Super 8, 2.39:1 cinema, Kodachrome, VHS, Old Reel.
// Every call returns a different look thanks to randomized template + grade + font + transitions.

(function () {
  const W = 1080;
  const H = 1920;

  // Color grades. Brightness/contrast/saturation are top-level Creatomate composition props.
  const GRADES = {
    kodachrome:  { brightness: 4,  contrast: 12, saturation: -8 },
    sepia:       { brightness: -2, contrast: 6,  saturation: -55 },
    teal_orange: { brightness: 0,  contrast: 18, saturation: 6 },
    vhs:         { brightness: -4, contrast: 22, saturation: 22 },
    bw:          { brightness: 2,  contrast: 18, saturation: -100 },
    super8:      { brightness: 6,  contrast: 8,  saturation: -22 },
  };

  const FONTS = [
    { family: "Playfair Display", weight: 700 },
    { family: "Cormorant Garamond", weight: 600 },
    { family: "Bebas Neue", weight: 700 },
    { family: "Special Elite", weight: 400 },
    { family: "Caveat", weight: 700 },
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

  // Animations (only Creatomate-spec valid types: fade, scale)
  const FADE_IN  = { time: 0,            duration: 0.5, easing: "linear",      type: "fade", fade_mode: "in" };
  const FADE_OUT = { time: "end-0.5 s",  duration: 0.5, easing: "linear",      type: "fade", fade_mode: "out" };
  const FLASH_IN = { time: 0,            duration: 0.1, easing: "linear",      type: "fade", fade_mode: "in" };

  function zoomIn(start = 100, end = 115) {
    return {
      time: 0,
      duration: "100%", scope: "element",
      easing: "linear", type: "scale",
      start_scale: { x: `${start}%`, y: `${start}%` },
      end_scale:   { x: `${end}%`,   y: `${end}%` },
    };
  }
  function zoomOut(start = 115, end = 100) {
    return {
      time: 0,
      duration: "100%", scope: "element",
      easing: "linear", type: "scale",
      start_scale: { x: `${start}%`, y: `${start}%` },
      end_scale:   { x: `${end}%`,   y: `${end}%` },
    };
  }

  function kenBurns() {
    return pick([
      [zoomIn()],
      [zoomOut()],
      [zoomIn(100, 110)],
      [zoomIn(105, 118)],
    ]);
  }

  function buildBase(media, opts) {
    const { duration, slotTime, grade, transitions, font, titleText, outroText } = opts;
    const elements = [];

    // Intro card
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
      font_size: "9 vmin",
      fill_color: "#f5ead4",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [FADE_IN, FADE_OUT],
    });

    // Media slots. No animations on clips for now (debugging blank output).
    let t = 1.6;
    media.forEach((m, i) => {
      const isVideo = m.kind === "video";
      const useDuration = Math.min(slotTime, isVideo ? (m.duration || slotTime) : slotTime);

      elements.push({
        name: `Clip${i + 1}`,
        type: isVideo ? "video" : "image",
        track: 2,
        time: t,
        duration: useDuration,
        source: m.url,
        fit: "cover",
      });
      t += useDuration;
    });

    // Outro card overlapping the tail of the last clip
    const outroDur = 1.8;
    elements.push({
      name: "OutroCard",
      type: "text",
      track: 5,
      time: Math.max(0, duration - outroDur),
      duration: outroDur,
      x: "50%", y: "62%", x_anchor: "50%", y_anchor: "50%",
      width: "82%",
      text: outroText,
      font_family: font.family,
      font_weight: String(font.weight),
      font_size: "7 vmin",
      fill_color: "#f5ead4",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [FADE_IN, FADE_OUT],
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
      elements,
    };
  }

  function pickTemplate() {
    const templateKey = pick(TEMPLATE_KEYS);
    const presets = {
      polaroid_stack: { grade: GRADES.kodachrome,  transitions: ["fade",  "fade" ], font: FONTS[0] },
      super8_home:    { grade: GRADES.super8,      transitions: ["flash", "cut"  ], font: FONTS[4] },
      cinema_239:     { grade: GRADES.teal_orange, transitions: ["fade",  "fade" ], font: FONTS[1] },
      kodachrome:     { grade: GRADES.kodachrome,  transitions: ["fade",  "cut"  ], font: FONTS[2] },
      old_reel:       { grade: GRADES.sepia,       transitions: ["flash", "flash"], font: FONTS[3] },
      vhs:            { grade: GRADES.vhs,         transitions: ["cut",   "cut"  ], font: FONTS[3] },
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
    const duration = +(1.6 + ordered.length * slotTime).toFixed(2);

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
