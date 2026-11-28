"""Baseline: the schema as built by the old app/core/migrations.py script.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-11-28

Every statement is idempotent (IF [NOT] EXISTS / guarded DO blocks), so this runs safely
on an existing database (it only fills in what is missing) and on an empty one. The SQL is
frozen here on purpose: later model changes belong in new revisions, not in this file.
"""

import bcrypt
from alembic import op
from sqlalchemy import text

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None

_MAX_PASSWORD_BYTES = 72


def _hash_plaintext_passwords(conn) -> None:
    """Give users with a plain-text password a matching bcrypt hash (plain text is kept)."""
    rows = conn.execute(text(
        'SELECT username, password, password_hash FROM "user" WHERE password IS NOT NULL'
    )).all()
    for username, password, password_hash in rows:
        raw = password.encode("utf-8")
        if password_hash:
            try:
                if bcrypt.checkpw(raw, password_hash.encode("ascii")):
                    continue
            except ValueError:
                pass
        if len(raw) > _MAX_PASSWORD_BYTES:
            continue  # bcrypt can't hash it; login keeps using the plain-text fallback.
        conn.execute(
            text('UPDATE "user" SET password_hash = :hash WHERE username = :username'),
            {"hash": bcrypt.hashpw(raw, bcrypt.gensalt()).decode("ascii"), "username": username},
        )


