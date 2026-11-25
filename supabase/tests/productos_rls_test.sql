begin;
select plan(14);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-a@example.invalid', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-b@example.invalid', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.productos (id, user_id, nombre, sku, cantidad, minimo) values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Producto A', 'SEED-A', 4, 2),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Producto B', 'SEED-B', 3, 1);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.productos'::regclass),
  'RLS is enabled'
);
select ok(
  not has_table_privilege('anon', 'public.productos', 'select,insert,update,delete,truncate,references,trigger'),
  'anon has no table privileges'
);
select ok(
  not has_table_privilege('authenticated', 'public.productos', 'truncate,references,trigger')
  and case
    when current_setting('server_version_num')::int >= 170000
      then not has_table_privilege('authenticated', 'public.productos', 'maintain')
    else true
  end,
  'authenticated has no privileges beyond CRUD'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);

select results_eq(
  $$select sku from public.productos order by sku$$,
  $$values ('SEED-A'::text)$$,
  'user A reads only A rows'
);
select is(
  (select count(*)::int from public.productos where id = '22222222-2222-4222-8222-222222222222'),
  0,
  'user A cannot select user B row'
);

insert into public.productos (user_id, nombre, sku, cantidad, minimo)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Nuevo A', 'OWN-A', 1, 2);
select is(
  (select count(*)::int from public.productos where sku = 'OWN-A'),
  1,
  'user A can insert an owned row'
);
select throws_ok(
  $$insert into public.productos (user_id, nombre, sku) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Ajeno', 'FORGED-A')$$,
  '42501', null, 'user A cannot insert for user B'
);
select throws_ok(
  $$update public.productos set user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', null, 'user A cannot transfer an owned row to user B'
);
select is(
  (with changed as (
    update public.productos set nombre = 'Modificado por A'
    where id = '22222222-2222-4222-8222-222222222222' returning id
  ) select count(*)::int from changed),
  0,
  'user A cannot update user B row'
);
select is(
  (with removed as (
    delete from public.productos where id = '22222222-2222-4222-8222-222222222222' returning id
  ) select count(*)::int from removed),
  0,
  'user A cannot delete user B row'
);

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select results_eq(
  $$select sku from public.productos order by sku$$,
  $$values ('SEED-B'::text)$$,
  'user B reads only B rows'
);
select is(
  (with changed as (
    update public.productos set nombre = 'Modificado por B'
    where id = '11111111-1111-4111-8111-111111111111' returning id
  ) select count(*)::int from changed),
  0,
  'user B cannot update user A row'
);
select is(
  (with removed as (
    delete from public.productos where id = '11111111-1111-4111-8111-111111111111' returning id
  ) select count(*)::int from removed),
  0,
  'user B cannot delete user A row'
);

reset role;
set local role anon;
select throws_ok(
  $$select * from public.productos$$,
  '42501', null, 'anon cannot access the table'
);

reset role;
select * from finish();
rollback;
