"""SQLAlchemy engine and session helpers for PostgreSQL."""

from pathlib import Path
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# backend/app/database.py → repo root .env
_ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

# SQLAlchemy engine, session and base setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Yield a request-scoped SQLAlchemy session and close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
