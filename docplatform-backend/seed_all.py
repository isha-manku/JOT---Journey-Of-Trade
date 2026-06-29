"""
Scalable, idempotent seeder for the Document Automation Platform.
Generates all Company Ã— Product Ã— DocumentType template combinations.

Currently configured for:
  4 companies Ã— 12 products Ã— 7 document types = 336 templates

Safe to run multiple times â€” only adds missing records, never deletes.

Run:  python seed_all.py
"""
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine
from app.models import (
    Base, Company, Product, DocumentType, Template, TemplateVersion,
    DocumentSchema, SchemaField,
)
from seed_master_templates import MASTER_TEMPLATES

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# CONFIGURATION â€” Add a new company/product/doctype by appending to the array.
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

COMPANIES = [
    {
        "name": "Ronsons Trading FZ-LLC",
        "code": "RONSONS",
        "branding": {
            "seller_company": "Ronsons Trading FZ-LLC",
            "seller_address": "Compass Building, Al Shohada Road, Al Hamra, Industrial Zone-FZ, Ras Al Khaimah, UAE",
            "seller_contact": "Mr. Hirdey Batth",
            "seller_email": "ceo@ronsonstrading.com",
            "seller_phone": "+1 (604) 613-2109",
            "seller_website": "www.ronsonstrading.com",
            "seller_bank_name": "MASHREQ",
            "seller_bank_address": "Beside Al Hooth Hypermarket, Al Muntasir RD, Al Nakheel, Ras Al Khaimah, UAE",
            "seller_account_name": "RONSONS TRADING FZ-LLC",
            "seller_account_number": "019101772389",
            "seller_iban": "AE380330000019101772389",
            "seller_swift": "BOMLAEAD",
        },
    },
    {
        "name": "Pacific Gulf Trading Co.",
        "code": "PGULF",
        "branding": {
            "seller_company": "Pacific Gulf Trading Co.",
            "seller_address": "Suite 1205, Al Mana Tower, West Bay, Doha, Qatar",
            "seller_contact": "Mr. Ahmed Al-Rashid",
            "seller_email": "trade@pacificgulf.qa",
            "seller_phone": "+974 4412 8800",
            "seller_website": "www.pacificgulf.qa",
            "seller_bank_name": "Qatar National Bank (QNB)",
            "seller_bank_address": "QNB Head Office, West Bay, Doha, Qatar",
            "seller_account_name": "PACIFIC GULF TRADING CO. WLL",
            "seller_account_number": "2810014567890",
            "seller_iban": "QA58QNBA000000002810014567890",
            "seller_swift": "QNBAQAQA",
        },
    },
    {
        "name": "Atlantic Commodities Ltd.",
        "code": "ATLCOM",
        "branding": {
            "seller_company": "Atlantic Commodities Ltd.",
            "seller_address": "3rd Floor, 55 Gracechurch Street, London EC3V 0EE, United Kingdom",
            "seller_contact": "Mr. James Whitfield",
            "seller_email": "ops@atlanticcommodities.co.uk",
            "seller_phone": "+44 20 7946 0958",
            "seller_website": "www.atlanticcommodities.co.uk",
            "seller_bank_name": "Barclays Bank PLC",
            "seller_bank_address": "1 Churchill Place, Canary Wharf, London E14 5HP, UK",
            "seller_account_name": "ATLANTIC COMMODITIES LTD",
            "seller_account_number": "40127856",
            "seller_iban": "GB29BARC20035340127856",
            "seller_swift": "BARCGB22",
        },
    },
    {
        "name": "Southern Cross Exports Pty",
        "code": "SCEXP",
        "branding": {
            "seller_company": "Southern Cross Exports Pty Ltd",
            "seller_address": "Rua dos Navegantes 451, Sala 802, Recife, PE 51020-010, Brazil",
            "seller_contact": "Mr. Carlos Ferreira",
            "seller_email": "export@southerncross.com.br",
            "seller_phone": "+55 81 3032 7700",
            "seller_website": "www.southerncross.com.br",
            "seller_bank_name": "Banco do Brasil S.A.",
            "seller_bank_address": "Ag. 3456-7, Av. Paulista 1230, Sao Paulo, SP, Brazil",
            "seller_account_name": "SOUTHERN CROSS EXPORTS PTY LTDA",
            "seller_account_number": "78901-2",
            "seller_iban": "BR1500000000000078901200014C1",
            "seller_swift": "BRASBRRJSPA",
        },
    },
]

PRODUCTS = [
    {"name": "Frozen Chicken Paws",          "code": "FCP",  "unit": "MT"},
    {"name": "Frozen Chicken Feet",          "code": "FCF",  "unit": "MT"},
    {"name": "Frozen Chicken Wings",         "code": "FCW",  "unit": "MT"},
    {"name": "Frozen Chicken Drumsticks",    "code": "FCD",  "unit": "MT"},
    {"name": "Frozen Chicken Breast",        "code": "FCB",  "unit": "MT"},
    {"name": "Frozen Chicken Thighs",        "code": "FCT",  "unit": "MT"},
    {"name": "Frozen Chicken Leg Quarters",  "code": "FCLQ", "unit": "MT"},
    {"name": "Frozen Chicken Whole",         "code": "FCWH", "unit": "MT"},
    {"name": "Frozen Chicken Gizzards",      "code": "FCG",  "unit": "MT"},
    {"name": "Frozen Chicken Hearts",        "code": "FCH",  "unit": "MT"},
    {"name": "Frozen Chicken Liver",         "code": "FCL",  "unit": "MT"},
    {"name": "Frozen Duck Wings",            "code": "FDW",  "unit": "MT"},
]

