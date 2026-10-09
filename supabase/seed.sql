-- =============================================================================
-- DUMMY SEED DATA: for local development only. NOT real academic content.
-- Every title and body below is placeholder text marked "DUMMY". The maths in
-- notes/formula cards are generic rendering samples, not syllabus material.
-- Runs after migrations on `supabase db reset` and in scripts/db-verify.sh.
-- =============================================================================

-- Fixed ids so tests and local URLs are stable.
--   college   10000000-…-000000000001
--   branch    20000000-…-000000000001
--   syllabus  30000000-…-000000000001
--   subjects  40000000-…-00000000000S          (S = 1, 2)
--   modules   50000000-…-0000000000SM          (S = subject, M = module 1..3)
--   plan      60000000-…-000000000001

insert into public.colleges (id, name, short_code) values
  ('10000000-0000-4000-8000-000000000001', 'DUMMY Institute of Technology', 'DUMMY');

insert into public.branches (id, college_id, name, code) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'Information Technology', 'IT');

insert into public.syllabus_versions (id, branch_id, label, is_current) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
   'DUMMY 2024 scheme', true);

insert into public.subjects
  (id, syllabus_version_id, semester, code, name, description, sort_order, is_published)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 3,
   'DUMMY-A', 'DUMMY Subject A', 'DUMMY placeholder subject for development.', 1, true),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 3,
   'DUMMY-B', 'DUMMY Subject B', 'DUMMY placeholder subject for development.', 2, true);

-- Modules: is_free_preview omitted on purpose so the app_settings default
-- (Module 1 free) is applied by the modules_default_free_preview trigger.
insert into public.modules (id, subject_id, number, title, sort_order, is_published)
select
  format('50000000-0000-4000-8000-0000000000%s%s', s, m)::uuid,
  format('40000000-0000-4000-8000-00000000000%s', s)::uuid,
  m,
  format('DUMMY Module %s: Placeholder topic %s.%s', m, chr(64 + s), m),
  m,
  true
from generate_series(1, 2) s, generate_series(1, 3) m;

-- ---------------------------------------------------------------------------
-- Per-module content: videos, short notes, formula sheet, formula cards, topics
-- ---------------------------------------------------------------------------
do $seed$
declare
  mod record;
  label text;
  v integer;
begin
  for mod in
    select m.id, m.number, s.name as subject_name, s.id as subject_id
    from public.modules m join public.subjects s on s.id = m.subject_id
    order by s.sort_order, m.number
  loop
    label := format('%s · Module %s', mod.subject_name, mod.number);

    -- Two published videos per module, with no file yet: upload one from the admin
    -- module editor (Videos tab) to make it playable.
    for v in 1..2 loop
      insert into public.videos
        (module_id, title, provider, provider_video_id, duration_sec, chapters,
         sort_order, is_published, processing_status)
      values (
        mod.id,
        format('DUMMY video %s: %s', v, label),
        'dev',
        null,
        420 + v * 60,
        jsonb_build_array(
          jsonb_build_object('title', 'DUMMY: Introduction', 'start_sec', 0),
          jsonb_build_object('title', 'DUMMY: Main idea', 'start_sec', 95),
          jsonb_build_object('title', 'DUMMY: Worked example', 'start_sec', 240),
          jsonb_build_object('title', 'DUMMY: Recap', 'start_sec', 400)
        ),
        v,
        true,
        'pending'
      );
    end loop;

    -- One unpublished draft video on module 1 of each subject (tests draft hiding).
    if mod.number = 1 then
      insert into public.videos
        (module_id, title, provider, sort_order, is_published, processing_status)
      values (mod.id, format('DUMMY draft video (unpublished): %s', label), 'dev', 3, false,
              'pending');
    end if;

    insert into public.documents (module_id, kind, title, content_md, is_published)
    values (
      mod.id,
      'short_notes',
      format('DUMMY short notes: %s', label),
      replace($md$> **DUMMY CONTENT.** Seed data for development only. This is not real syllabus material.

# DUMMY short notes: {{label}}

## Overview

This paragraph is placeholder text used to check that the notes renderer stays readable on a 360 px screen. Body text should be at least 16 px with comfortable line height, and long words like *supercalifragilisticexpialidocious* should wrap without horizontal scrolling.

Inline maths sample: $a^2 + b^2 = c^2$, and a fraction $\frac{x}{y}$ inside a sentence.

Display maths sample:

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

Matrix sample:

$$
A = \begin{bmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{bmatrix}
$$

:::definition
**DUMMY term.** A placeholder definition used to test the *definition* callout block.
:::

:::trick
**DUMMY memory trick:** "Every Placeholder Needs Testing" (E, P, N, T). Used to test the *memory trick* callout.
:::

:::tip
**DUMMY exam tip:** placeholder advice used to test the *exam tip* callout.
:::

:::mistake
**DUMMY common mistake:** placeholder warning used to test the *common mistake* callout.
:::

## Lists and tables

1. DUMMY first point
2. DUMMY second point
   - nested DUMMY bullet

| DUMMY column | DUMMY value |
| --- | --- |
| Row 1 | `1` |
| Row 2 | `2` |

## Code sample

```c
// DUMMY code block
int main(void) {
  return 0;
}
```
$md$, '{{label}}', label),
      true
    );

    insert into public.documents (module_id, kind, title, content_md, is_published)
    values (
      mod.id,
      'formula_sheet',
      format('DUMMY formula sheet: %s', label),
      replace($md$> **DUMMY CONTENT.** Seed data for development only.

# DUMMY formula sheet: {{label}}

The cards below are generic maths used only to test formula rendering.

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

:::trick
**DUMMY memory trick** for remembering a formula.
:::
$md$, '{{label}}', label),
      true
    );

    insert into public.formula_cards
      (module_id, title, formula_latex, symbols, when_to_use, sort_order, is_published)
    values
      (mod.id, 'DUMMY: Arithmetic series sum', 'S_n = \frac{n}{2}\left(a + l\right)',
       '[{"symbol": "S_n", "meaning": "DUMMY: sum of the first n terms"},
         {"symbol": "n", "meaning": "DUMMY: number of terms"},
         {"symbol": "a", "meaning": "DUMMY: first term"},
         {"symbol": "l", "meaning": "DUMMY: last term"}]',
       'DUMMY: rendering sample, not syllabus guidance.', 1, true),
      (mod.id, 'DUMMY: Quadratic roots', 'x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}',
       '[{"symbol": "a, b, c", "meaning": "DUMMY: coefficients"},
         {"symbol": "x", "meaning": "DUMMY: root"}]',
       'DUMMY: rendering sample, not syllabus guidance.', 2, true);

    insert into public.topics (module_id, title, sort_order)
    select mod.id, format('DUMMY topic %s.%s', mod.number, t), t
    from generate_series(1, 3) t;
  end loop;
