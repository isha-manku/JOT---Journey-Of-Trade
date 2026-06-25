"""
Seed example config: one Company, one Product, one DocumentType (LOI),
a Template with a versioned LaTeX/Jinja2 source and a schema.
Run:  python -m seed
"""
import asyncio
from app.database import AsyncSessionLocal, engine
from app.models import (
    Base, Company, Product, DocumentType, Template, TemplateVersion,
    DocumentSchema, SchemaField,
)

LOI_LATEX = r"""
\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage{helvet}
\renewcommand{\familydefault}{\sfdefault}
\begin{document}

\begin{center}
{\LARGE \textbf{\VAR{seller_company}}}\\[2pt]
{\small \VAR{seller_address}}\\[10pt]
{\Large \textbf{LETTER OF INTENT (LOI)}}
\end{center}

\vspace{1em}
\noindent \textbf{Date:} \VAR{loi_date} \hfill \textbf{Ref:} \VAR{reference_no}

\vspace{1em}
\noindent We, \textbf{\VAR{buyer_company}}, hereby confirm our irrevocable intent to
purchase the following commodity under the terms below:

\vspace{1em}
\begin{tabular}{ll}
\textbf{Product:} & \VAR{product_name} \\
\textbf{Quantity:} & \VAR{quantity} \VAR{unit} \\
\textbf{Unit Price:} & \VAR{unit_price} \\
\textbf{Destination Port:} & \VAR{destination_port} \\
\textbf{Delivery Time:} & \VAR{delivery_time} \\
\textbf{Payment Terms:} & \VAR{payment_terms} \\
\end{tabular}

\vspace{2em}
\noindent \textbf{Authorized Signatory}\\
\VAR{buyer_company}

\vspace{3em}
\noindent {\small Seller Bank: \VAR{seller_bank} --- This document is generated electronically.}
\end{document}
"""

FIELDS = [
    dict(key="buyer_company", label="Buyer Company Name", field_type="text", required=True, order=1),
    dict(key="reference_no", label="Reference No", field_type="text", required=True, order=2),
    dict(key="loi_date", label="LOI Date", field_type="date", required=True, order=3),
    dict(key="quantity", label="Quantity", field_type="number", required=True, order=4),
    dict(key="unit_price", label="Unit Price (USD)", field_type="text", required=True, order=5),
    dict(key="destination_port", label="Destination Port", field_type="text", required=True, order=6),
    dict(key="delivery_time", label="Delivery Time", field_type="text", required=True, order=7),
    dict(key="payment_terms", label="Payment Terms", field_type="dropdown", required=True, order=8,
         options=["MT103 TT", "DLC at Sight", "SBLC", "MT760"]),
]

# Static template content injected at generation time (not re-entered by user).
STATIC_CONTEXT = {
    "seller_company": "Western Agro Ltd.",
    "seller_address": "12 Harbour Road, Rotterdam, Netherlands",
    "seller_bank": "ABN AMRO — IBAN NL00 ABNA 0000 0000 00",
    "product_name": "Sunflower Oil",
    "unit": "MT",
}


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        company = Company(name="Western Agro", code="WAGRO", branding=STATIC_CONTEXT)
        product = Product(name="Sunflower Oil", code="SFO", unit="MT")
        doctype = DocumentType(name="LOI", code="LOI", description="Letter of Intent")
        db.add_all([company, product, doctype])
        await db.flush()

        tpl = Template(name="Western Agro Sunflower LOI",
                       company_id=company.id, product_id=product.id,
                       document_type_id=doctype.id)
        db.add(tpl)
        await db.flush()

        db.add(TemplateVersion(template_id=tpl.id, version=1, latex_source=LOI_LATEX))
        schema = DocumentSchema(template_id=tpl.id, version=1)
        db.add(schema)
        await db.flush()
        for f in FIELDS:
            db.add(SchemaField(schema_id=schema.id, **f))

        await db.commit()
        print("Seeded. company_id=", company.id)


if __name__ == "__main__":
    asyncio.run(main())
