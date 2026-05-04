// Builds randomized Creatomate "source" JSON for a cinematic vintage reel.
// Goal: feel like a director assembled the trip footage.
// Templates randomize: grade, font, letterbox, pacing, transitions, intro/outro phrasing.

(function () {
  const W = 1080;
  const H = 1920;

  // Color grades (top-level Creatomate brightness/contrast/saturation)
  const GRADES = {
    cinema:     { brightness: 0,  contrast: 22, saturation: 6   },
    kodachrome: { brightness: 4,  contrast: 14, saturation: -10 },
    sepia:      { brightness: 2,  contrast: 18, saturation: -55 },
    teal:       { brightness: -2, contrast: 24, saturation: 14  },
    bw:         { brightness: 4,  contrast: 22, saturation: -100 },
    warm:       { brightness: 6,  contrast: 12, saturation: -18 },
  };

  const TEMPLATES = [
    {
      key: "cinema_239",
      grade: GRADES.cinema,
      font: "Cormorant Garamond",
      fontWeight: 600,
      letterbox: true,
      pacing: 4.2,
      titleSub: "A FILM",
      outroPrefix: "directed by",
    },
    {
      key: "kodachrome_summer",
      grade: GRADES.kodachrome,
      font: "Playfair Display",
      fontWeight: 700,
      letterbox: false,
      pacing: 3.6,
      titleSub: "SUMMER OF",
      outroPrefix: "a film by",
    },
    {
      key: "sepia_memoirs",
      grade: GRADES.sepia,
      font: "Special Elite",
      fontWeight: 400,
      letterbox: true,
      pacing: 4.6,
      titleSub: "MEMOIRS",
      outroPrefix: "kept by",
    },
    {
      key: "teal_orange",
      grade: GRADES.teal,
      font: "Bebas Neue",
      fontWeight: 700,
      letterbox: true,
      pacing: 3.8,
      titleSub: "EST. 2026",
      outroPrefix: "shot by",
    },
    {
      key: "bw_arthouse",
      grade: GRADES.bw,
      font: "Cormorant Garamond",
      fontWeight: 600,
      letterbox: true,
      pacing: 4.4,
      titleSub: "REEL N°1",
      outroPrefix: "captured by",
    },
    {
      key: "warm_super8",
      grade: GRADES.warm,
      font: "Caveat",
      fontWeight: 700,
      letterbox: false,
      pacing: 3.4,
      titleSub: "HOME MOVIES",
      outroPrefix: "filmed by",
    },
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

  function fadeIn(duration = 0.4) {
    return { type: "fade", time: 0, duration, easing: "linear" };
  }
  function fadeOutAt(elementDuration, duration = 0.5) {
    return {
      type: "fade",
      time: Math.max(0, elementDuration - duration),
      duration,
      easing: "linear",
      reversed: true,
    };
  }
  function kenBurns(elementDuration, zoomIn = true) {
    const start = zoomIn ? "100%" : "110%";
    const end   = zoomIn ? "110%" : "100%";
    return {
      type: "scale",
      time: 0,
      duration: elementDuration,
      easing: "linear",
      start_scale: start,
      end_scale: end,
      x_anchor: "50%",
      y_anchor: "50%",
    };
  }

  function buildElements(media, ctx, tpl) {
    const elements = [];
    const slotTime = tpl.pacing;

    // Clip slots
    let t = 1.6; // intro takes 0..1.6
    media.forEach((m, i) => {
      const isVideo = m.kind === "video";
      const useDur = Math.min(slotTime, isVideo ? (m.duration || slotTime) : slotTime);
      const zoomDir = i % 2 === 0; // alternate zoom in/out

      const clip = {
        name: `Clip${i + 1}`,
        type: isVideo ? "video" : "image",
        track: 2,
        time: t,
        duration: useDur,
        source: m.url,
        fit: "cover",
      };

      // Letterbox: shrink vertical so black bars from composition fill_color show
      if (tpl.letterbox) {
        clip.x = "50%";
        clip.y = "50%";
        clip.x_anchor = "50%";
        clip.y_anchor = "50%";
        clip.width = "100%";
        clip.height = "62%"; // 2.39:1ish letterbox feel on a 9:16 frame
      }

      clip.animations = [
        fadeIn(0.35),
        kenBurns(useDur, zoomDir),
      ];

      elements.push(clip);
      t += useDur;
    });

    const totalClipsDur = t - 1.6;
    const introDur = 1.6;
    const outroDur = 2.0;
    const totalDuration = +(introDur + totalClipsDur + outroDur).toFixed(2);

    // Intro card: BIG TITLE on line 1, smaller subtitle on line 2
    const introBlockTime = 0;
    elements.push({
      name: "IntroTitle",
      type: "text",
      track: 6,
      time: introBlockTime,
      duration: introDur,
      x: "50%",
      y: "44%",
      x_anchor: "50%",
      y_anchor: "50%",
      width: "84%",
      text: ctx.trip_title.toUpperCase(),
      font_family: tpl.font,
      font_weight: String(tpl.fontWeight),
      font_size: "11 vmin",
      fill_color: "#f3e8cd",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [fadeIn(0.5), fadeOutAt(introDur, 0.4)],
    });
    elements.push({
      name: "IntroSub",
      type: "text",
      track: 6,
      time: introBlockTime,
      duration: introDur,
      x: "50%",
      y: "55%",
      x_anchor: "50%",
      y_anchor: "50%",
      width: "70%",
      text: tpl.titleSub,
      font_family: "IBM Plex Mono",
      font_weight: "500",
      font_size: "3.4 vmin",
      fill_color: "#c9a253",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [fadeIn(0.7), fadeOutAt(introDur, 0.4)],
    });

    // Outro card: Place name, then "a film by [Name]"
    const outroStart = introDur + totalClipsDur;
    elements.push({
      name: "OutroPlace",
      type: "text",
      track: 6,
      time: outroStart,
      duration: outroDur,
      x: "50%",
      y: "46%",
      x_anchor: "50%",
      y_anchor: "50%",
      width: "84%",
      text: ctx.trip_place.toUpperCase(),
      font_family: tpl.font,
      font_weight: String(tpl.fontWeight),
      font_size: "9 vmin",
      fill_color: "#f3e8cd",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [fadeIn(0.6), fadeOutAt(outroDur, 0.5)],
    });
    elements.push({
      name: "OutroBy",
      type: "text",
      track: 6,
      time: outroStart,
      duration: outroDur,
      x: "50%",
      y: "57%",
      x_anchor: "50%",
      y_anchor: "50%",
      width: "70%",
      text: `${tpl.outroPrefix} ${ctx.who}`,
      font_family: "IBM Plex Mono",
      font_weight: "500",
      font_size: "3.2 vmin",
      fill_color: "#c9a253",
      x_alignment: "50%",
      y_alignment: "50%",
      animations: [fadeIn(0.8), fadeOutAt(outroDur, 0.5)],
    });

    return { elements, totalDuration };
  }

  /**
   * @param {Array<{url: string, kind: 'image'|'video', duration?: number}>} media
   * @param {{ trip_title: string, trip_place: string, who: string }} ctx
   */
  function buildReel(media, ctx) {
    if (!media || media.length < 1) throw new Error("No media provided");

    const tpl = pick(TEMPLATES);
    const ordered = shuffle(media).slice(0, 6);

    const { elements, totalDuration } = buildElements(ordered, ctx, tpl);

    const source = {
      output_format: "mp4",
      frame_rate: 30,
      width: W,
      height: H,
      duration: totalDuration,
      fill_color: "#000000",
      brightness: tpl.grade.brightness,
      contrast: tpl.grade.contrast,
      saturation: tpl.grade.saturation,
      elements,
    };

    return {
      source,
      meta: {
        template: tpl.key,
        font: tpl.font,
        letterbox: tpl.letterbox,
      },
    };
  }

  window.ReelTemplate = { buildReel };
})();