end;
$seed$;

-- ---------------------------------------------------------------------------
-- Questions: 10 of each kind (PYQ, important, viva) per subject.
-- Question 10 of each kind has no module (spans modules); the rest cycle 1→3.
-- ---------------------------------------------------------------------------
insert into public.questions
  (subject_id, module_id, kind, question_md, answer_md, marks, sessions, frequency, sort_order,
   is_published)
select
  s.id,
  case when q = 10 then null
       else (select m.id from public.modules m
             where m.subject_id = s.id and m.number = ((q - 1) % 3) + 1)
  end,
  k.kind,
  format('DUMMY %s question %s for %s. Placeholder text; evaluate $\int_0^1 x\,dx$.',
         k.label, q, s.name),
  format(E'DUMMY answer %s.\n\n$$\\int_0^1 x\\,dx = \\frac{1}{2}$$\n\n:::tip\nDUMMY exam tip for this answer.\n:::',
         q),
  case k.kind
    when 'pyq' then (array[2, 5, 10])[((q - 1) % 3) + 1]
    when 'important' then (array[5, 10])[((q - 1) % 2) + 1]
    else null
  end::smallint,
  case
    when k.kind <> 'pyq' then '{}'::text[]
    when q % 4 = 1 then array['May 2024']
    when q % 4 = 2 then array['Dec 2023']
    when q % 4 = 3 then array['May 2023', 'Dec 2022']
    else array['May 2022']
  end,
  case k.kind
    when 'important' then (array['very_frequent', 'frequent', 'sometimes']::public.question_frequency[])[((q - 1) % 3) + 1]
    else null
  end,
  q,
  true
from public.subjects s
cross join (values ('pyq'::public.question_kind, 'PYQ'),
                   ('important'::public.question_kind, 'important'),
                   ('viva'::public.question_kind, 'viva')) as k(kind, label)
cross join generate_series(1, 10) q;

-- ---------------------------------------------------------------------------
-- Plans: launch plan ₹49/month (spec §5.4). razorpay_plan_id is set in M4.
-- ---------------------------------------------------------------------------
insert into public.plans (id, name, description, price_paise, interval, scope, sort_order)
values
  ('60000000-0000-4000-8000-000000000001', 'Monthly',
   'All modules, all subjects. Cancel anytime.', 4900, 'month', 'all', 1);
