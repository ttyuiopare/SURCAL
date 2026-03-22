create table public.messages (
    id uuid default gen_random_uuid() primary key,
    request_id uuid references public.requests(id) on delete cascade not null,
    sender_id uuid references auth.users(id) not null,
    receiver_id uuid references auth.users(id) not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;
create policy "Users can read their own messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can insert messages" on public.messages for insert with check (auth.uid() = sender_id);
