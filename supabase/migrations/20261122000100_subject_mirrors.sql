-- Mirror one subject's content into another subject. First use: Information
-- Technology's FM is the source and Computer Engineering's FM the target, so
-- whatever is added or changed in the IT FM modules also appears in CS FM.
--
-- How it works
--   * subject_mirrors says "source subject -> target subject".
--   * A row in a target subject carries mirror_of = the source row it copies.
--   * AFTER INSERT/UPDATE triggers on the source rows copy changes to the mirror.
--     Deleting a source row deletes its mirror (ON DELETE CASCADE).
--   * Mirrors share the source's files (Bunny video id, notes PDF path) instead of
--     duplicating them, so the "one row per file" unique indexes now apply to
--     original rows only (mirror_of is null).
--   * A failing mirror never blocks saving the source: errors become warnings.
--   * Edit the source (IT) side. Changes made directly on a mirror row are
--     overwritten the next time its source row changes.

create table public.subject_mirrors (
  source_subject_id uuid primary key references public.subjects (id) on delete cascade,
  target_subject_id uuid not null unique references public.subjects (id) on delete cascade,
  check (source_subject_id <> target_subject_id)
);
alter table public.subject_mirrors enable row level security;
create policy subject_mirrors_admin_read on public.subject_mirrors
  for select to authenticated using ((select public.is_admin()));

alter table public.modules       add column mirror_of uuid references public.modules (id) on delete cascade;
alter table public.documents     add column mirror_of uuid references public.documents (id) on delete cascade;
alter table public.videos        add column mirror_of uuid references public.videos (id) on delete cascade;
alter table public.formula_cards add column mirror_of uuid references public.formula_cards (id) on delete cascade;
alter table public.questions     add column mirror_of uuid references public.questions (id) on delete cascade;
alter table public.topics        add column mirror_of uuid references public.topics (id) on delete cascade;

create index modules_mirror_of_idx       on public.modules (mirror_of)       where mirror_of is not null;
create index documents_mirror_of_idx     on public.documents (mirror_of)     where mirror_of is not null;
create index videos_mirror_of_idx        on public.videos (mirror_of)        where mirror_of is not null;
create index formula_cards_mirror_of_idx on public.formula_cards (mirror_of) where mirror_of is not null;
create index questions_mirror_of_idx     on public.questions (mirror_of)     where mirror_of is not null;
create index topics_mirror_of_idx        on public.topics (mirror_of)        where mirror_of is not null;

-- A mirror shares its source's file, so uniqueness applies to originals only.
drop index public.documents_pdf_path_idx;
create unique index documents_pdf_path_idx on public.documents (pdf_path)
  where pdf_path is not null and mirror_of is null;
drop index public.videos_provider_video_idx;
create unique index videos_provider_video_idx on public.videos (provider, provider_video_id)
  where provider_video_id is not null and mirror_of is null;

-- The mirror module of a source module, if its subject is mirrored.
create or replace function public.mirror_target_module(p_module uuid) returns uuid
language sql stable security definer set search_path = ''
as $$ select id from public.modules where mirror_of = p_module limit 1 $$;

create or replace function public.mirror_module() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_target uuid;
begin
  if new.mirror_of is not null then return new; end if;
  select target_subject_id into v_target
    from public.subject_mirrors where source_subject_id = new.subject_id;
  if v_target is null then return new; end if;
  begin
    if tg_op = 'INSERT' then
      -- Adopt a module that already has this number in the target, else create one.
      insert into public.modules (subject_id, number, title, sort_order, is_free_preview, is_published, mirror_of)
      values (v_target, new.number, new.title, new.sort_order, new.is_free_preview, new.is_published, new.id)
      on conflict (subject_id, number) do update set
        mirror_of = excluded.mirror_of, title = excluded.title, sort_order = excluded.sort_order,
        is_free_preview = excluded.is_free_preview, is_published = excluded.is_published;
    else
      update public.modules set
        number = new.number, title = new.title, sort_order = new.sort_order,
        is_free_preview = new.is_free_preview, is_published = new.is_published
      where mirror_of = new.id;
    end if;
  exception when others then
    raise warning 'mirror_module failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function public.mirror_video() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_module uuid;
begin
  if new.mirror_of is not null or new.module_id is null then return new; end if;
  v_module := public.mirror_target_module(new.module_id);
  if v_module is null then return new; end if;
  begin
    if tg_op = 'INSERT' then
      insert into public.videos (module_id, title, provider, provider_video_id, duration_sec, chapters,
        captions_url, transcript_md, thumbnail_url, sort_order, is_published, processing_status, mirror_of)
      values (v_module, new.title, new.provider, new.provider_video_id, new.duration_sec, new.chapters,
        new.captions_url, new.transcript_md, new.thumbnail_url, new.sort_order, new.is_published,
        new.processing_status, new.id);
    else
      update public.videos set
        title = new.title, provider = new.provider, provider_video_id = new.provider_video_id,
        duration_sec = new.duration_sec, chapters = new.chapters, captions_url = new.captions_url,
        transcript_md = new.transcript_md, thumbnail_url = new.thumbnail_url, sort_order = new.sort_order,
        is_published = new.is_published, processing_status = new.processing_status
      where mirror_of = new.id;
    end if;
  exception when others then
    raise warning 'mirror_video failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function public.mirror_document() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_module uuid;
