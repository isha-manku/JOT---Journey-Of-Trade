import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Company

async def main():
    async with AsyncSessionLocal() as db:
        c = await db.execute(select(Company))
        for x in c.scalars().all():
            print(f"{x.name}: {x.branding.get('seller_address')}")

asyncio.run(main())
