// All the chapters, in order: the prologue and thirty chapters in five acts.
import act1 from './act1.js';
import act2 from './act2.js';
import act3 from './act3.js';
import act4 from './act4.js';
import act5 from './act5.js';
export const CHAPTERS = [...act1, ...act2, ...act3, ...act4, ...act5];
// the enemy grows with you: from the middle of the story on, every nameless soldier is a few levels stronger
// (the maps were drawn with the levels of the first half in mind)
const CURVE = { 13: 1, 14: 2, 15: 2, 16: 3, 17: 3, 18: 4, 19: 4, 20: 5, 21: 5, 22: 5, 23: 6, 24: 6, 25: 7, 26: 7, 27: 7, 28: 8, 29: 8, 30: 8 };
CHAPTERS.forEach((ch, i) => { if (ch.boost == null) ch.boost = CURVE[i] || 0; });
