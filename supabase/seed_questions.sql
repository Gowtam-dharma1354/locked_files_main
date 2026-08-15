-- Seed the 22 approved questions into public.questions
INSERT INTO public.questions (id, category, question_text, canonical_answer, accepted_answers)
VALUES
('Q01','Finance','Find the next number: 2, 6, 12, 20, 30, ?','42','[]'::jsonb),
('Q02','Finance','Three traders — A, B and C — each trade a different asset: Equity, Bonds and Gold. • A does not trade Gold. • B does not trade Equity. • C trades Gold. What does A trade?','EQUITY','[]'::jsonb),
('Q03','Finance','Exactly one statement below is false: 1. NIFTY 50 is an Indian equity index. 2. An equity share represents ownership in a company. 3. A bond represents a debt obligation of the issuer. 4. Buying a stock guarantees that an investor will make a profit. Which statement is false?','4','[]'::jsonb),
('Q04','Finance','Four analysts — A, B, C and D — achieved different scores. • A scored higher than B. • C scored lower than D. • B scored higher than D. Who scored second highest?','B','[]'::jsonb),
('Q05','Finance','A company issues 10 million new shares to the public. Is this: A. Offer for Sale B. Fresh Issue','FRESH','["FRESH ISSUE"]'::jsonb),
('Q06','Finance','You buy a stock for ₹100 and sell it for ₹120. Ignoring dividends, what is your percentage return?','20','[]'::jsonb),
('Q07','Finance','A company has: • 10 million shares outstanding • Current share price = ₹250 What is its market capitalization? Give the answer in ₹ million.','2500','["2,500"]'::jsonb),
('Q08','Finance','The sell side of an order book is: Seller | Quantity | Price A | 100 | ₹102 B | 200 | ₹101 C | 150 | ₹103 A market buy order for 250 shares arrives. At what average price will the 250 shares be purchased?','101.2','["101.20"]'::jsonb),
('Q09','Finance','An investor owns 10 shares priced at ₹800 each. The company announces a 2-for-1 stock split. Ignoring market movements, how many shares will the investor own immediately after the split?','20','[]'::jsonb),
('Q10','Finance','Find the next number: 3, 9, 27, 81, ?','243','[]'::jsonb),
('Q11','Finance','Which one does not belong? NIFTY — SENSEX — BANKNIFTY — NASDAQ','NASDAQ','[]'::jsonb),
('Q12','Finance','Complete the pattern: 4 → 16 5 → 25 7 → 49 9 → ?','81','[]'::jsonb),
('Q13','Finance','Find the stock-market ticker hidden in the following word: NSE Securities','NSE','[]'::jsonb),
('Q14','Finance','Complete the pattern: 2 | 4 | 8 3 | 6 | 12 5 | 10 | ?','20','[]'::jsonb),
('Q15','Finance','A stock moves from ₹150 to ₹180. What is the percentage return?','20','[]'::jsonb),
('Q16','Finance','An investor has: • 60% invested in Stock A, which returns 10%. • 40% invested in Stock B, which returns 20%. What is the portfolio return?','14','[]'::jsonb),
('Q17','Finance','A fair six-sided die is rolled once. What is the probability of getting a number greater than 4?','1/3','["1/3"]'::jsonb),
('Q18','Finance','A stock's closing prices over five days are: ₹100, ₹110, ₹120, ₹130, ₹140 What is the 5-day simple moving average?','120','[]'::jsonb),
('Q19','Finance','Two stocks have the following daily returns: Stock A: +2%, +2%, +2%, +2% Stock B: -2%, +2%, -2%, +2% Which stock has higher volatility?','B','[]'::jsonb),
('Q20','Finance','A company has 100 shares outstanding. • Promoters own 20. • Employees own 10. • The remaining shares are publicly held. What percentage of shares are publicly held?','70','[]'::jsonb),
('Q21','Finance','A stock moves: ₹100 → ₹110 → ₹99 What is the overall percentage return from the beginning to the end? Do not add the intermediate percentage changes.','-1','[]'::jsonb),
('Q22','Finance','Which NSE trading symbol corresponds to: HDFC Bank Limited','HDFCBANK','[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
