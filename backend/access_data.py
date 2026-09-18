import asyncio
import json
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings


async def access_backend_data():
    print("=== 1. ACCESSING DATASET FILES ===")
    backend_dir = Path(__file__).resolve().parent
    dataset_path = backend_dir / "data" / "career_roadmaps.json"

    if dataset_path.exists():
        with open(dataset_path, "r", encoding="utf-8") as f:
            roadmaps = json.load(f)
            # Print just the keys (roles) in the dataset to show it worked
            print(f"Successfully loaded {len(roadmaps)} career roadmaps from JSON.")
            print(f"Available roles in dataset: {list(roadmaps.keys())[:5]}...")
    else:
        print(f"Dataset not found at {dataset_path}")

    print("\n=== 2. ACCESSING DATABASE RECORDS ===")
    print(f"Connecting to database at: {settings.DATABASE_URL}")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Example query: fetch all registered users
        result = await session.execute(
            text("SELECT id, email, is_active FROM users LIMIT 5;")
        )
        users = result.fetchall()

        print(f"Found {len(users)} users in the database (showing up to 5):")
        for u in users:
            print(f" - ID: {u.id}, Email: {u.email}, Active: {u.is_active}")


if __name__ == "__main__":
    asyncio.run(access_backend_data())
