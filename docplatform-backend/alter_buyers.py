import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as session:
        try:
            await session.execute(text("ALTER TABLE buyers ADD COLUMN buyer_name VARCHAR(255);"))
            await session.execute(text("ALTER TABLE buyers ADD COLUMN company_name VARCHAR(255);"))
            await session.execute(text("ALTER TABLE buyers ADD COLUMN email VARCHAR(255);"))
            await session.execute(text("ALTER TABLE buyers ADD COLUMN country VARCHAR(100);"))
            await session.execute(text("ALTER TABLE buyers ADD COLUMN phone VARCHAR(100);"))
            await session.commit()
            print("Successfully added columns to buyers table.")
        except Exception as e:
            print("Error or columns might already exist:", e)

if __name__ == "__main__":
    asyncio.run(main())
