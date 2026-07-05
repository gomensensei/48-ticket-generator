begin;

-- Tool48 Ticket Generator cloud-save hard limit.
-- Keeps the existing 3-slot model: each user may insert slot_num 1, 2, or 3
-- only, and may not create duplicate rows for the same slot.

create or replace function public.tool48_enforce_ticket_slot_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    raise exception 'tool48_ticket_cloud_slot_user_missing';
  end if;

  if new.slot_num not between 1 and 3 then
    raise exception 'tool48_ticket_cloud_slot_limit_reached';
  end if;

  if pg_column_size(new.ticket_payload) > 131072 then
    raise exception 'tool48_ticket_payload_too_large';
  end if;

  if exists (
    select 1
    from public.ticket_saves
    where user_id = new.user_id
      and slot_num = new.slot_num
      and (tg_op = 'INSERT' or id <> new.id)
  ) then
    raise exception 'tool48_ticket_cloud_slot_limit_reached';
  end if;

  return new;
end;
$$;

drop trigger if exists tool48_ticket_slot_limit_before_insert on public.ticket_saves;
drop trigger if exists tool48_ticket_slot_limit_before_write on public.ticket_saves;
create trigger tool48_ticket_slot_limit_before_write
before insert or update on public.ticket_saves
for each row execute function public.tool48_enforce_ticket_slot_limit();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ticket_saves_slot_num_1_to_3'
      and conrelid = 'public.ticket_saves'::regclass
  ) then
    alter table public.ticket_saves
      add constraint ticket_saves_slot_num_1_to_3
      check (slot_num between 1 and 3)
      not valid;
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
