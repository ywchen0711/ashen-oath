# 灰燼誓約 · Ashen Oath

A story-heavy tactics RPG in the spirit of the GBA Fire Emblem games. It runs in the browser with no build step and no assets: every sprite, portrait, backdrop and piece of music is drawn or synthesized in code.

**Play:** https://ywchen0711.github.io/ashen-oath/

- **31 chapters across five acts.** Prologue, chapters 1–29 and a finale, with talk recruits, villages, choices that change later chapters and the ending, and support conversations.
- **Classes and promotion.** Levels, growth rates, weapon ranks, weapon durability and the weapon triangle (sword > axe > lance, anima > light > dark).
- **Difficulty from the map, not the numbers.** Each chapter has a different shape:
  - goals: rout, seize, defend, escape, escort, arrive;
  - conditions: fog, rain, reinforcements, thieves heading for the chests;
  - units that change sides; NPCs you have to protect.
- **Two modes.** Casual: fallen units return after the battle. Classic: death is permanent.

Controls: mouse, touch or keyboard (arrows/WASD, Z/Enter to confirm, X/Esc to cancel).

Dev: `node tools/test.mjs` (checks the data and runs AI-vs-AI battles); `node tools/balance.mjs` (difficulty curve).
