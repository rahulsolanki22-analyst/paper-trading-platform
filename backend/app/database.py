from pathlib import Path
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# NOTE: Using a relative SQLite path (./paper_trading.db) makes the DB location
# depend on the process working directory, which can change between restarts.
# Use a stable absolute path under the backend directory by default.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
_DEFAULT_DB_PATH = _BACKEND_DIR / "paper_trading.db"

DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{_DEFAULT_DB_PATH.as_posix()}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
