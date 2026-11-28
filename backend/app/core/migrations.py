"""Database schema migrations for MediaVault.

These used to run on every API startup, which made each Render cold start
noticeably slower. Now they run only when you ask for them:

    cd backend
    python -m app.core.migrations

or by setting RUN_MIGRATIONS=1 in the environment before starting the API.
All statements are idempotent (IF EXISTS / IF NOT EXISTS), so running them
more than once is safe.
"""

from sqlalchemy import text

from app.core.database import engine, Base
from app.core.security import MAX_PASSWORD_BYTES, hash_password, verify_password
from app import models  # noqa: F401  (registers all tables on Base)


def hash_plaintext_passwords(connection) -> int:
    """Give every user that still has a plain-text password a matching password_hash.

    Also repairs a hash that no longer matches (the password was changed by code that
    only wrote the plain-text column). The plain-text column is not touched; clearing it
    is a later, separate step once every login works from the hash. Safe to run repeatedly.

    @returns Number of users whose hash was written.
    """
    rows = connection.execute(text(
        'SELECT username, password, password_hash FROM "user" WHERE password IS NOT NULL'
    )).all()
    hashed = 0
    for username, password, password_hash in rows:
        if password_hash and verify_password(password, password_hash):
            continue
        if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
            continue  # bcrypt can't hash it; login keeps using the plain-text fallback.
        connection.execute(
            text('UPDATE "user" SET password_hash = :hash WHERE username = :username'),
            {"hash": hash_password(password), "username": username},
        )
        hashed += 1
    return hashed


def run_migrations() -> None:
    """Create missing tables and apply all column/constraint migrations."""
    Base.metadata.create_all(bind=engine)

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS created_at"))
        connection.execute(text("ALTER TABLE media_entries DROP COLUMN IF EXISTS watched_at"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS username VARCHAR"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS rating INTEGER"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS playtime INTEGER"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS release_date TIMESTAMPTZ"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS platforms VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS franchises VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS genres VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS developers VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS publishers VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS directors VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS creators VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS production_companies VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS runtime INTEGER"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS last_air_date TIMESTAMPTZ"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS number_of_seasons INTEGER"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS number_of_episodes INTEGER"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS original_title VARCHAR"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS season_number INTEGER"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS season_name VARCHAR"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS authors VARCHAR[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS first_publish_date VARCHAR"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS platform_played_on VARCHAR"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS played_dates DATE[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS rewatch_dates DATE[]"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS number_of_rewatches INTEGER"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE"))
        connection.execute(text("ALTER TABLE media_entries ADD COLUMN IF NOT EXISTS hide_season_name BOOLEAN NOT NULL DEFAULT FALSE"))
        connection.execute(text('ALTER TABLE "user" DROP COLUMN IF EXISTS ratings_enabled'))
        connection.execute(text("""ALTER TABLE "user" ADD COLUMN IF NOT EXISTS default_sort_field VARCHAR NOT NULL DEFAULT 'status'"""))
        connection.execute(text("""ALTER TABLE "user" ADD COLUMN IF NOT EXISTS default_card_size INTEGER NOT NULL DEFAULT 2"""))
        connection.execute(text("""ALTER TABLE "user" ADD COLUMN IF NOT EXISTS default_type_filter VARCHAR NOT NULL DEFAULT 'All'"""))
        connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS avatar_path VARCHAR'))
        connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS library_loaded_statuses VARCHAR[]'))
        connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_hidden_sections VARCHAR[]'))
        connection.execute(text('ALTER TABLE "user" DROP COLUMN IF EXISTS profile_alignments'))
        connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password_hash VARCHAR'))
        connection.execute(text('ALTER TABLE "user" ALTER COLUMN password DROP NOT NULL'))
        hash_plaintext_passwords(connection)
        connection.execute(text("""
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
        connection.execute(text("ALTER TABLE media_entries DROP CONSTRAINT IF EXISTS media_entries_username_fkey"))
        connection.execute(text(
            'ALTER TABLE media_entries '
            'ADD CONSTRAINT media_entries_username_fkey '
            'FOREIGN KEY (username) REFERENCES "user"(username) '
            'ON UPDATE CASCADE'
        ))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS friendships (
                id SERIAL PRIMARY KEY,
                owner_username VARCHAR NOT NULL REFERENCES "user"(username)
                    ON UPDATE CASCADE ON DELETE CASCADE,
                friend_username VARCHAR NOT NULL REFERENCES "user"(username)
                    ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT uq_friendships_owner_friend UNIQUE (owner_username, friend_username)
            )
        """))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_friendships_owner_username ON friendships (owner_username)"
        ))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_media_entries_external_id ON media_entries (external_id)"
        ))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_friendships_friend_username ON friendships (friend_username)"
        ))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS media_lists (
                id SERIAL PRIMARY KEY,
                username VARCHAR NOT NULL REFERENCES "user"(username)
                    ON UPDATE CASCADE ON DELETE CASCADE,
                name VARCHAR NOT NULL,
                description VARCHAR
            )
        """))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_media_lists_username ON media_lists (username)"
        ))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS media_list_items (
                id SERIAL PRIMARY KEY,
                list_id INTEGER NOT NULL REFERENCES media_lists(id) ON DELETE CASCADE,
                entry_id INTEGER NOT NULL REFERENCES media_entries(id) ON DELETE CASCADE,
                position INTEGER NOT NULL,
                CONSTRAINT uq_media_list_items_list_entry UNIQUE (list_id, entry_id)
            )
        """))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_media_list_items_list_id ON media_list_items (list_id)"
        ))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_media_list_items_entry_id ON media_list_items (entry_id)"
        ))
        connection.execute(text("""
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
        connection.execute(text("""
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
        connection.execute(text(
            "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS category VARCHAR"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS title VARCHAR"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS media_type VARCHAR"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS external_id VARCHAR"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ADD COLUMN IF NOT EXISTS poster_path VARCHAR"
        ))
        connection.execute(text(
            "UPDATE profile_favorites SET category = 'All' WHERE category IS NULL"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ALTER COLUMN category SET DEFAULT 'All'"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ALTER COLUMN category SET NOT NULL"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ALTER COLUMN title SET NOT NULL"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ALTER COLUMN media_type SET NOT NULL"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites ALTER COLUMN external_id SET NOT NULL"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites DROP CONSTRAINT IF EXISTS uq_profile_favorites_user_slot"
        ))
        connection.execute(text(
            "ALTER TABLE profile_favorites DROP CONSTRAINT IF EXISTS uq_profile_favorites_user_entry"
        ))
        connection.execute(text("""
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
        connection.execute(text("""
            DELETE FROM profile_favorites a
            USING profile_favorites b
            WHERE a.id > b.id
              AND a.username = b.username
              AND a.category = b.category
              AND a.external_id = b.external_id
        """))
        connection.execute(text("""
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
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_profile_favorites_username ON profile_favorites (username)"
        ))
        connection.execute(text("DROP INDEX IF EXISTS uq_profile_favorites_one_top"))
        connection.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_favorites_one_top "
            "ON profile_favorites (username, category) WHERE is_number_one"
        ))


if __name__ == "__main__":
    run_migrations()
    print("Migrations applied.")
