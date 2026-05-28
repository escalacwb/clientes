select
  current_database() as database_name,
  current_user as db_user,
  now() as checked_at;
