-- No module is free by default any more (decision of 14 Nov 2026). The per-module
-- is_free_preview switch stays available to admins; it just starts switched off.
update public.app_settings
   set value = '[]'
 where key = 'free_preview.default_module_numbers';

update public.modules
   set is_free_preview = false
 where is_free_preview;
