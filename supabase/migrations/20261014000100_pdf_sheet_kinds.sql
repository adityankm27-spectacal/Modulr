-- PDF question sheets: one optional PDF per module for each question tab.
-- (Separate migration: new enum values can't be used in the transaction that adds them.)
alter type public.document_kind add value if not exists 'pyq_sheet';
alter type public.document_kind add value if not exists 'important_sheet';
alter type public.document_kind add value if not exists 'viva_sheet';
