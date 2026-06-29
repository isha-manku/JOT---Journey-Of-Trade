import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import AsyncSessionLocal
from app.models import GeneratedDocumentVersion
import os

async def export_tex():
    async with AsyncSessionLocal() as session:
        dv = await session.execute(
            select(GeneratedDocumentVersion)
            .options(selectinload(GeneratedDocumentVersion.template_version))
            .limit(1)
        )
        dv = dv.scalar_one()
        
        with open("debug.tex", "w", encoding="utf-8") as f:
            f.write(dv.template_version.latex_source)
        print("Exported debug.tex")

if __name__ == "__main__":
    asyncio.run(export_tex())
