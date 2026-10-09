/**
 * The words for the handover ceremony. Edit the copy here; the screens just render it.
 * Plain strings only, so it is easy to swap in our own wording.
 */
export interface FarewellCtx {
  out: string // outgoing coach
  inn: string // incoming coach
  games: number
  w: number
  d: number
  l: number
  reason: 'season' | 'benched'
  season?: string // name of the season the outgoing coach had, if known
}

export interface WelcomeCtx {
  name: string // incoming coach
  out: string // outgoing coach
  season?: string
  term: string // e.g. "23 Oct to 3 Dec" or "until further notice"
  contractNo: number
}

export const farewell = (c: FarewellCtx) => ({
  kicker: 'Club news',
  headline: `Thank you, ${c.out}`,
  paragraphs:
    c.reason === 'benched'
      ? [
          `${c.out} has stepped down as head coach after three defeats in a row. The board thanks them for their service and for putting their name to the Abantu bench.`,
          c.games > 0 ? `${c.games} games in charge, ${c.w} wins along the way. Every great manager has a rough patch, and the dugout will have a seat waiting when the rotation comes back round.` : `Every great manager has a rough patch, and the dugout will have a seat waiting when the rotation comes back round.`,
          `Please return the clipboard to the kit room.`,
        ]
      : [
          `Everyone at Abantu FC would like to thank ${c.out} for their services as head coach${c.season ? ` during ${c.season}` : ''}.`,
          c.games > 0 ? `${c.games} games in the dugout and ${c.w} wins to remember. The tactics board has never been the same.` : `The tactics board has never been the same.`,
          `The door at the training ground is always open. Heckling privileges from the sofa are now fully activated.`,
        ],
  sign: 'The Abantu board',
})

export const welcome = (c: WelcomeCtx) => ({
  title: 'Coaching contract',
  intro: `This agreement is made between Abantu Football Club ("the Club") and ${c.name} ("the Coach"), who takes over from ${c.out}.`,
  clauses: [
    `The Coach shall have full control of the Abantu squad${c.season ? ` for ${c.season}` : ''}, on Wednesdays and Sundays alike.`,
    `The Coach shall not blame lag, the referee, the controller, or a teammate's internet.`,
    `Three (3) consecutive defeats shall result in immediate dismissal. The board is not sentimental.`,
    `Remuneration shall be paid in bragging rights, due in full on the final whistle.`,
  ],
  term: c.term,
  contractNo: c.contractNo,
  coachLine: 'The Coach',
  clubLine: 'For the Club',
  signCta: 'Sign contract',
  doneCta: "Let's go",
  signedNote: 'Signed and sealed. Welcome to Abantu.',
})
