create table telemetry_heartbeats (
  id bigint generated always as identity primary key,
  instance_id text not null,
  version text not null,
  configured_count int not null default 0,
  uptime_seconds int not null default 0,
  node_version text,
  platform text,
  received_at timestamptz not null default now()
);

create index idx_heartbeats_instance on telemetry_heartbeats(instance_id);
create index idx_heartbeats_received on telemetry_heartbeats(received_at);
