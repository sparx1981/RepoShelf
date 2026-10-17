-- Temporary helper used once to import Studio images: the `http` extension, callable only by the database owner.
-- The import is finished and 20261013203704 / 20261014053615 remove the extension again, so nothing creates it any more: a new
-- project (or the test database) does not need an extension that may not even be installed there. Projects that already ran the
-- original version are unaffected: the end state, no `http` extension, is the same.
select 1;
