# Thinking doc (draft — 1 page, paste into Google Doc)

**Live CRM for two accounts — Vivek (Questathon ID CSM-0257)**

## What it does, and for whom

A one-screen CRM my manager opens on Monday morning. For each of my two
accounts (A: Eastern Counties, B: Aldermoor) it answers five questions: what
the book is worth, who holds the power, what to do first, what is about to go
wrong, and what we still don't know. It is written for a manager with ten
minutes: answers first, evidence one click away. This morning's review
valued account A's book at **$854,509** — $105,000 closed (priority support
$60k + operator training $45k) plus per-deal values shown separately:
$132,816 renewal, $65,193 Tarn, $551,500 tender, $0 Westmere (bid window
passed). Each deal carries only its own number; the one sum shown is the
morning-review one, deal by deal, never a champion total.

## How it decides: the rules

1. **No number without a source id.** Every value renders with the record id
   behind it. If the data cannot back a number, it is shown as an unbacked
   estimate, visibly apart — never summed into the total. (This rule came out
   of the morning: both Hannah and Ewan rejected work where a claim had no
   data behind it.)
2. **No invented ids, facts or people.** If a name or a date is not in the
   records, it is listed under "what I don't know" with who could fill it —
   not guessed.
3. **First moves are ranked, owned and dated inside every deadline.** A move
   without an owner or a date is not a move; it is a wish.
4. **Fresh beats pretty.** The dashboard polls get_signals and writes what it
   notices back with write_note, so what arrived today is on the screen, not
   in my head.

## What it does not do yet

- It does not forecast revenue beyond what the records support.
- Customer replies are pre-drafted with an owner and a date (the draft-writer
  pattern — the game's own benchmark says a reply the tool drafts gets chosen
  about 85% of the time) — but every fact still unverified is left as an
  explicit [TODO] in the draft; the human confirms before anything is sent.
- It does not merge the two accounts into one blended total, on purpose:
  blending hides which deal is at risk.
- It does not yet catch silent churn like Aldermoor's three stopped docks on
  its own — it surfaces the signal once get_signals reports it.

## How you used AI

AI was the co-pilot through the whole day: in the morning it decoded rejection
patterns into rules (build from the approver's own spec; evidence must be
checkable data, not my own notes), and in the build phase it scaffolded the
Next.js app, the rate-limited MCP client and the store-first data flow. Every
rule on this page traces to a moment in the day where the opposite choice
cost a deal.
