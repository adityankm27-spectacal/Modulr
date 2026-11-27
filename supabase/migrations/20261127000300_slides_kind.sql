-- Slides: uploaded decks (PowerPoint, PDF or Word) on their own module tab.
-- (Separate migration: a new enum value can't be used in the transaction that adds it.)
alter type public.document_kind add value if not exists 'slides';
