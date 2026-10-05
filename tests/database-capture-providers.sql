begin;
set role anon;
do $$begin begin perform * from public.reposhelf_capture_reserve('thumio');raise exception 'Anonymous reservation allowed';exception when insufficient_privilege then null;end;end$$;
reset role;set role authenticated;
do $$begin begin perform * from public.reposhelf_capture_reserve('thumio');raise exception 'Member reservation allowed';exception when insufficient_privilege then null;end;begin perform * from public.reposhelf_capture_settings(1,'{"screenshotone":true,"thumio":false,"cloudflare":false}');raise exception 'Member settings allowed';exception when insufficient_privilege then null;end;end$$;
reset role;set role service_role;
do $$declare r jsonb;begin
r:=public.reposhelf_capture_reserve('screenshotone');if (r->>'allowed')::boolean then raise exception 'Disabled provider used';end if;
update public.capture_settings set providers='{"screenshotone":true,"thumio":false,"cloudflare":false}' where id;
for i in 1..100 loop r:=public.reposhelf_capture_reserve('screenshotone');if not (r->>'allowed')::boolean then raise exception 'Free allowance rejected';end if;end loop;
r:=public.reposhelf_capture_reserve('screenshotone');if (r->>'allowed')::boolean then raise exception 'Free cap exceeded';end if;
update public.capture_settings set providers='{"screenshotone":false,"thumio":false,"cloudflare":false}' where id;
r:=public.reposhelf_capture_reserve('screenshotone');if r->>'reason'<>'disabled' then raise exception 'Disable did not take effect';end if;
end$$;
reset role;rollback;
