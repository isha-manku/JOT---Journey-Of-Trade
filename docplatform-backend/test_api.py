import httpx
import asyncio

async def test_api():
    # Make a request to the backend as the frontend would
    # First get a document ID
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models import GeneratedDocument
    
    async with AsyncSessionLocal() as session:
        doc = await session.execute(select(GeneratedDocument).limit(1))
        doc = doc.scalar_one()
        doc_id = str(doc.id)
        
    print(f"Testing with doc ID: {doc_id}")
    
    async with httpx.AsyncClient() as client:
        # Test English
        print("Testing English PDF...")
        res_en = await client.get(f"http://127.0.0.1:8000/documents/{doc_id}/pdf?language=en")
        print("English Response:", res_en.status_code)
        if res_en.status_code != 200:
            print(res_en.text)
            
        # Test Chinese
        print("Testing Chinese PDF...")
        res_zh = await client.get(f"http://127.0.0.1:8000/documents/{doc_id}/pdf?language=zh")
        print("Chinese Response:", res_zh.status_code)
        if res_zh.status_code != 200:
            print(res_zh.text)

if __name__ == "__main__":
    asyncio.run(test_api())
