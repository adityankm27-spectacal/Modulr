-- Code PDF: one optional PDF per module on the Code tab (e.g. a lab manual with all of the
-- module's programs), shown above the program list in the view-only PDF viewer.
-- (Separate migration: new enum values can't be used in the transaction that adds them.)
alter type public.document_kind add value if not exists 'code_sheet';
