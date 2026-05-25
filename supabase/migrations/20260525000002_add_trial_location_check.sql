ALTER TABLE trials ADD CONSTRAINT trials_location_check CHECK (location IN ('Wishfield', 'Itzaland'));
