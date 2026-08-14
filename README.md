# Locked Files — Interactive Prototype

## What this version does

- 25-question bank
- 5 categories
- Each challenge selects exactly 1 question from each category
- Participant sees only the questions
- Participant derives a 5-letter key from the first letter of each answer
- Two key attempts per challenge set
- After 2 wrong attempts, a new 5-question set is generated
- Correct key unlocks the success screen
- Responsive dark classified-files UI

## Run

Install Node.js first.

Then:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Important

This is a frontend prototype. The correct answers are present in the browser JavaScript so that the prototype can validate keys locally. For the real event, move question/answer validation to a backend so participants cannot inspect the answer bank and keys.

## Next build steps

1. Add the real question bank.
2. Add Level 2–5.
3. Add video unlock.
4. Add registration.
5. Move validation and progress tracking to a backend.
6. Add admin dashboard and event controls.