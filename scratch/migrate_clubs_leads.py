import asyncio
from sqlalchemy import text
from app.core.database import SessionLocal

async def main():
    async with SessionLocal() as s:
        # Check existing columns
        res = await s.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'clubs'"))
        cols = [r[0] for r in res.fetchall()]
        print("Existing clubs columns:", cols)

        # Add head_id and co_head_id if missing
        if "head_id" not in cols:
            print("Adding head_id column to clubs...")
            await s.execute(text("ALTER TABLE clubs ADD COLUMN head_id INTEGER REFERENCES users(id) ON DELETE SET NULL"))
        if "co_head_id" not in cols:
            print("Adding co_head_id column to clubs...")
            await s.execute(text("ALTER TABLE clubs ADD COLUMN co_head_id INTEGER REFERENCES users(id) ON DELETE SET NULL"))
        await s.commit()

        # Re-check columns
        res2 = await s.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'clubs'"))
        print("Updated clubs columns:", [r[0] for r in res2.fetchall()])

if __name__ == "__main__":
    asyncio.run(main())