begin
  if new.mirror_of is not null then return new; end if;
  v_module := public.mirror_target_module(new.module_id);
  if v_module is null then return new; end if;
  begin
    if tg_op = 'UPDATE' then
      update public.documents set
        title = new.title, content_md = new.content_md, is_published = new.is_published,
        pdf_path = new.pdf_path
      where mirror_of = new.id;
      if found then return new; end if;
    end if;
    -- New document (or one that predates the mirror): at most one per kind per module.
    insert into public.documents (module_id, kind, title, content_md, is_published, pdf_path, mirror_of)
    values (v_module, new.kind, new.title, new.content_md, new.is_published, new.pdf_path, new.id);
  exception when others then
    raise warning 'mirror_document failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function public.mirror_formula_card() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_module uuid;
begin
  if new.mirror_of is not null then return new; end if;
  v_module := public.mirror_target_module(new.module_id);
  if v_module is null then return new; end if;
  begin
    if tg_op = 'INSERT' then
      insert into public.formula_cards (module_id, title, formula_latex, symbols, when_to_use,
        sort_order, is_published, mirror_of)
      values (v_module, new.title, new.formula_latex, new.symbols, new.when_to_use,
        new.sort_order, new.is_published, new.id);
    else
      update public.formula_cards set
        title = new.title, formula_latex = new.formula_latex, symbols = new.symbols,
        when_to_use = new.when_to_use, sort_order = new.sort_order, is_published = new.is_published
      where mirror_of = new.id;
    end if;
  exception when others then
    raise warning 'mirror_formula_card failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function public.mirror_topic() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_module uuid;
begin
  if new.mirror_of is not null then return new; end if;
  v_module := public.mirror_target_module(new.module_id);
  if v_module is null then return new; end if;
  begin
    if tg_op = 'INSERT' then
      insert into public.topics (module_id, title, sort_order, mirror_of)
      values (v_module, new.title, new.sort_order, new.id);
    else
      update public.topics set title = new.title, sort_order = new.sort_order
      where mirror_of = new.id;
    end if;
  exception when others then
    raise warning 'mirror_topic failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function public.mirror_question() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_module uuid;
  v_subject uuid;
begin
  if new.mirror_of is not null or new.module_id is null then return new; end if;
  v_module := public.mirror_target_module(new.module_id);
  if v_module is null then return new; end if;
  select subject_id into v_subject from public.modules where id = v_module;
  begin
    if tg_op = 'INSERT' then
      insert into public.questions (subject_id, module_id, kind, question_md, answer_md, marks,
        sessions, frequency, sort_order, is_published, mirror_of)
      values (v_subject, v_module, new.kind, new.question_md, new.answer_md, new.marks,
        new.sessions, new.frequency, new.sort_order, new.is_published, new.id);
    else
      update public.questions set
        kind = new.kind, question_md = new.question_md, answer_md = new.answer_md, marks = new.marks,
        sessions = new.sessions, frequency = new.frequency, sort_order = new.sort_order,
        is_published = new.is_published
      where mirror_of = new.id;
    end if;
  exception when others then
    raise warning 'mirror_question failed: %', sqlerrm;
  end;
  return new;
end;
$$;

-- ---- Set up IT FM -> Computer Engineering FM and copy what already exists ----------

insert into public.subject_mirrors (source_subject_id, target_subject_id)
select '77ffc252-bf9c-4333-a889-1937945d81af', 'e1be6cfc-2612-46c6-91e6-565fa9993377'
where exists (select 1 from public.subjects where id = '77ffc252-bf9c-4333-a889-1937945d81af')
  and exists (select 1 from public.subjects where id = 'e1be6cfc-2612-46c6-91e6-565fa9993377');

-- Pair modules by number (titles already match).
update public.modules t set mirror_of = s.id
from public.subject_mirrors m
join public.modules s on s.subject_id = m.source_subject_id
where t.subject_id = m.target_subject_id and t.number = s.number and t.mirror_of is null;

-- Copy the notes / formula-sheet / important-questions PDFs that exist only in the source.
-- The mirror points at the same file in storage.
insert into public.documents (module_id, kind, title, content_md, is_published, pdf_path, mirror_of)
select t.id, d.kind, d.title, d.content_md, d.is_published, d.pdf_path, d.id
from public.documents d
join public.modules t on t.mirror_of = d.module_id
where d.mirror_of is null
  and not exists (select 1 from public.documents x where x.mirror_of = d.id)
  and not exists (select 1 from public.documents x where x.module_id = t.id and x.kind = d.kind and d.kind <> 'practical');

-- Existing videos are not copied: Computer Engineering FM already has its own copies of them.

create trigger mirror_module       after insert or update on public.modules       for each row execute function public.mirror_module();
create trigger mirror_video        after insert or update on public.videos        for each row execute function public.mirror_video();
create trigger mirror_document     after insert or update on public.documents     for each row execute function public.mirror_document();
create trigger mirror_formula_card after insert or update on public.formula_cards for each row execute function public.mirror_formula_card();
create trigger mirror_topic        after insert or update on public.topics        for each row execute function public.mirror_topic();
create trigger mirror_question     after insert or update on public.questions     for each row execute function public.mirror_question();
