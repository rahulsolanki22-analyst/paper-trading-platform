from pathlib import Path
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Primary: PostgreSQL (set DATABASE_URL in .env)
# Fallback: SQLite for quick local dev when DATABASE_URL is unset.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
_DEFAULT_SQLITE = f"sqlite:///{(_BACKEND_DIR / 'paper_trading.db').as_posix()}"

DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_SQLITE)

# SQLite needs check_same_thread=False; PostgreSQL does not.
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
