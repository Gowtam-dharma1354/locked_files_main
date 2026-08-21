/**
 * Common File 15 - Question for ALL batches
 */

export const COMMON_FILE_15 = [
  {
    id: "COMMON_F15_Q01",
    category: "logical_reasoning",
    question: `THE GREAT SAMOSA HEIST

THE INCIDENT
At 2:17 PM, exactly one samosa disappeared from the FinTech & Quant Club refreshment table.

Five suspects were present:
- Professor Calculator
- Captain Chai
- Excel Kumar
- Dr. WiFi
- Sir Pending Assignment

Everyone claims: "I was here for completely legitimate academic purposes."
Unfortunately, the CCTV was under maintenance.

Your team must reconstruct the entire situation and unlock the file.

RULES
Each person occupies exactly one seat, orders exactly one snack, arrives at exactly one listed time, and has exactly one reason. Each listed seat, snack, arrival time, and reason is used exactly once.

SEATS: Window, Door, Projector, AC, Printer
SNACKS: Samosa, Vada Pav, Biscuit, Sandwich, Nothing
ARRIVAL TIMES: 1:40 PM, 1:45 PM, 1:50 PM, 1:55 PM, 2:00 PM
REASONS: Checking attendance, Looking for a charger, Just passing by, Buying coffee, Avoiding the faculty

CLUES
1. Captain Chai arrived exactly 10 minutes before the person sitting at the Printer.
2. The person sitting at the Window arrived at 1:40 PM.
3. Excel Kumar was not sitting at the Door.
4. The person who said Just passing by arrived at 1:50 PM.
5. The person eating Vada Pav was sitting at the Door.
6. Professor Calculator ordered neither Biscuit nor Sandwich.
7. The person who was avoiding the faculty was sitting at the AC.
8. Dr. WiFi arrived later than Excel Kumar but earlier than Sir Pending Assignment.
9. The person sitting at the Projector ordered Biscuit.
10. Captain Chai did not come to buy coffee.
11. Sir Pending Assignment was sitting at the AC.
12. The person looking for a charger arrived exactly 5 minutes after Professor Calculator.
13. Excel Kumar was the person who was Just passing by.
14. The person who ordered Sandwich arrived at 2:00 PM.
15. Dr. WiFi was sitting at the Printer.
16. The person sitting at the Printer came to buy coffee.
17. The person who ordered Nothing arrived at 1:40 PM.
18. Professor Calculator arrived before Captain Chai.
19. Dr. WiFi ordered the Samosa.

FINAL LOCK
The thief is the person who arrived exactly 5 minutes before the person who ordered the Samosa. Identify the thief and derive the five-digit lock code.

CONVERSION TABLES
Arrival: 1:40 PM = 7, 1:45 PM = 3, 1:50 PM = 9, 1:55 PM = 4, 2:00 PM = 6.
Seat: Window = 2, Door = 8, Projector = 5, AC = 1, Printer = 7.
Snack: Samosa = 4, Vada Pav = 9, Biscuit = 3, Sandwich = 6, Nothing = 1.

DIGIT 1: For the thief, calculate (Arrival Number x Seat Number) + (Snack Number x 3). Take the last digit.
DIGIT 2: Take the Arrival Number of the person sitting at the Printer.
DIGIT 3: Take the Snack Number of the person sitting at the Window.
DIGIT 4: Calculate (Dr. WiFi's Arrival Number - Excel Kumar's Arrival Number) x 7. Take the last digit.
DIGIT 5: Calculate (Captain Chai's Seat Number + Professor Calculator's Seat Number) x Sir Pending Assignment's Snack Number. Take the last digit.

Enter the five-digit lock code.`,
    answer: "44150",
    acceptedAnswers: ["44150"]
  }
];