def upgrade() -> None:
    conn = op.get_bind()

    # Tables the old script created via Base.metadata.create_all (columns as of this revision).
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS "user" (
        	username VARCHAR NOT NULL, 
        	password VARCHAR, 
        	password_hash VARCHAR, 
        	joined_date TIMESTAMP WITH TIME ZONE NOT NULL, 
        	default_sort_field VARCHAR NOT NULL, 
        	default_card_size INTEGER NOT NULL, 
        	default_type_filter VARCHAR NOT NULL, 
        	avatar_path VARCHAR, 
        	library_loaded_statuses VARCHAR[], 
        	profile_hidden_sections VARCHAR[], 
        	PRIMARY KEY (username)
        )
    """))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS media_entries (
        	id SERIAL NOT NULL, 
        	username VARCHAR NOT NULL, 
        	title VARCHAR NOT NULL, 
        	media_type VARCHAR NOT NULL, 
        	status VARCHAR NOT NULL, 
        	playtime INTEGER, 
        	release_date TIMESTAMP WITH TIME ZONE, 
        	platforms VARCHAR[], 
        	franchises VARCHAR[], 
        	genres VARCHAR[], 
        	developers VARCHAR[], 
        	publishers VARCHAR[], 
        	directors VARCHAR[], 
        	creators VARCHAR[], 
        	production_companies VARCHAR[], 
        	runtime INTEGER, 
        	last_air_date TIMESTAMP WITH TIME ZONE, 
        	number_of_seasons INTEGER, 
        	number_of_episodes INTEGER, 
        	original_title VARCHAR, 
        	season_number INTEGER, 
        	season_name VARCHAR, 
        	authors VARCHAR[], 
        	first_publish_date VARCHAR, 
        	platform_played_on VARCHAR, 
        	external_id VARCHAR NOT NULL, 
        	poster_path VARCHAR, 
        	started_at TIMESTAMP WITH TIME ZONE, 
        	finished_at TIMESTAMP WITH TIME ZONE, 
        	rating INTEGER, 
        	played_dates DATE[], 
        	rewatch_dates DATE[], 
        	number_of_rewatches INTEGER, 
        	is_favorite BOOLEAN DEFAULT 'false' NOT NULL, 
        	hide_season_name BOOLEAN DEFAULT 'false' NOT NULL, 
        	PRIMARY KEY (id), 
        	FOREIGN KEY(username) REFERENCES "user" (username) ON UPDATE CASCADE
        )
    """))
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS ix_media_entries_external_id ON media_entries (external_id)
    """))
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS ix_media_entries_id ON media_entries (id)
    """))
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS ix_media_entries_username ON media_entries (username)
    """))

    # The old script's statements, unchanged.
    # (The old script also dropped a legacy media_entries.created_at here. Removed: revision
    # 0002 re-adds created_at, and re-running this baseline must never delete its data.)
    conn.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS watched_at"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS username VARCHAR"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS rating INTEGER"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS playtime INTEGER"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS release_date TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS platforms VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS franchises VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS genres VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS developers VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS publishers VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS directors VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS creators VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS production_companies VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS runtime INTEGER"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS last_air_date TIMESTAMPTZ"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS number_of_seasons INTEGER"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS number_of_episodes INTEGER"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS original_title VARCHAR"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS season_number INTEGER"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS season_name VARCHAR"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS authors VARCHAR[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS first_publish_date VARCHAR"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS platform_played_on VARCHAR"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS played_dates DATE[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS rewatch_dates DATE[]"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS number_of_rewatches INTEGER"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS hide_season_name BOOLEAN NOT NULL DEFAULT FALSE"))
    conn.execute(text('ALTER TABLE "user" DROP COLUMN IF EXISTS ratings_enabled'))
    conn.execute(text("""ALTER TABLE "user" ADD COLUMN IF NOT EXISTS default_sort_field VARCHAR NOT NULL DEFAULT 'status'"""))
    conn.execute(text("""ALTER TABLE "user" ADD COLUMN IF NOT EXISTS default_card_size INTEGER NOT NULL DEFAULT 2"""))
    conn.execute(text("""ALTER TABLE "user" ADD COLUMN IF NOT EXISTS default_type_filter VARCHAR NOT NULL DEFAULT 'All'"""))
    conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS avatar_path VARCHAR'))
    conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS library_loaded_statuses VARCHAR[]'))
    conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_hidden_sections VARCHAR[]'))
    conn.execute(text('ALTER TABLE "user" DROP COLUMN IF EXISTS profile_alignments'))
    conn.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password_hash VARCHAR'))
    conn.execute(text('ALTER TABLE "user" ALTER COLUMN password DROP NOT NULL'))
    _hash_plaintext_passwords(conn)
    conn.execute(text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'user'
                  AND column_name = 'profile_picture_path'
            ) THEN
                EXECUTE 'UPDATE "user" SET avatar_path = profile_picture_path WHERE avatar_path IS NULL';
                EXECUTE 'ALTER TABLE "user" DROP COLUMN profile_picture_path';
            END IF;
        END $$;
    """))
    conn.execute(text("ALTER TABLE media_entries DROP CONSTRAINT IF EXISTS media_entries_username_fkey"))
    conn.execute(text(
        'ALTER TABLE media_entries '
        'ADD CONSTRAINT media_entries_username_fkey '
        'FOREIGN KEY (username) REFERENCES "user"(username) '
        'ON UPDATE CASCADE'
    ))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS friendships (
            id SERIAL PRIMARY KEY,
            owner_username VARCHAR NOT NULL REFERENCES "user"(username)
                ON UPDATE CASCADE ON DELETE CASCADE,
            friend_username VARCHAR NOT NULL REFERENCES "user"(username)
                ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT uq_friendships_owner_friend UNIQUE (owner_username, friend_username)
        )
    """))
    conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_friendships_owner_username ON friendships (owner_username)"
    ))
    conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_media_entries_external_id ON media_entries (external_id)"
    ))
    conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_friendships_friend_username ON friendships (friend_username)"
    ))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS media_lists (
            id SERIAL PRIMARY KEY,
            username VARCHAR NOT NULL REFERENCES "user"(username)
                ON UPDATE CASCADE ON DELETE CASCADE,
            name VARCHAR NOT NULL,
            description VARCHAR
        )
    """))
    conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_media_lists_username ON media_lists (username)"
    ))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS media_list_items (
            id SERIAL PRIMARY KEY,
            list_id INTEGER NOT NULL REFERENCES media_lists(id) ON DELETE CASCADE,
            entry_id INTEGER NOT NULL REFERENCES media_entries(id) ON DELETE CASCADE,
            position INTEGER NOT NULL,
            CONSTRAINT uq_media_list_items_list_entry UNIQUE (list_id, entry_id)
        )
    """))
    conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_media_list_items_list_id ON media_list_items (list_id)"
    ))
    conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_media_list_items_entry_id ON media_list_items (entry_id)"
    ))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS profile_favorites (
            id SERIAL PRIMARY KEY,
            username VARCHAR NOT NULL REFERENCES "user"(username)
                ON UPDATE CASCADE ON DELETE CASCADE,
            category VARCHAR NOT NULL DEFAULT 'All',
            slot INTEGER NOT NULL,
            title VARCHAR NOT NULL,
            media_type VARCHAR NOT NULL,
            external_id VARCHAR NOT NULL,
            poster_path VARCHAR,
            is_number_one BOOLEAN NOT NULL DEFAULT FALSE,
            CONSTRAINT uq_profile_favorites_user_category_slot UNIQUE (username, category, slot),
            CONSTRAINT uq_profile_favorites_user_category_external UNIQUE (username, category, external_id),
            CONSTRAINT ck_profile_favorites_slot CHECK (slot >= 0 AND slot < 5),
            CONSTRAINT ck_profile_favorites_category CHECK (
                category IN ('All', 'Game', 'Movie', 'Series', 'Anime', 'Book')
            )
        )
    """))
    conn.execute(text("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'profile_favorites'
                  AND column_name = 'entry_id'
            ) THEN
                ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS category VARCHAR;
                ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS title VARCHAR;
                ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS media_type VARCHAR;
                ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS external_id VARCHAR;
                ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS poster_path VARCHAR;

                UPDATE profile_favorites pf
                SET category = COALESCE(pf.category, 'All'),
                    title = e.title,
                    media_type = e.media_type,
                    external_id = e.external_id,
                    poster_path = e.poster_path
                FROM media_entries e
                WHERE pf.entry_id = e.id;

                DELETE FROM profile_favorites WHERE title IS NULL OR external_id IS NULL;

                ALTER TABLE profile_favorites DROP CONSTRAINT IF EXISTS uq_profile_favorites_user_slot;
                ALTER TABLE profile_favorites DROP CONSTRAINT IF EXISTS uq_profile_favorites_user_entry;
                ALTER TABLE profile_favorites DROP CONSTRAINT IF EXISTS profile_favorites_entry_id_fkey;
                ALTER TABLE profile_favorites DROP COLUMN entry_id;
            END IF;
        END $$;
    """))
    conn.execute(text(
        "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS category VARCHAR"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS title VARCHAR"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS media_type VARCHAR"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS external_id VARCHAR"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS poster_path VARCHAR"
    ))
    conn.execute(text(
        "UPDATE profile_favorites SET category = 'All' WHERE category IS NULL"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ALTER COLUMN category SET DEFAULT 'All'"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ALTER COLUMN category SET NOT NULL"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ALTER COLUMN title SET NOT NULL"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ALTER COLUMN media_type SET NOT NULL"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites ALTER COLUMN external_id SET NOT NULL"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites DROP CONSTRAINT IF EXISTS uq_profile_favorites_user_slot"
    ))
    conn.execute(text(
        "ALTER TABLE profile_favorites DROP CONSTRAINT IF EXISTS uq_profile_favorites_user_entry"
    ))
    conn.execute(text("""
        DO $$
        DECLARE
            rec RECORD;
            free_slot INT;
            game_has_top BOOLEAN;
        BEGIN
            DELETE FROM profile_favorites d
            USING profile_favorites g
            WHERE d.category = 'DLC'
              AND g.category = 'Game'
              AND d.username = g.username
              AND d.external_id = g.external_id;

            FOR rec IN
                SELECT id, username, slot, is_number_one
                FROM profile_favorites
                WHERE category = 'DLC'
                ORDER BY username, slot
            LOOP
                SELECT EXISTS (
                    SELECT 1 FROM profile_favorites
                    WHERE username = rec.username
                      AND category = 'Game'
                      AND is_number_one
                ) INTO game_has_top;

                IF EXISTS (
                    SELECT 1 FROM profile_favorites
                    WHERE username = rec.username
                      AND category = 'Game'
                      AND slot = rec.slot
                ) THEN
                    SELECT s INTO free_slot
                    FROM generate_series(0, 4) AS s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM profile_favorites
                        WHERE username = rec.username
                          AND category = 'Game'
                          AND slot = s
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM profile_favorites
                        WHERE username = rec.username
                          AND category = 'DLC'
                          AND slot = s
                          AND id <> rec.id
                    )
                    ORDER BY s
                    LIMIT 1;

                    IF free_slot IS NULL THEN
                        DELETE FROM profile_favorites WHERE id = rec.id;
                    ELSE
                        UPDATE profile_favorites
                        SET slot = free_slot,
                            category = 'Game',
                            is_number_one = rec.is_number_one AND NOT game_has_top
                        WHERE id = rec.id;
                    END IF;
                ELSE
                    UPDATE profile_favorites
                    SET category = 'Game',
                        is_number_one = rec.is_number_one AND NOT game_has_top
                    WHERE id = rec.id;
                END IF;
            END LOOP;
        END $$;
    """))
    conn.execute(text("""
        DELETE FROM profile_favorites a
        USING profile_favorites b
        WHERE a.id > b.id
          AND a.username = b.username
          AND a.category = b.category
          AND a.external_id = b.external_id
    """))
    conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_profile_favorites_user_category_slot'
            ) THEN
                ALTER TABLE profile_favorites
                    ADD CONSTRAINT uq_profile_favorites_user_category_slot
                    UNIQUE (username, category, slot);
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_profile_favorites_user_category_external'
            ) THEN
                ALTER TABLE profile_favorites
                    ADD CONSTRAINT uq_profile_favorites_user_category_external
                    UNIQUE (username, category, external_id);
            END IF;
            ALTER TABLE profile_favorites DROP CONSTRAINT IF EXISTS ck_profile_favorites_category;
            ALTER TABLE profile_favorites
                ADD CONSTRAINT ck_profile_favorites_category
                CHECK (category IN ('All', 'Game', 'Movie', 'Series', 'Anime', 'Book'));
        END $$;
    """))
    conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_profile_favorites_username ON profile_favorites (username)"
    ))
    conn.execute(text("DROP INDEX IF EXISTS uq_profile_favorites_one_top"))
    conn.execute(text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_favorites_one_top "
        "ON profile_favorites (username, category) WHERE is_number_one"
    ))


def downgrade() -> None:
    raise NotImplementedError("The baseline cannot be undone; restore a backup instead.")