DOCUMENT_TYPES = [
    {"name": "FCO",                "code": "FCO",  "description": "Full Corporate Offer"},
    {"name": "LOI",                "code": "LOI",  "description": "Letter of Intent"},
    {"name": "SPA",                "code": "SPA",  "description": "Sales and Purchase Agreement"},
    {"name": "ICPO",               "code": "ICPO", "description": "Irrevocable Corporate Purchase Order"},
    {"name": "Proforma Invoice",   "code": "PI",   "description": "Proforma Invoice"},
    {"name": "Packing List",       "code": "PL",   "description": "Packing List"},
    {"name": "Specification Sheet","code": "SPEC", "description": "Product Specification Sheet"},
]


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# IDEMPOTENT HELPERS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async def get_or_create_by_code(db, model, code: str, **create_kwargs):
    """Return (instance, was_created). Looks up by `code` column."""
    stmt = select(model).where(model.code == code)
    obj = (await db.execute(stmt)).scalar_one_or_none()
    if obj:
        return obj, False
    obj = model(code=code, **create_kwargs)
    db.add(obj)
    await db.flush()
    return obj, True


async def template_exists(db, company_id, product_id, doctype_id) -> bool:
    """Check if a Template row already exists for this combination."""
    stmt = select(Template.id).where(
        Template.company_id == company_id,
        Template.product_id == product_id,
        Template.document_type_id == doctype_id,
    )
    return (await db.execute(stmt)).scalar_one_or_none() is not None


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# MAIN SEEDER
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async def main():
    # Ensure all tables exist (no-op if they already do)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # â”€â”€ 1. Upsert Companies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        company_map = {}   # code -> ORM object
        for c in COMPANIES:
            obj, created = await get_or_create_by_code(
                db, Company, c["code"],
                name=c["name"], branding=c["branding"],
            )
            company_map[c["code"]] = obj
            tag = "âœ… Created" if created else "â© Exists "
            print(f"  {tag}  Company: {c['name']}")

        # â”€â”€ 2. Upsert Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        product_map = {}   # code -> ORM object
        for p in PRODUCTS:
            obj, created = await get_or_create_by_code(
                db, Product, p["code"],
                name=p["name"], unit=p["unit"],
            )
            product_map[p["code"]] = obj
            tag = "âœ… Created" if created else "â© Exists "
            print(f"  {tag}  Product: {p['name']}")

        # â”€â”€ 3. Upsert Document Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        doctype_map = {}   # code -> ORM object
        for d in DOCUMENT_TYPES:
            obj, created = await get_or_create_by_code(
                db, DocumentType, d["code"],
                name=d["name"], description=d.get("description", ""),
            )
            doctype_map[d["code"]] = obj
            tag = "âœ… Created" if created else "â© Exists "
            print(f"  {tag}  DocType: {d['name']}")

        # â”€â”€ 4. Generate Template Combinations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        created_count = 0
        skipped_count = 0
        total = len(company_map) * len(product_map) * len(doctype_map)

        print(f"\n{'â”€'*60}")
        print(f"Generating template combinations ({total} possible)...")
        print(f"{'â”€'*60}")

        for c_code, company in company_map.items():
            for p_code, product in product_map.items():
                for dt_code, doctype in doctype_map.items():
                    # Skip if this combination already exists
                    if await template_exists(db, company.id, product.id, doctype.id):
                        skipped_count += 1
                        continue

                    # Get master template for this document type
                    master = MASTER_TEMPLATES.get(dt_code)
                    if not master:
                        print(f"  âš ï¸  No master template for {dt_code}, skipping.")
                        skipped_count += 1
                        continue

                    # Create Template
                    tpl_name = f"{company.name} {product.name} {doctype.name}"
                    tpl = Template(
                        name=tpl_name,
                        company_id=company.id,
                        product_id=product.id,
                        document_type_id=doctype.id,
                    )
                    db.add(tpl)
                    await db.flush()

                    # Create TemplateVersion (LaTeX source)
                    db.add(TemplateVersion(
                        template_id=tpl.id,
                        version=1,
                        latex_source=master["latex"],
                    ))

                    # Create DocumentSchema + SchemaFields
                    schema = DocumentSchema(template_id=tpl.id, version=1)
                    db.add(schema)
                    await db.flush()

                    for f in master["fields"]:
                        db.add(SchemaField(schema_id=schema.id, **f))

                    created_count += 1

            # Commit after each company to avoid huge transactions
            await db.commit()
            print(f"  âœ… Finished company: {company.name}")

        # â”€â”€ 5. Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print(f"\n{'â•'*60}")
        print(f"  SEED COMPLETE")
        print(f"{'â•'*60}")
        print(f"  Companies:      {len(company_map)}")
        print(f"  Products:       {len(product_map)}")
        print(f"  Document Types: {len(doctype_map)}")
        print(f"  Templates created: {created_count}")
        print(f"  Templates skipped: {skipped_count} (already existed)")
        print(f"  Total templates:   {created_count + skipped_count}")
        print(f"{'â•'*60}")


if __name__ == "__main__":
    print("=" * 60)
    print("  Document Automation Platform â€” Scalable Seeder")
    print("=" * 60)
    asyncio.run(main())
