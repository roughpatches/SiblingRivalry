// Sibling-to-sibling exchanges. Edit freely: this is the place for family bits.
//
//   id     unique name (used so an exchange doesn't repeat within a run)
//   when   where it can play: 'rest' (rest stops), 'battle' (start of a fight),
//          'victory' (the win screen)
//   theme  optional floor theme ('basement', 'office', 'snow', 'dining'): only
//          plays on that floor, and is preferred there
//   lines  [sibling id, what they say], in order. Everyone in the exchange has
//          to be standing for it to play.
import { rng } from '../systems/rng.js';
import { HERO_BY_ID } from './heroes.js';

export const BANTER = [
  // ------------------------------------------------------------ rest stops
  {
    id: 'fastest-skier', when: ['rest'], theme: 'snow',
    lines: [
      ['tom', 'For the record, I was fastest down that last run.'],
      ['chachi', 'For the record, you were second. Behind me. By a lot.'],
      ['andrew', 'I would like it noted that nobody timed it.'],
      ['tom', 'Then I would like to see the data.'],
    ],
  },
  {
    id: 'hawaii', when: ['rest'], theme: 'snow',
    lines: [
      ['andrew', 'Is it snowing? Carolyn, quick, is this Hawaii?'],
      ['chachi', 'Mauna Kea gets snow. I have been vindicated by geology.'],
      ['andrew', 'Nobody in this family is ever letting that go.'],
    ],
  },
  {
    id: 'best-ski-house', when: ['rest'], theme: 'snow',
    lines: [
      ['andrew', "Best ski house: Queen Anne's Way, Trail View or Overlook Drive?"],
      ['stephen', 'Overlook. Historically the strongest.'],
      ['tom', 'Trail View. The mudroom alone.'],
      ['chachi', 'Whichever one I got the top bunk in.'],
    ],
  },
  {
    id: 'hosting', when: ['rest'], theme: 'dining',
    lines: [
      ['tom', 'Who is hosting Thanksgiving this year?'],
      ['stephen', 'Not it.'],
      ['andrew', 'Not it.'],
      ['chachi', 'Not it.'],
    ],
  },
  {
    id: 'calling-mom', when: ['rest'], theme: 'dining',
    lines: [
      ['tom', "Hang on, I'm calling Mom."],
      ['chachi', "Tom. We're in a dungeon."],
      ['tom', "She'll want to know. MOM? ...Voicemail. MOOOM."],
    ],
  },
  {
    id: 'billable', when: ['rest'], theme: 'office',
    lines: [
      ['tom', "Andrew, what's our legal exposure if I kick in that door?"],
      ['andrew', "That's a billable question. I'll need a retainer."],
      ['tom', 'I can pay you in synergy.'],
      ['andrew', 'Then the answer is "it depends."'],
    ],
  },
  {
    id: 'sloan', when: ['rest'], theme: 'office',
    lines: [
      ['tom', 'Stephen, back me up. Sloan taught us to build the framework first.'],
      ['stephen', 'Sloan taught me to leave before the second slide.'],
    ],
  },
  {
    id: 'mt-kisco', when: ['rest'], theme: 'basement',
    lines: [
      ['chachi', 'Tom, how old were you when we left Mt. Kisco?'],
      ['tom', 'Ten. I remember everything.'],
      ['chachi', 'I was two.'],
      ['tom', 'Then you will have to trust my version.'],
    ],
  },
  {
    id: 'jays-due', when: ['rest'],
    lines: [
      ['stephen', 'The Blue Jays are due.'],
      ['tom', 'They have been due since 1993.'],
      ['stephen', 'Exactly. Very due.'],
    ],
  },
  {
    id: 'rustling', when: ['rest'],
    lines: [
      ['stephen', 'Tom. The trees are rustling.'],
      ['tom', 'I am aware. I am choosing to remain calm.'],
      ['stephen', 'Just checking. Last time you sprinted the whole sidewalk.'],
    ],
  },
  {
    id: 'charlie-photo', when: ['rest'],
    lines: [
      ['andrew', 'Want to see a picture of Charlie?'],
      ['tom', 'You showed me four at the last rest stop.'],
      ['andrew', "This one's different. Charlie is looking left."],
    ],
  },
  {
    id: 'rent-seeking', when: ['rest'],
    lines: [
      ['stephen', 'This dungeon is really a case study in rent-seeking.'],
      ['andrew', 'Is that a legal term or the start of a lecture?'],
      ['stephen', 'Yes.'],
    ],
  },
  {
    id: 'potion-cut', when: ['rest'],
    lines: [
      ['chachi', 'Stephen, do you get a cut of every potion we drink?'],
      ['stephen', 'I get a spreadsheet of every potion you drink.'],
      ['chachi', 'That somehow sounds worse.'],
    ],
  },
  {
    id: 'toronto', when: ['rest'],
    lines: [
      ['chachi', 'Remember Toronto? Everyone was so nice.'],
      ['stephen', 'Sorry, yes. Sorry.'],
      ['andrew', 'He did it again.'],
    ],
  },
  {
    id: 'lego-bowl', when: ['rest'],
    lines: [
      ['andrew', 'I carved a bowl in the time it took you to build that LEGO set.'],
      ['tom', 'My set has 7,541 pieces.'],
      ['andrew', 'My bowl has one. And it holds soup.'],
    ],
  },
  {
    id: 'hopkinton', when: ['rest'],
    lines: [
      ['andrew', 'Did we really live at the start line of the Boston Marathon?'],
      ['chachi', "Hopkinton. I've been in training since I was two."],
      ['andrew', "You've been napping since you were two."],
    ],
  },
  {
    id: 'have-you-met', when: ['rest'],
    lines: [
      ['chachi', 'Tom. Tom. Have you met... this rest stop?'],
      ['tom', 'Please stop doing the bits.'],
      ['chachi', 'Challenge accepted.'],
    ],
  },

  // ------------------------------------------------------------ start of a fight
  {
    id: 'plan', when: ['battle'],
    lines: [
      ['tom', "Let's align on a plan."],
      ['chachi', 'Plan: run at them.'],
    ],
  },
  {
    id: 'ambush', when: ['battle'],
    lines: [
      ['andrew', 'I object to this ambush.'],
      ['tom', 'Noted. Now hit it with the mallet.'],
    ],
  },
  {
    id: 'waterloo', when: ['battle'],
    lines: [
      ['stephen', 'This is a lot like Waterloo.'],
      ['andrew', 'Which side are we?'],
      ['stephen', 'Unclear.'],
    ],
  },
  {
    id: 'is-that-a-bat', when: ['battle'],
    lines: [
      ['tom', 'Is that a bat?'],
      ['stephen', 'Tom.'],
      ['tom', 'IT COULD BE A BAT.'],
    ],
  },
  {
    id: 'suit-up', when: ['battle'],
    lines: [
      ['chachi', 'Suit up!'],
      ['stephen', "I'm wearing a baseball cap. This is my suit."],
    ],
  },

  // ------------------------------------------------------------ the win screen
  {
    id: 'retro', when: ['victory'],
    lines: [
      ['tom', 'Clean win. Quick retro?'],
      ['andrew', 'Motion to skip the retro.'],
      ['chachi', 'Seconded.'],
    ],
  },
  {
    id: 'most-hits', when: ['victory'],
    lines: [
      ['chachi', 'Who got the most hits?'],
      ['tom', "I'm compiling the numbers."],
      ['chachi', 'So, me.'],
    ],
  },
  {
    id: 'quiet-five', when: ['victory'],
    lines: [
      ['chachi', 'High five, Stephen!'],
      ['stephen', '...Okay. Quietly.'],
    ],
  },
  {
    id: 'so-ordered', when: ['victory'],
    lines: [
      ['andrew', 'So ordered.'],
      ['stephen', "You don't get to say that here."],
      ['andrew', "I'm saying it anyway."],
    ],
  },
];

// Picks an exchange for this moment, or null if none fits. Floor-specific
// exchanges are preferred on their floor; nothing repeats within a run.
export function pickBanter(when, opts) {
  const lines = pickBanterLines(when, opts);
  return lines && lines.map(({ id, text }) => `${HERO_BY_ID[id].name}: "${text}"`);
}

// The same, as [{id, text}] so each line can be put in the speaker's mouth.
export function pickBanterLines(when, { standing, theme, seen }) {
  const fits = BANTER.filter((b) => b.when.includes(when)
    && (!b.theme || b.theme === theme)
    && !seen.includes(b.id)
    && b.lines.every(([id]) => standing.includes(id)));
  if (!fits.length) return null;
  const themed = fits.filter((b) => b.theme);
  const b = themed.length && rng() < 0.7 ? rng.pick(themed) : rng.pick(fits);
  seen.push(b.id);
  return b.lines.map(([id, text]) => ({ id, text }));
}
