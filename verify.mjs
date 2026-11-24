// Kontrollerar uppgiftsgeneratorn i public/app.js:
//  – varje uppgift har tre olika klossar och svar pekar på rätt kloss,
//  – rätt kloss uppfyller frågans egenskap och de två felklossarna gör det inte,
//  – nivå 2 och 3 har egenskapsfrågor (inte bara namn), nivå 1 bara namn,
//  – alla frågor i poolen går att svara på (rätt svar finns, två fel finns).
//   node verify.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./public/app.js", import.meta.url), "utf8");
const start = src.indexOf("var FORMER = {");
const end = src.indexOf("* 2. Kotten");
if (start < 0 || end < 0) throw new Error("hittar inte den rena generatorn i app.js");
const ren = src.slice(start, src.lastIndexOf("/*", end));
const G = eval("(function(){" + ren + "\nreturn {uppgift:uppgift, FORMER:FORMER, FRAGOR:FRAGOR};})()");

let seed = 20261124;
Math.random = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

// Egenskaper som frågorna bygger på – facit för kontrollen, inte för appen.
const KAN_RULLA_ÖVERALLT = ["klot"];
const HAR_SPETS = ["kon"];
const SEX_LIKA = ["kub"];
const TVÅ_RUNDA_ÄNDAR = ["cylinder"];
const INGA_HÖRN = ["klot"];
const KAN_STAPLAS = ["ratblock", "kub"];
const SIDOR_EJ_LIKA = ["ratblock"];
const RULLA_OCH_STÅ = ["cylinder"];
const SPETS_OCH_RUND = ["kon"];
const ÄR_KUB = ["kub"];
const ÄR_KON = ["kon"];

const EGENSKAP = {
  "Vilken kloss kan rulla åt alla håll?": KAN_RULLA_ÖVERALLT,
  "Vilken kloss har en spets?": HAR_SPETS,
  "Vilken kloss har sex lika stora fyrkantiga sidor?": SEX_LIKA,
  "Vilken kloss har två runda ändar?": TVÅ_RUNDA_ÄNDAR,
  "Vilken kloss har inga hörn alls?": INGA_HÖRN,
  "Vilken kloss kan man stapla på varandra?": KAN_STAPLAS,
  "Vilken av klossarna är en kub?": ÄR_KUB,
  "Vilken av klossarna är en kon?": ÄR_KON,
  "Vilken kloss har sex sidor, men inte alla sidor lika stora?": SIDOR_EJ_LIKA,
  "Vilken kloss kan både rulla och stå still?": RULLA_OCH_STÅ,
  "Vilken kloss har både en spets och en rund bas?": SPETS_OCH_RUND
};

let fel = 0;
const kolla = (c, m, p) => { if (!c) { fel++; if (fel <= 25) console.log("FEL", m, JSON.stringify(p)); } };
const antal = { 1: 0, 2: 0, 3: 0 };
const sedda = { 1: new Set(), 2: new Set(), 3: new Set() };

for (const niva of [1, 2, 3]) {
  const pool = G.FRAGOR[niva];
  kolla(Array.isArray(pool) && pool.length >= 5, "för få frågor på nivå " + niva);
  for (const q of pool) {
    kolla(!!G.FORMER[q.ratt], "okänd rätt kloss", q);
    if (niva === 1) kolla(!q.fel, "nivå 1 ska inte ha fasta felklossar", q);
    else {
      kolla(Array.isArray(q.fel) && q.fel.length === 2, "nivå " + niva + " behöver två felklossar", q);
      kolla(q.fel.every(f => !!G.FORMER[f] && f !== q.ratt), "felkloss saknas eller är rätt svar", q);
      kolla(q.fel[0] !== q.fel[1], "samma felkloss två gånger", q);
      const eg = EGENSKAP[q.fraga];
      kolla(!!eg, "frågan saknar kontrollbar egenskap: " + q.fraga, q);
      if (eg) {
        kolla(eg.indexOf(q.ratt) >= 0, "rätt svar uppfyller inte egenskapen", q);
        for (const f of q.fel) kolla(eg.indexOf(f) < 0, "felkloss uppfyller egenskapen: " + f, q);
      }
    }
  }
}

for (let k = 0; k < 30000; k++) {
  for (const niva of [1, 2, 3]) {
    const p = G.uppgift(niva);
    antal[niva]++;
    sedda[niva].add(p.fraga);
    kolla(Array.isArray(p.alternativ) && p.alternativ.length === 3, "fel antal klossar", p);
    kolla(new Set(p.alternativ).size === 3, "samma kloss två gånger", p);
    kolla(p.alternativ.every(a => !!G.FORMER[a]), "okänd kloss bland valen", p);
    kolla(p.svar >= 0 && p.svar <= 2, "svar utanför 0–2", p);
    kolla(p.alternativ[p.svar] === p.ratt, "svar pekar inte på rätt kloss", p);
    kolla(typeof p.fraga === "string" && p.fraga.length > 5, "tom fråga", p);
    kolla(typeof p.text === "string" && p.text.length > 10, "saknar förklaring", p);
    kolla(p.niva === niva, "fel nivå på uppgiften", p.niva);
    if (niva > 1) {
      const eg = EGENSKAP[p.fraga];
      if (eg) {
        kolla(eg.indexOf(p.ratt) >= 0, "rätt svar bryter mot egenskapen", p);
        for (const a of p.alternativ) if (a !== p.ratt) kolla(eg.indexOf(a) < 0, "felkloss passar frågan: " + a, p);
      }
    }
    if (niva === 1) kolla(!EGENSKAP[p.fraga], "nivå 1 ska bara fråga efter namn", p);
  }
}

for (const niva of [1, 2, 3]) {
  kolla(sedda[niva].size === G.FRAGOR[niva].length, "inte alla frågor på nivå " + niva + " används: " + sedda[niva].size);
}

console.log("nivå 1:", antal[1], "uppgifter,", sedda[1].size, "frågor");
console.log("nivå 2:", antal[2], "uppgifter,", sedda[2].size, "frågor");
console.log("nivå 3:", antal[3], "uppgifter,", sedda[3].size, "frågor");
console.log(fel === 0 ? "OK – 0 fel" : fel + " FEL");
process.exit(fel === 0 ? 0 : 1);