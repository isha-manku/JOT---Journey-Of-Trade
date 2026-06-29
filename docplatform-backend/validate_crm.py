import asyncio
import uuid
import sys
import os
import json
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine
from app.models import Base, Buyer, Company, Product, DocumentType, Template, TemplateVersion, DocumentSchema, SchemaField
from app.main import app
from httpx import AsyncClient

# Four realistic test buyers
TEST_BUYERS = [
    {
        "name": "Global Traders Inc.",
        "contact_person": "Mr. Michael Johnson",
        "email": "purchasing@globaltraders.com",
        "phone": "+1 555 123 4567",
        "country": "USA",
        "address": "100 Broadway, New York, NY 10005, USA"
    },
    {
        "name": "EuroFood Importers",
        "contact_person": "Ms. Sarah Müller",
        "email": "s.mueller@eurofood.de",
        "phone": "+49 30 9876543",
        "country": "Germany",
        "address": "Alexanderplatz 1, 10178 Berlin, Germany"
    },
    {
        "name": "Asia Pacific Distribution",
        "contact_person": "Mr. Wei Chen",
        "email": "weichen@asiapacificdist.sg",
        "phone": "+65 6789 0123",
        "country": "Singapore",
        "address": "10 Bayfront Avenue, Singapore 018956"
    },
    {
        "name": "Middle East Commodities",
        "contact_person": "Mr. Tariq Al-Fayed",
        "email": "tariq@mecommodities.ae",
        "phone": "+971 4 332 5555",
        "country": "UAE",
        "address": "Sheikh Zayed Road, Dubai, UAE"
    }
]

async def setup_buyers(db):
    buyers = []
    for b in TEST_BUYERS:
        stmt = select(Buyer).where(Buyer.email == b["email"])
        buyer = (await db.execute(stmt)).scalar_one_or_none()
        if not buyer:
            buyer = Buyer(
                buyer_name=b["contact_person"],
                company_name=b["name"],
                email=b["email"],
                phone=b["phone"],
                country=b["country"],
                address=b["address"]
            )
            db.add(buyer)
            await db.flush()
        buyers.append(buyer)
    await db.commit()
    return buyers

async def validate_document(client, buyer, company, product, doctype, tpl, fields, sem, results):
    async with sem:
        # Generate form_values based on schema
        form_values = {}
        for f in fields:
            if f.default_value:
                form_values[f.key] = f.default_value
            else:
                if f.field_type == "date":
                    form_values[f.key] = "2026-06-29"
                elif f.field_type == "number":
                    form_values[f.key] = "100"
                else:
                    if "buyer_company" in f.key: form_values[f.key] = buyer.company_name
                    elif "buyer_contact" in f.key: form_values[f.key] = buyer.buyer_name
                    elif "buyer_email" in f.key: form_values[f.key] = buyer.email
                    elif "buyer_address" in f.key: form_values[f.key] = buyer.address
                    elif "buyer_phone" in f.key: form_values[f.key] = buyer.phone
                    elif "buyer_country" in f.key: form_values[f.key] = buyer.country
                    elif "buyer_bank" in f.key: form_values[f.key] = "Test Bank"
                    elif "buyer_account" in f.key: form_values[f.key] = "Test Account"
                    elif "buyer_swift" in f.key: form_values[f.key] = "TESTSWIFT"
                    else:
                        form_values[f.key] = "Test Value"

        payload = {
            "company_id": str(company.id),
            "product_id": str(product.id),
            "document_type_id": str(doctype.id),
            "buyer_name": buyer.buyer_name or "Test Buyer",
            "company_name": buyer.company_name or "Test Co",
            "country": buyer.country or "USA",
            "phone": buyer.phone or "12345",
            "email": buyer.email,
            "form_values": form_values,
            "created_by": "System Validation"
        }
        
        try:
            resp = await client.post("/documents/generate", json=payload, timeout=60.0)
            if resp.status_code != 200:
                results.append({
                    "buyer": buyer.company_name, "company": company.name, "product": product.name, "doctype": doctype.name,
                    "error": f"API Create Error {resp.status_code}: {resp.text}", "payload": payload
                })
                return
            
            doc_id = resp.json()["id"]
            
            # Preview PDF
            pdf_resp = await client.get(f"/documents/{doc_id}/pdf?download=false&language=en", timeout=120.0)
            if pdf_resp.status_code != 200:
                results.append({
                    "buyer": buyer.company_name, "company": company.name, "product": product.name, "doctype": doctype.name,
                    "error": f"PDF Generation Error {pdf_resp.status_code}: {pdf_resp.text}"
                })
                return
                
            if doctype.code == "FCO":
                pdf_zh = await client.get(f"/documents/{doc_id}/pdf?download=false&language=zh", timeout=120.0)
                if pdf_zh.status_code != 200:
                    results.append({
                        "buyer": buyer.company_name, "company": company.name, "product": product.name, "doctype": doctype.name,
                        "error": f"PDF Bilingual Generation Error {pdf_zh.status_code}: {pdf_zh.text}"
                    })
                    return
                
            results.append("SUCCESS")
            
        except Exception as e:
            results.append({
                "buyer": buyer.company_name, "company": company.name, "product": product.name, "doctype": doctype.name,
                "error": f"Exception: {str(e)}"
            })

async def main():
    print("Starting CRM Validation...")
    async with AsyncSessionLocal() as db:
        buyers = await setup_buyers(db)
        companies = (await db.execute(select(Company))).scalars().all()
        products = (await db.execute(select(Product))).scalars().all()
        doctypes = (await db.execute(select(DocumentType))).scalars().all()

        print(f"Loaded {len(buyers)} Buyers, {len(companies)} Companies, {len(products)} Products, {len(doctypes)} Document Types.")
        
        templates_map = {}
        tpls = (await db.execute(select(Template))).scalars().all()
        for t in tpls:
            templates_map[(t.company_id, t.product_id, t.document_type_id)] = t
        
        schemas_map = {}
        for t in tpls:
            schema = (await db.execute(select(DocumentSchema).where(DocumentSchema.template_id == t.id).order_by(DocumentSchema.version.desc()))).scalars().first()
            if schema:
                fields = (await db.execute(select(SchemaField).where(SchemaField.schema_id == schema.id))).scalars().all()
                schemas_map[t.id] = fields
                
    results = []
    # Limit concurrent xelatex processes
    sem = asyncio.Semaphore(3) 
    tasks = []
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        buyers = [b for b in buyers if "Michael Johnson" in b.buyer_name]
        for buyer in buyers:
            for company in companies:
                for product in products:
                    for doctype in doctypes:
                        tpl = templates_map.get((company.id, product.id, doctype.id))
                        if not tpl:
                            results.append({
                                "error": f"MISSING TEMPLATE: Company {company.name}, Product {product.name}, DocType {doctype.name}"
                            })
                            continue
                        
                        fields = schemas_map.get(tpl.id, [])
                        tasks.append(validate_document(client, buyer, company, product, doctype, tpl, fields, sem, results))
        
        print(f"Executing {len(tasks)} validation tasks concurrently...")
        await asyncio.gather(*tasks)

    success_count = sum(1 for r in results if r == "SUCCESS")
    failures = [r for r in results if r != "SUCCESS"]
    
    print(f"\nVALIDATION COMPLETE: {success_count} Successful, {len(failures)} Failed.")
    if failures:
        with open("validation_failures.json", "w") as f:
            json.dump(failures, f, indent=2)
        print("Failures logged to validation_failures.json")

if __name__ == "__main__":
    asyncio.run(main())
