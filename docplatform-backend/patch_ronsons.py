import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Company

async def main():
    async with AsyncSessionLocal() as db:
        c = (await db.execute(select(Company).where(Company.code == "RONSONS"))).scalar_one_or_none()
        if c:
            branding = c.branding or {}
            branding["seller_address"] = "Compass Building, Al Shohada Road, Al Hamra, Industrial Zone-FZ, Ras Al Khaimah, UAE"
            branding["seller_company"] = "Ronsons Trading FZ-LLC"
            branding["seller_contact"] = "Mr. Hirdey Batth"
            branding["seller_email"] = "ceo@ronsonstrading.com"
            branding["seller_phone"] = "+1 (604) 613-2109"
            branding["seller_website"] = "www.ronsonstrading.com"
            branding["seller_bank_name"] = "MASHREQ"
            # It seems it was completely empty or had old keys like "company_address"
            c.branding = branding
            await db.commit()
            print("Updated Ronsons branding.")
        else:
            print("Ronsons not found.")

asyncio.run(main())
