/* Kotten och klossarna – klot, kub, rätblock, cylinder och kon. Statisk app, inga beroenden.
   Tränar MA.1-3.3.2 (geometriska kroppar och deras egenskaper). Frågan läses upp på
   svenska; barnet pekar på en av tre klossar. Allt ritas i kod: klossarna i SVG, Kotten i
   SVG/DOM, ljud i WebAudio + talsyntes. Uppgiftsgeneratorn är en ren funktion som
   verify.mjs kontrollerar. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. Ren uppgiftsgenerator                                            *
   *    Varje fråga har ett rätt svar och två felklossar som bevisligen    *
   *    inte passar frågan – annars blir uppgiften oavgörbar.             *
   * ------------------------------------------------------------------ */
  var FORMER = {
    klot: { namn: "klotet", text: "Klotet har inga hörn och kan rulla åt alla håll." },
    kub: { namn: "kuben", text: "Kuben har sex lika stora fyrkantiga sidor." },
    ratblock: { namn: "rätblocket", text: "Rätblocket har sex sidor, men alla är inte lika stora." },
    cylinder: { namn: "cylindern", text: "Cylindern har två runda ändar och kan både rulla och stå still." },
    kon: { namn: "konen", text: "Konen har en spets och en rund bas." }
  };

  var FRAGOR = {
    1: [
      { fraga: "Peka på klotet.", ratt: "klot" },
      { fraga: "Peka på kuben.", ratt: "kub" },
      { fraga: "Peka på cylindern.", ratt: "cylinder" },
      { fraga: "Peka på konen.", ratt: "kon" },
      { fraga: "Peka på rätblocket.", ratt: "ratblock" }
    ],
    2: [
      { fraga: "Vilken kloss kan rulla åt alla håll?", ratt: "klot", fel: ["kub", "ratblock"] },
      { fraga: "Vilken kloss har en spets?", ratt: "kon", fel: ["klot", "kub"] },
      { fraga: "Vilken kloss har sex lika stora fyrkantiga sidor?", ratt: "kub", fel: ["ratblock", "cylinder"] },
      { fraga: "Vilken kloss har två runda ändar?", ratt: "cylinder", fel: ["kon", "kub"] },
      { fraga: "Vilken kloss har inga hörn alls?", ratt: "klot", fel: ["kub", "ratblock"] },
      { fraga: "Vilken kloss kan man stapla på varandra?", ratt: "ratblock", fel: ["klot", "kon"] }
    ],
    3: [
      { fraga: "Vilken av klossarna är en kub?", ratt: "kub", fel: ["ratblock", "cylinder"] },
      { fraga: "Vilken av klossarna är en kon?", ratt: "kon", fel: ["cylinder", "klot"] },
      { fraga: "Vilken kloss har sex sidor, men inte alla sidor lika stora?", ratt: "ratblock", fel: ["kub", "cylinder"] },
      { fraga: "Vilken kloss kan både rulla och stå still?", ratt: "cylinder", fel: ["klot", "ratblock"] },
      { fraga: "Vilken kloss har både en spets och en rund bas?", ratt: "kon", fel: ["cylinder", "kub"] }
    ]
  };

  function nyckel() { return Object.keys(FORMER); }
  function heltal(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function blanda(a) {
    var i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function uppgift(niva) {
    var pool = FRAGOR[niva] || FRAGOR[1];
    var q = pool[heltal(0, pool.length - 1)];
    var fel = q.fel ? q.fel.slice(0, 2) : [];
    if (fel.length < 2) {
      /* nivå 1 frågar efter namnet: vilka två andra klossar som helst duger */
      var andra = blanda(nyckel().filter(function (k) { return k !== q.ratt; }));
      fel = andra.slice(0, 2);
    }
    var alt = blanda([q.ratt].concat(fel));
    return {
      fraga: q.fraga,
      ratt: q.ratt,
      text: FORMER[q.ratt].text,
      namn: FORMER[q.ratt].namn,
      alternativ: alt,
      svar: alt.indexOf(q.ratt),
      niva: niva
    };
  }

  /* ------------------------------------------------------------------ *
   * 2. Kotten (egen SVG-figur, fem uttryck – samma som i familjen)       *
   * ------------------------------------------------------------------ */
  function kottenSvg(uttryck, klass) {
    var F = "#b07d4b", M = "#8a5f36", O = "#2b2118", mun, ogen = "", extra = "";
    if (uttryck === "hejar") { mun = '<path d="M22 36 q8 8 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    else if (uttryck === "firar") {
      mun = '<path d="M21 34 q9 12 18 0" fill="#fff"/><path d="M21 34 q9 12 18 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>';
      extra = '<path d="M10 12 l3 6M50 12 l-3 6M30 6 v5" stroke="#e8a33d" stroke-width="2.2" stroke-linecap="round" fill="none"/>';
    }
    else if (uttryck === "tanker") { mun = '<path d="M24 37 h11" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>'; ogen = '<circle cx="46" cy="24" r="4" fill="none" stroke="' + M + '" stroke-width="1.6" opacity=".5"/>'; }
    else if (uttryck === "funderar") { mun = '<path d="M22 38 q8 -6 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    else { mun = '<path d="M22 34 q8 8 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    var oga = '<circle cx="23" cy="24" r="5.2" fill="#fff"/><circle cx="37" cy="24" r="5.2" fill="#fff"/>' +
      '<circle cx="24" cy="24.6" r="2.5" fill="' + O + '"/><circle cx="36" cy="24.6" r="2.5" fill="' + O + '"/>';
    return '<svg class="' + (klass || "kotten-svg") + '" viewBox="0 0 60 60" aria-hidden="true">' + extra +
      '<path d="M30 6 q9 4 12 12 q9 12 4 24 q-4 12 -16 14 q-12 -2 -16 -14 q-5 -12 4 -24 q3 -8 12 -12z" fill="' + F + '"/>' +
      '<path d="M19 20 q11 -5 22 0M16 30 q14 -5 28 0M16 40 q14 -4 28 0" stroke="' + M + '" stroke-width="1.7" fill="none" opacity=".85" stroke-linecap="round"/>' +
      oga + ogen + mun + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * 3. Ljud (WebAudio + talsyntes, skapas vid första gesten)             *
   * ------------------------------------------------------------------ */
  var ac = null, ljudPa = true;
  function ljud(frekvens, längd, typ) {
    if (!ljudPa) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = typ || "sine"; o.frequency.value = frekvens;
      g.gain.value = 0.001; o.connect(g); g.connect(ac.destination);
      var t = ac.currentTime;
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + längd);
      o.start(t); o.stop(t + längd + 0.02);
    } catch (e) { }
  }
  function sag(text) {
    /* Frågan och återkopplingen står också som text, så appen går att spela
       med ljudet avstängt. Talet läses upp samtidigt när ljudet är på. */
    var b = document.getElementById("bubbla");
    if (b) {
      if (text) { b.textContent = text; b.hidden = false; }
      else { b.hidden = true; }
    }
    if (!ljudPa) return;
    try {
      if (!("speechSynthesis" in window) || !text) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "sv-SE"; u.rate = 0.95; u.volume = 0.9;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) { }
  }
  function spar(namn, värde) { try { if (window.skolappar && window.skolappar.event) window.skolappar.event(namn, värde); } catch (e) { } }

  /* ------------------------------------------------------------------ *
   * 4. Klossarna, ritade i kod                                          *
   * ------------------------------------------------------------------ */
  var FÄRG = { ljus: "#3f9a6f", mörk: "#2f7d5a", djup: "#22624a", kant: "#1b4f3b" };

  function skugga(cx, y, r) {
    return '<ellipse cx="' + cx + '" cy="' + y + '" rx="' + r + '" ry="' + (r * 0.18) + '" fill="#14181f" opacity=".10"/>';
  }

  function rätblockRit(cx, cy, w, h, d) {
    var x = cx - w / 2, y = cy - h / 2;
    return '<polygon points="' + (x + d) + ',' + (y - d) + ' ' + (x + w + d) + ',' + (y - d) + ' ' + (x + w + d) + ',' + (y + h - d) + ' ' + (x + w) + ',' + (y + h) + ' ' + (x + w) + ',' + y + '" fill="' + FÄRG.mörk + '"/>' +
      '<polygon points="' + x + ',' + y + ' ' + (x + d) + ',' + (y - d) + ' ' + (x + w + d) + ',' + (y - d) + ' ' + (x + w) + ',' + y + '" fill="' + FÄRG.ljus + '"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + FÄRG.mörk + '"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + FÄRG.kant + '" stroke-width="3"/>' +
      '<polygon points="' + x + ',' + y + ' ' + (x + d) + ',' + (y - d) + ' ' + (x + w + d) + ',' + (y - d) + ' ' + (x + w) + ',' + y + '" fill="none" stroke="' + FÄRG.kant + '" stroke-width="3"/>' +
      '<polyline points="' + (x + w) + ',' + y + ' ' + (x + w + d) + ',' + (y - d) + ' ' + (x + w + d) + ',' + (y + h - d) + ' ' + (x + w) + ',' + (y + h) + '" fill="none" stroke="' + FÄRG.kant + '" stroke-width="3"/>';
  }

  function cylinderRit(cx, cy, r, h) {
    var y1 = cy - h / 2, y2 = cy + h / 2, ry = r * 0.3;
    return '<path d="M' + (cx - r) + ',' + y1 + ' L' + (cx - r) + ',' + y2 + ' A' + r + ',' + ry + ' 0 0 0 ' + (cx + r) + ',' + y2 + ' L' + (cx + r) + ',' + y1 + ' Z" fill="' + FÄRG.mörk + '"/>' +
      '<path d="M' + (cx - r) + ',' + y1 + ' L' + (cx - r) + ',' + y2 + ' A' + r + ',' + ry + ' 0 0 0 ' + (cx + r) + ',' + y2 + ' L' + (cx + r) + ',' + y1 + '" fill="none" stroke="' + FÄRG.kant + '" stroke-width="3"/>' +
      '<ellipse cx="' + cx + '" cy="' + y1 + '" rx="' + r + '" ry="' + ry + '" fill="' + FÄRG.ljus + '" stroke="' + FÄRG.kant + '" stroke-width="3"/>';
  }

  function konRit(cx, cy, r, h) {
    var by = cy + h / 2, ry = r * 0.3, ay = cy - h / 2;
    return '<path d="M' + cx + ',' + ay + ' L' + (cx - r) + ',' + by + ' A' + r + ',' + ry + ' 0 0 0 ' + (cx + r) + ',' + by + ' Z" fill="' + FÄRG.mörk + '" stroke="' + FÄRG.kant + '" stroke-width="3"/>' +
      '<path d="M' + cx + ',' + ay + ' L' + (cx - r * 0.34) + ',' + (by - h * 0.08) + '" stroke="' + FÄRG.ljus + '" stroke-width="7" opacity=".55" stroke-linecap="round" fill="none"/>';
  }

  function klotRit(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + FÄRG.mörk + '" stroke="' + FÄRG.kant + '" stroke-width="3"/>' +
      '<ellipse cx="' + (cx - r * 0.32) + '" cy="' + (cy - r * 0.34) + '" rx="' + (r * 0.3) + '" ry="' + (r * 0.22) + '" fill="' + FÄRG.ljus + '" opacity=".75"/>' +
      '<path d="M' + (cx - r * 0.62) + ',' + (cy + r * 0.52) + ' q' + (r * 0.6) + ',' + (r * 0.3) + ' ' + (r * 1.2) + ',0" fill="none" stroke="' + FÄRG.djup + '" stroke-width="4" opacity=".5" stroke-linecap="round"/>';
  }

  function klossRit(sort, cx, cy, s) {
    var inner = "";
    if (sort === "klot") inner = klotRit(cx, cy - s * 0.06, s * 0.46);
    else if (sort === "kub") inner = rätblockRit(cx - s * 0.08, cy, s * 0.62, s * 0.62, s * 0.2);
    else if (sort === "ratblock") inner = rätblockRit(cx - s * 0.12, cy, s * 0.86, s * 0.5, s * 0.17);
    else if (sort === "cylinder") inner = cylinderRit(cx - s * 0.06, cy, s * 0.26, s * 0.7);
    else if (sort === "kon") inner = konRit(cx - s * 0.04, cy, s * 0.3, s * 0.72);
    return inner;
  }

  /* ------------------------------------------------------------------ *
   * 5. Ritningen av de tre valen                                        *
   * ------------------------------------------------------------------ */
  var RUNDA = 8;
  var S = {
    skärm: "start", niva: 1, runda: 1, item: 0, svarRätt: 0, stjärnor: 0,
    felförsök: 0, p: null, klar: false, visaRätt: false
  };

  /* Två layouter: tre kort på rad (iPad liggande, dator) och tre kort i kolumn
     (telefon och iPad stående). Korten skalas efter SVG:ns egen bredd, så
     telefonen inte får tre kort på 104 px. */
  function layoutFor(el) {
    var r = el.getBoundingClientRect();
    if (r.width && r.height && r.width < r.height * 0.95) {
      return {
        vb: [620, 1190], kort: { w: 560, h: 366, x: 30, ys: [10, 402, 794], xs: [310, 310, 310] },
        formY: 168, formS: 236, namnY: 320, namnStorlek: 40, skuggaY: 292
      };
    }
    return {
      vb: [900, 412], kort: { w: 250, h: 392, x: 35, ys: [8, 8, 8], xs: [160, 450, 740] },
      formY: 176, formS: 232, namnY: 362, namnStorlek: 34, skuggaY: 322
    };
  }

  function ritaScen() {
    var p = S.p, el = document.getElementById("scen");
    if (!p) return;
    var L = layoutFor(el), h = [];
    var xs = L.kort.xs;
    el.setAttribute("viewBox", "0 0 " + L.vb[0] + " " + L.vb[1]);
    h.push('<rect x="0" y="0" width="' + L.vb[0] + '" height="' + L.vb[1] + '" fill="var(--papper)"/>');
    p.alternativ.forEach(function (sort, i) {
      var c = xs[i], ky = L.kort.ys[i];
      var rättNu = S.klar && S.visaRätt && i === p.svar;
      h.push('<g class="kloss-g' + (rättNu ? " ratt" : "") + '" data-i="' + i + '" role="button" tabindex="0" aria-label="kloss ' + (i + 1) + '">');
      h.push('<rect class="kloss-kort" x="' + (c - L.kort.w / 2) + '" y="' + ky + '" width="' + L.kort.w + '" height="' + L.kort.h + '" rx="26" fill="#fff" stroke="var(--linje)" stroke-width="3"/>');
      h.push(skugga(c - 6, ky + L.skuggaY, L.kort.w * 0.36));
      h.push(klossRit(sort, c, ky + L.formY, L.formS));
      h.push('<text class="kloss-namn" x="' + c + '" y="' + (ky + L.namnY) + '" text-anchor="middle" font-size="' + L.namnStorlek + '" font-weight="800" fill="var(--accent-mörk)">' +
        (S.klar && S.visaRätt ? FORMER[sort].namn : "") + '</text>');
      if (rättNu) {
        h.push('<rect class="ratt-ring" x="' + (c - L.kort.w / 2 - 8) + '" y="' + (ky - 8) + '" width="' + (L.kort.w + 16) + '" height="' + (L.kort.h + 16) + '" rx="32" fill="none" stroke="var(--stjärna)" stroke-width="7"/>');
      }
      h.push('</g>');
    });
    el.innerHTML = h.join("");
  }

  function ritaPrickar() {
    var h = "", i;
    for (i = 0; i < RUNDA; i++) h += '<i class="' + (i < S.item ? "klar" : "") + '"></i>';
    document.getElementById("prickar").innerHTML = h;
  }
  function ritaStjärnor() {
    document.getElementById("stjarnor").textContent = "★".repeat(Math.min(S.stjärnor, 12)) + (S.stjärnor > 12 ? "+" : "");
  }
  function kottenByt(uttryck) {
    var el = document.getElementById("kotten");
    if (el) el.innerHTML = kottenSvg(uttryck, "kotten-svg");
  }

  /* ------------------------------------------------------------------ *
   * 6. Spelflöde                                                       *
   * ------------------------------------------------------------------ */
  var idleTimer = null;
  function startIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (S.skärm === "spel" && !S.klar && S.felförsök === 0) {
        sag("Lyssna igen: " + S.p.fraga);
        spar("hint");
      }
    }, 12000);
  }

  function nyUppgift() {
    S.p = uppgift(S.niva);
    S.klar = false; S.felförsök = 0; S.visaRätt = false;
    ritaScen(); ritaPrickar();
    sag(S.p.fraga);
    startIdle();
  }

  function valj(i) {
    if (S.skärm !== "spel" || S.klar) return;
    clearTimeout(idleTimer);
    var p = S.p;
    var g = document.querySelector('.kloss-g[data-i="' + i + '"]');
    if (i === p.svar) {
      S.klar = true; S.visaRätt = true; S.item++; S.svarRätt++; S.stjärnor++;
      ritaScen(); ritaPrickar(); ritaStjärnor();
      ljud(520, 0.12, "square");
      setTimeout(function () { ljud(780, 0.14, "sine"); }, 130);
      setTimeout(function () { ljud(1040, 0.18, "sine"); }, 260);
      sag("Rätt! Det är " + p.namn + ". " + p.text);
      kottenByt("firar");
      setTimeout(function () {
        kottenByt("glad");
        if (S.item >= RUNDA) rundaKlar(); else nyUppgift();
      }, 2200);
    } else {
      S.felförsök++;
      if (g) { g.classList.add("fel"); setTimeout(function () { g.classList.remove("fel"); }, 520); }
      ljud(220, 0.16, "triangle");
      setTimeout(function () { ljud(170, 0.18, "triangle"); }, 150);
      kottenByt("funderar");
      sag("Titta noga. " + p.fraga);
      spar("hint");
      /* tre val = två felklossar: efter båda visas rätt kloss, barnet går vidare */
      if (S.felförsök >= 2) {
        S.visaRätt = true; S.klar = true;
        ritaScen();
        sag("Den som lyser är " + p.namn + ". " + p.text);
        kottenByt("tanker");
        setTimeout(function () {
          S.item++;
          kottenByt("glad");
          if (S.item >= RUNDA) rundaKlar(); else nyUppgift();
        }, 2600);
      } else {
        startIdle();
      }
    }
  }

  function rundaKlar() {
    S.skärm = "överlägg";
    var procent = Math.round(100 * S.svarRätt / RUNDA);
    spar("round_done", procent);
    sag("Rundan är klar. " + S.svarRätt + " av " + RUNDA + " rätt.");
    var stegUpp = S.svarRätt >= 6 && S.niva < 3;
    visaOverlay(S.svarRätt >= 6 ? "firar" : "hejar", "Rundan är klar!",
      S.svarRätt + " av " + RUNDA + " rätt. " + S.stjärnor + " stjärnor totalt." +
      (stegUpp ? " Nu blir det svårare!" : ""),
      "En runda till →", function () {
        if (stegUpp) { S.niva++; spar("level", S.niva); }
        S.runda++; startaRunda(S.niva);
      }, true);
  }

  function visaOverlay(uttryck, titel, text, knapptext, vidare, medNiva) {
    var ov = document.getElementById("overlay");
    document.getElementById("ov-bild").innerHTML = kottenSvg(uttryck, "ov-kotten");
    document.getElementById("ov-titel").textContent = titel;
    document.getElementById("ov-text").textContent = text;
    var b = document.getElementById("ov-nasta");
    b.textContent = knapptext;
    b.onclick = function () { ov.hidden = true; vidare(); };
    var n = document.getElementById("ov-niva");
    n.hidden = !medNiva;
    n.onclick = function () { ov.hidden = true; S.niva = S.niva >= 3 ? 1 : S.niva + 1; S.runda++; startaRunda(S.niva); };
    ov.hidden = false;
  }

  function startaRunda(niva) {
    S.niva = niva; S.skärm = "spel"; S.item = 0; S.svarRätt = 0; S.felförsök = 0;
    document.getElementById("startskarm").hidden = true;
    document.getElementById("spel").hidden = false;
    document.getElementById("overlay").hidden = true;
    ritaStjärnor(); kottenByt("glad");
    spar("round_start"); spar("level", niva);
    var intro = niva === 2 ? "Nu frågar jag vad klossarna kan. Lyssna noga."
      : niva === 3 ? "Nu är klossarna svåra att skilja. Lyssna noga." : "";
    if (intro) {
      /* Säg intro, men låt frågan stå kvar i bubblan efteråt. */
      setTimeout(function () {
        sag(intro);
        setTimeout(function () { if (!S.klar) sag(S.p.fraga); }, 2600);
      }, 700);
    }
    nyUppgift();
  }

  function tipsa() {
    if (S.skärm !== "spel" || S.klar) return;
    sag(S.p.fraga);
    spar("hint");
    kottenByt("tanker");
    setTimeout(function () { if (!S.klar) kottenByt("glad"); }, 1600);
  }

  /* ------------------------------------------------------------------ *
   * 7. Händelser och start                                             *
   * ------------------------------------------------------------------ */
  function ritaLjudIkon() {
    document.getElementById("ljudikon").innerHTML = ljudPa
      ? '<path d="M4 9h3l4-3v12l-4-3H4z"/><path d="M15 8a5 5 0 0 1 0 8"/>'
      : '<path d="M4 9h3l4-3v12l-4-3H4z"/><path d="M15 9l5 6M20 9l-5 6"/>';
  }

  function bind() {
    /* pointerdown i stället för click: svarar direkt på touch utan att vänta på
       ett click som Safari ibland lägger efter en fördröjning. Tangentbordet har
       egen väg (1/2/3), så inget dubbeltryck kan uppstå. */
    document.getElementById("scen").addEventListener("pointerdown", function (e) {
      var g = e.target.closest(".kloss-g");
      if (g) { e.preventDefault(); valj(Number(g.dataset.i)); }
    });
    document.getElementById("spela").addEventListener("click", function () { ljud(600, 0.1); startaRunda(1); });
    document.getElementById("hjalp").addEventListener("click", tipsa);
    document.getElementById("ljud").addEventListener("click", function () {
      ljudPa = !ljudPa;
      if (!ljudPa && "speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch (e) { } }
      ritaLjudIkon(); spar("sound_off");
    });
    document.addEventListener("keydown", function (e) {
      if (S.skärm !== "spel") return;
      if (e.key === "1" || e.key === "ArrowLeft") valj(0);
      if (e.key === "2" || e.key === "ArrowDown") valj(1);
      if (e.key === "3" || e.key === "ArrowRight") valj(2);
      if (e.key === "h" || e.key === "?") tipsa();
    });
    window.addEventListener("resize", function () { if (S.p) ritaScen(); });
  }

  function init() {
    bind(); ritaLjudIkon(); ritaStjärnor(); ritaPrickar();
    document.getElementById("kotten-hud").innerHTML = kottenSvg("glad", "kotten-hud");
    kottenByt("glad");
    window.__game = {
      S: S, uppgift: uppgift, FORMER: FORMER, FRAGOR: FRAGOR, valj: valj,
      startaRunda: startaRunda, nyUppgift: nyUppgift, tipsa: tipsa, ritaScen: ritaScen
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();