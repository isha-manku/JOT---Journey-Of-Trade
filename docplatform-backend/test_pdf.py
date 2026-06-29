import requests

url = "http://localhost:8000/documents/generate"
data = {
    "company_code": "PGULF",
    "product_code": "FCW",
    "document_type_code": "SPA",
    "lang": "en",
    "fields": {
        "spa_date": "2026-06-29",
        "contract_no": "SPA-2026-PGULF-001",
        "buyer_company": "Ocean Traders Ltd.",
        "buyer_address": "456 Sea Port, London",
        "buyer_contact_person": "Mr. John Smith",
        "buyer_email": "john@oceantraders.com",
        "product_origin": "Brazil",
        "total_quantity": "500 MT",
        "contract_price": "USD 1200 / MT",
        "total_value": "USD 600,000",
        "destination_port": "Dubai (Jebel Ali)",
        "loading_port": "Santos, Brazil",
        "delivery_time": "30 days after LC",
        "payment_terms_description": "Irrevocable DLC at Sight"
    }
}

try:
    response = requests.post(url, json=data)
    if response.status_code == 200:
        with open("test_spa.pdf", "wb") as f:
            f.write(response.content)
        print("PDF generated successfully: test_spa.pdf")
    else:
        print("Failed to generate PDF:", response.status_code)
        print(response.text)
except Exception as e:
    print("Error:", e)
