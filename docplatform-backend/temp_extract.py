import sys
from seed import LOI_LATEX, FIELDS as LOI_FIELDS
from seed_fco import FCO_LATEX, FIELDS as FCO_FIELDS

SPA_LATEX = r"""\documentclass[a4paper,11pt]{article}
\usepackage[top=3cm,bottom=3cm,left=2.5cm,right=2.5cm]{geometry}
\usepackage{xcolor}
\definecolor{marooncolor}{RGB}{128,0,0}
\usepackage{array}
\usepackage{xeCJK}
\setCJKmainfont{SimSun}
\usepackage{parskip}
\usepackage{graphicx}
\usepackage{lmodern}
\usepackage{enumitem}
\usepackage{helvet}
\usepackage{tabularx}
\renewcommand{\familydefault}{\sfdefault}

\begin{document}

\begin{center}
  {\Large\textbf{\underline{SALES AND PURCHASE AGREEMENT (SPA)}}}
\end{center}

\vspace{0.5cm}

\noindent \textbf{Date:} \VAR{spa_date} \hfill \textbf{Contract No:} \VAR{contract_no}

\vspace{0.8cm}
\begin{center}{\large\textbf{\color{marooncolor}THE PARTIES}}\end{center}
\vspace{0.3cm}

\noindent \textbf{SELLER:} \VAR{seller_company}\\
\textbf{Address:} \VAR{seller_address}\\
\textbf{Represented by:} \VAR{seller_contact}\\
\textbf{Email:} \VAR{seller_email}

\vspace{0.5cm}
\noindent \textbf{BUYER:} \VAR{buyer_company}\\
\textbf{Address:} \VAR{buyer_address}\\
\textbf{Represented by:} \VAR{buyer_contact_person}\\
\textbf{Email:} \VAR{buyer_email}

\vspace{0.8cm}
\begin{center}{\large\textbf{\color{marooncolor}1. PRODUCT AND ORIGIN}}\end{center}
\vspace{0.2cm}
\noindent The Seller agrees to sell and the Buyer agrees to purchase the following commodity: \textbf{\VAR{product_name}}.\\
\textbf{Origin:} \VAR{product_origin}\\
\textbf{Quality/Specification:} As per Annex A (Specification Sheet).

\vspace{0.5cm}
\begin{center}{\large\textbf{\color{marooncolor}2. QUANTITY AND PRICING}}\end{center}
\vspace{0.2cm}
\begin{center}
\begin{tabularx}{\textwidth}{|>{\bfseries\raggedright\arraybackslash}p{5cm}|>{\raggedright\arraybackslash}X|}
\hline
Total Quantity & \VAR{total_quantity} \\ \hline
Contract Price & \VAR{contract_price} \\ \hline
Total Contract Value & \VAR{total_value} \\ \hline
\end{tabularx}
\end{center}

\vspace{0.5cm}
\begin{center}{\large\textbf{\color{marooncolor}3. DELIVERY TERMS}}\end{center}
\vspace{0.2cm}
\noindent \textbf{Terms:} CIF \VAR{destination_port}\\
\textbf{Loading Port:} \VAR{loading_port}\\
\textbf{Delivery Time:} \VAR{delivery_time}

\vspace{0.5cm}
\begin{center}{\large\textbf{\color{marooncolor}4. PAYMENT TERMS}}\end{center}
\vspace{0.2cm}
\noindent \VAR{payment_terms_description}

\vspace{1.5cm}
\begin{center}{\large\textbf{\underline{AUTHORIZED SIGNATURES}}}\end{center}
\vspace{1cm}

\noindent
\begin{tabularx}{\textwidth}{@{}X X@{}}
\textbf{\underline{SELLER}} & \textbf{\underline{BUYER}} \\
\vspace{2cm} & \vspace{2cm} \\
\rule{6cm}{0.4pt} & \rule{6cm}{0.4pt} \\
\textbf{\VAR{seller_contact}} & \textbf{\VAR{buyer_contact_person}} \\
\VAR{seller_company} & \VAR{buyer_company}
\end{tabularx}

\end{document}
"""

SPA_FIELDS = [
    dict(key="spa_date", label="SPA Date", field_type="date", required=True, order=1),
    dict(key="contract_no", label="Contract Number", field_type="text", required=True, order=2, default_value="SPA-2026-001"),
    dict(key="buyer_company", label="Buyer Company Name", field_type="text", required=True, order=3),
    dict(key="buyer_address", label="Buyer Address", field_type="textarea", required=True, order=4),
    dict(key="buyer_contact_person", label="Buyer Contact Person", field_type="text", required=True, order=5),
    dict(key="buyer_email", label="Buyer Email", field_type="text", required=True, order=6),
    dict(key="product_origin", label="Product Origin", field_type="text", required=True, order=7, default_value="Brazil"),
    dict(key="total_quantity", label="Total Quantity", field_type="text", required=True, order=8),
    dict(key="contract_price", label="Contract Price", field_type="text", required=True, order=9),
    dict(key="total_value", label="Total Contract Value", field_type="text", required=True, order=10),
    dict(key="destination_port", label="Destination Port", field_type="text", required=True, order=11),
    dict(key="loading_port", label="Loading Port", field_type="text", required=True, order=12, default_value="Brazil"),
    dict(key="delivery_time", label="Delivery Time", field_type="text", required=True, order=13),
    dict(key="payment_terms_description", label="Payment Terms Description", field_type="textarea", required=True, order=14),
]

ICPO_LATEX = r"""\documentclass[a4paper,11pt]{article}
\usepackage[top=3cm,bottom=3cm,left=2.5cm,right=2.5cm]{geometry}
\usepackage{xcolor}
\definecolor{marooncolor}{RGB}{128,0,0}
\usepackage{array}
\usepackage{xeCJK}
\setCJKmainfont{SimSun}
\usepackage{parskip}
\usepackage{graphicx}
\usepackage{lmodern}
\usepackage{helvet}
\usepackage{tabularx}
\renewcommand{\familydefault}{\sfdefault}

\begin{document}
\begin{center}
  {\Large\textbf{\underline{IRREVOCABLE CORPORATE PURCHASE ORDER (ICPO)}}}
\end{center}

\vspace{0.5cm}
\noindent \textbf{Date:} \VAR{icpo_date} \hfill \textbf{ICPO Ref:} \VAR{icpo_ref}

\vspace{0.5cm}
\noindent \textbf{To: \VAR{seller_company}}

\vspace{0.5cm}
\noindent We, \textbf{\VAR{buyer_company}}, represented by \VAR{buyer_contact_person}, hereby state and represent that it is our intention to purchase, and we hereby confirm that we are ready, willing and able to purchase the following commodity as per the specification and in the quantity and for the price as specified in the terms and conditions as stated below.

\vspace{0.5cm}
\begin{center}
\begin{tabularx}{\textwidth}{|>{\bfseries\raggedright\arraybackslash}p{5cm}|>{\raggedright\arraybackslash}X|}
\hline
Commodity & \VAR{product_name} \\ \hline
Origin & \VAR{product_origin} \\ \hline
Total Quantity & \VAR{total_quantity} \\ \hline
Target Price & \VAR{target_price} \\ \hline
Destination Port & \VAR{destination_port} \\ \hline
Payment Terms & \VAR{payment_terms} \\ \hline
\end{tabularx}
\end{center}

\vspace{1cm}
\begin{center}{\large\textbf{\color{marooncolor}BUYER BANKING DETAILS}}\end{center}
\vspace{0.3cm}
\noindent
\textbf{Bank Name:} \VAR{buyer_bank_name}\\
\textbf{Bank Address:} \VAR{buyer_bank_address}\\
\textbf{Account Name:} \VAR{buyer_account_name}\\
\textbf{Account Number:} \VAR{buyer_account_number}\\
\textbf{SWIFT Code:} \VAR{buyer_swift_code}

\vspace{1.5cm}
\noindent\textbf{For and on behalf of \VAR{buyer_company}}\\
\vspace{1.5cm}\\
\rule{6cm}{0.4pt} \\
\textbf{\VAR{buyer_contact_person}}\\
\textbf{\VAR{buyer_title}}
\end{document}
"""

ICPO_FIELDS = [
    dict(key="icpo_date", label="ICPO Date", field_type="date", required=True, order=1),
    dict(key="icpo_ref", label="ICPO Reference", field_type="text", required=True, order=2, default_value="ICPO-2026-001"),
    dict(key="buyer_company", label="Buyer Company Name", field_type="text", required=True, order=3),
    dict(key="buyer_contact_person", label="Buyer Contact Person", field_type="text", required=True, order=4),
    dict(key="buyer_title", label="Buyer Title", field_type="text", required=True, order=5, default_value="Director"),
    dict(key="product_origin", label="Product Origin", field_type="text", required=True, order=6, default_value="Brazil"),
    dict(key="total_quantity", label="Total Quantity", field_type="text", required=True, order=7),
    dict(key="target_price", label="Target Price", field_type="text", required=True, order=8),
    dict(key="destination_port", label="Destination Port", field_type="text", required=True, order=9),
    dict(key="payment_terms", label="Payment Terms", field_type="text", required=True, order=10),
    dict(key="buyer_bank_name", label="Buyer Bank Name", field_type="text", required=True, order=11),
    dict(key="buyer_bank_address", label="Buyer Bank Address", field_type="text", required=True, order=12),
    dict(key="buyer_account_name", label="Buyer Account Name", field_type="text", required=True, order=13),
    dict(key="buyer_account_number", label="Buyer Account Number", field_type="text", required=True, order=14),
    dict(key="buyer_swift_code", label="Buyer SWIFT Code", field_type="text", required=True, order=15),
]

PI_LATEX = r"""\documentclass[a4paper,11pt]{article}
\usepackage[top=3cm,bottom=3cm,left=2.5cm,right=2.5cm]{geometry}
\usepackage{xcolor}
\definecolor{marooncolor}{RGB}{128,0,0}
\usepackage{array}
\usepackage{xeCJK}
\setCJKmainfont{SimSun}
\usepackage{parskip}
\usepackage{graphicx}
\usepackage{lmodern}
\usepackage{helvet}
\usepackage{tabularx}
\renewcommand{\familydefault}{\sfdefault}

\begin{document}
\begin{center}
  {\Large\textbf{\underline{PROFORMA INVOICE}}}
\end{center}

\vspace{0.5cm}
\noindent \textbf{Date:} \VAR{pi_date} \hfill \textbf{PI No:} \VAR{pi_no}

\vspace{0.5cm}
\noindent
\begin{tabularx}{\textwidth}{@{}X X@{}}
\textbf{SELLER} & \textbf{BUYER} \\
\VAR{seller_company} & \VAR{buyer_company} \\
\VAR{seller_address} & \VAR{buyer_address} \\
Email: \VAR{seller_email} & Email: \VAR{buyer_email}
\end{tabularx}

\vspace{1cm}
\begin{center}
\begin{tabularx}{\textwidth}{|>{\raggedright\arraybackslash}X|c|c|c|}
\hline
\textbf{Description of Goods} & \textbf{Quantity} & \textbf{Unit Price (\VAR{currency})} & \textbf{Total (\VAR{currency})} \\ \hline
\VAR{product_name} & \VAR{quantity} \VAR{unit} & \VAR{unit_price} & \VAR{total_amount} \\ \hline
\multicolumn{3}{|r|}{\textbf{GRAND TOTAL (\VAR{currency})}} & \textbf{\VAR{total_amount}} \\ \hline
\end{tabularx}
\end{center}

\vspace{0.5cm}
\noindent
\textbf{Delivery Terms:} \VAR{delivery_terms}\\
\textbf{Loading Port:} \VAR{loading_port}\\
\textbf{Destination Port:} \VAR{destination_port}\\
\textbf{Payment Terms:} \VAR{payment_terms}

\vspace{0.8cm}
\begin{center}{\large\textbf{\color{marooncolor}SELLER BANKING DETAILS}}\end{center}
\vspace{0.2cm}
\noindent
\textbf{Bank Name:} \VAR{seller_bank_name}\\
\textbf{Bank Address:} \VAR{seller_bank_address}\\
\textbf{Account Name:} \VAR{seller_account_name}\\
\textbf{Account Number:} \VAR{seller_account_number}\\
\textbf{IBAN:} \VAR{seller_iban}\\
\textbf{SWIFT Code:} \VAR{seller_swift}

\vspace{1.5cm}
\noindent\textbf{For and on behalf of \VAR{seller_company}}\\
\vspace{1.5cm}\\
\rule{6cm}{0.4pt} \\
\textbf{\VAR{seller_contact}}
\end{document}
"""

PI_FIELDS = [
    dict(key="pi_date", label="PI Date", field_type="date", required=True, order=1),
    dict(key="pi_no", label="PI Number", field_type="text", required=True, order=2, default_value="PI-2026-001"),
    dict(key="buyer_company", label="Buyer Company Name", field_type="text", required=True, order=3),
    dict(key="buyer_address", label="Buyer Address", field_type="textarea", required=True, order=4),
    dict(key="buyer_email", label="Buyer Email", field_type="text", required=True, order=5),
    dict(key="currency", label="Currency", field_type="text", required=True, order=6, default_value="USD"),
    dict(key="quantity", label="Quantity", field_type="number", required=True, order=7),
    dict(key="unit_price", label="Unit Price", field_type="text", required=True, order=8),
    dict(key="total_amount", label="Total Amount", field_type="text", required=True, order=9),
    dict(key="delivery_terms", label="Delivery Terms", field_type="text", required=True, order=10, default_value="CIF"),
    dict(key="loading_port", label="Loading Port", field_type="text", required=True, order=11, default_value="Brazil"),
    dict(key="destination_port", label="Destination Port", field_type="text", required=True, order=12),
    dict(key="payment_terms", label="Payment Terms", field_type="text", required=True, order=13),
]

PL_LATEX = r"""\documentclass[a4paper,11pt]{article}
\usepackage[top=3cm,bottom=3cm,left=2.5cm,right=2.5cm]{geometry}
\usepackage{xcolor}
\definecolor{marooncolor}{RGB}{128,0,0}
\usepackage{array}
\usepackage{xeCJK}
\setCJKmainfont{SimSun}
\usepackage{parskip}
\usepackage{graphicx}
\usepackage{lmodern}
\usepackage{helvet}
\usepackage{tabularx}
\renewcommand{\familydefault}{\sfdefault}

\begin{document}
\begin{center}
  {\Large\textbf{\underline{PACKING LIST}}}
\end{center}

\vspace{0.5cm}
\noindent \textbf{Date:} \VAR{pl_date} \hfill \textbf{Invoice No:} \VAR{invoice_no}

\vspace{0.5cm}
\noindent
\begin{tabularx}{\textwidth}{@{}X X@{}}
\textbf{SHIPPER / EXPORTER} & \textbf{CONSIGNEE} \\
\VAR{seller_company} & \VAR{buyer_company} \\
\VAR{seller_address} & \VAR{buyer_address} 
\end{tabularx}

\vspace{1cm}
\begin{center}
\begin{tabularx}{\textwidth}{|>{\raggedright\arraybackslash}X|c|c|c|}
\hline
\textbf{Description of Goods} & \textbf{No. of Cartons} & \textbf{Net Weight (\VAR{unit})} & \textbf{Gross Weight (\VAR{unit})} \\ \hline
\VAR{product_name} & \VAR{cartons} & \VAR{net_weight} & \VAR{gross_weight} \\ \hline
\multicolumn{1}{|r|}{\textbf{TOTAL}} & \textbf{\VAR{cartons}} & \textbf{\VAR{net_weight}} & \textbf{\VAR{gross_weight}} \\ \hline
\end{tabularx}
\end{center}

\vspace{0.5cm}
\noindent
\textbf{Vessel / Voyage No:} \VAR{vessel_name}\\
\textbf{Port of Loading:} \VAR{loading_port}\\
\textbf{Port of Discharge:} \VAR{destination_port}\\
\textbf{Container Number(s):} \VAR{container_numbers}

\vspace{1.5cm}
\noindent\textbf{For and on behalf of \VAR{seller_company}}\\
\vspace{1.5cm}\\
\rule{6cm}{0.4pt} \\
\textbf{Authorized Signature}
\end{document}
"""

PL_FIELDS = [
    dict(key="pl_date", label="Date", field_type="date", required=True, order=1),
    dict(key="invoice_no", label="Invoice Number", field_type="text", required=True, order=2),
    dict(key="buyer_company", label="Buyer Company Name", field_type="text", required=True, order=3),
    dict(key="buyer_address", label="Buyer Address", field_type="textarea", required=True, order=4),
    dict(key="cartons", label="Number of Cartons", field_type="text", required=True, order=5),
    dict(key="net_weight", label="Net Weight", field_type="text", required=True, order=6),
    dict(key="gross_weight", label="Gross Weight", field_type="text", required=True, order=7),
    dict(key="vessel_name", label="Vessel / Voyage No", field_type="text", required=True, order=8),
    dict(key="loading_port", label="Port of Loading", field_type="text", required=True, order=9),
    dict(key="destination_port", label="Port of Discharge", field_type="text", required=True, order=10),
    dict(key="container_numbers", label="Container Numbers", field_type="textarea", required=True, order=11),
]

SPEC_LATEX = r"""\documentclass[a4paper,11pt]{article}
\usepackage[top=3cm,bottom=3cm,left=2.5cm,right=2.5cm]{geometry}
\usepackage{xcolor}
\definecolor{marooncolor}{RGB}{128,0,0}
\usepackage{array}
\usepackage{xeCJK}
\setCJKmainfont{SimSun}
\usepackage{parskip}
\usepackage{graphicx}
\usepackage{lmodern}
\usepackage{helvet}
\usepackage{tabularx}
\renewcommand{\familydefault}{\sfdefault}

\begin{document}
\begin{center}
  {\Large\textbf{\underline{PRODUCT SPECIFICATION SHEET}}}
\end{center}

\vspace{0.8cm}
\begin{center}
\begin{tabularx}{\textwidth}{|>{\bfseries\raggedright\arraybackslash}p{6cm}|>{\raggedright\arraybackslash}X|}
\hline
\multicolumn{2}{|c|}{\cellcolor{lightgray}\textbf{GENERAL INFORMATION}} \\ \hline
Product Name & \VAR{product_name} \\ \hline
Grade & \VAR{spec_grade} \\ \hline
Origin & \VAR{spec_origin} \\ \hline
Certification & \VAR{spec_certification} \\ \hline

\multicolumn{2}{|c|}{\cellcolor{lightgray}\textbf{PHYSICAL CHARACTERISTICS}} \\ \hline
Appearance & \VAR{spec_appearance} \\ \hline
Odor & \VAR{spec_odor} \\ \hline
Moisture Content & \VAR{spec_moisture} \\ \hline
Broken Bones & \VAR{spec_bones} \\ \hline
Weight per Piece & \VAR{spec_weight_per_piece} \\ \hline
Length per Piece & \VAR{spec_length_per_piece} \\ \hline

\multicolumn{2}{|c|}{\cellcolor{lightgray}\textbf{PACKAGING \& STORAGE}} \\ \hline
Processing Method & \VAR{spec_processing} \\ \hline
Packaging Details & \VAR{spec_packaging} \\ \hline
Carton Weight & \VAR{spec_carton_weight} \\ \hline
Freezing Temperature & \VAR{spec_freezing_temp} \\ \hline
Storage Temperature & \VAR{spec_storage_temp} \\ \hline
Transportation Temperature & \VAR{spec_transport_temp} \\ \hline
Shelf Life & \VAR{spec_shelf_life} \\ \hline
\end{tabularx}
\end{center}

\vspace{1.5cm}
\noindent\textbf{Issued by: \VAR{seller_company}}\\
\noindent\textbf{Date:} \VAR{spec_date}
\end{document}
"""

SPEC_FIELDS = [
    dict(key="spec_date", label="Date", field_type="date", required=True, order=1),
    dict(key="spec_grade", label="Grade", field_type="text", required=True, order=2, default_value="Grade A"),
    dict(key="spec_origin", label="Origin", field_type="text", required=True, order=3, default_value="Brazil"),
    dict(key="spec_certification", label="Certification", field_type="text", required=True, order=4, default_value="SIF Approved, Halal"),
    dict(key="spec_appearance", label="Appearance", field_type="text", required=True, order=5, default_value="Clean, no yellow skin, no feathers"),
    dict(key="spec_odor", label="Odor", field_type="text", required=True, order=6, default_value="No bad smell"),
    dict(key="spec_moisture", label="Moisture Content", field_type="text", required=True, order=7, default_value="Less than 3%"),
    dict(key="spec_bones", label="Broken Bones", field_type="text", required=True, order=8, default_value="Less than 2%"),
    dict(key="spec_weight_per_piece", label="Weight per Piece", field_type="text", required=True, order=9, default_value="35g - 45g+"),
    dict(key="spec_length_per_piece", label="Length per Piece", field_type="text", required=True, order=10, default_value="10cm - 15cm"),
    dict(key="spec_processing", label="Processing Method", field_type="text", required=True, order=11, default_value="IQF"),
    dict(key="spec_packaging", label="Packaging Details", field_type="textarea", required=True, order=12, default_value="10kg - 15kg carton boxes"),
    dict(key="spec_carton_weight", label="Carton Weight", field_type="text", required=True, order=13, default_value="10kg Net Weight"),
    dict(key="spec_freezing_temp", label="Freezing Temperature", field_type="text", required=True, order=14, default_value="Blasted at -40°C"),
    dict(key="spec_storage_temp", label="Storage Temperature", field_type="text", required=True, order=15, default_value="-18°C"),
    dict(key="spec_transport_temp", label="Transportation Temperature", field_type="text", required=True, order=16, default_value="-18°C"),
    dict(key="spec_shelf_life", label="Shelf Life", field_type="text", required=True, order=17, default_value="12-24 Months"),
]

with open('seed_master_templates.py', 'w', encoding='utf-8') as out:
    out.write('\"\"\"Master LaTeX templates and field definitions for all document types.\"\"\"\n\n')
    
    out.write('FCO_LATEX = ' + repr(FCO_LATEX) + '\n\n')
    out.write('FCO_FIELDS = ' + repr(FCO_FIELDS) + '\n\n')
    
    out.write('LOI_LATEX = ' + repr(LOI_LATEX) + '\n\n')
    out.write('LOI_FIELDS = ' + repr(LOI_FIELDS) + '\n\n')
    
    out.write('SPA_LATEX = ' + repr(SPA_LATEX) + '\n\n')
    out.write('SPA_FIELDS = ' + repr(SPA_FIELDS) + '\n\n')

    out.write('ICPO_LATEX = ' + repr(ICPO_LATEX) + '\n\n')
    out.write('ICPO_FIELDS = ' + repr(ICPO_FIELDS) + '\n\n')

    out.write('PI_LATEX = ' + repr(PI_LATEX) + '\n\n')
    out.write('PI_FIELDS = ' + repr(PI_FIELDS) + '\n\n')

    out.write('PL_LATEX = ' + repr(PL_LATEX) + '\n\n')
    out.write('PL_FIELDS = ' + repr(PL_FIELDS) + '\n\n')

    out.write('SPEC_LATEX = ' + repr(SPEC_LATEX) + '\n\n')
    out.write('SPEC_FIELDS = ' + repr(SPEC_FIELDS) + '\n\n')

    out.write('''
MASTER_TEMPLATES = {
    "FCO": {"latex": FCO_LATEX, "fields": FCO_FIELDS},
    "LOI": {"latex": LOI_LATEX, "fields": LOI_FIELDS},
    "SPA": {"latex": SPA_LATEX, "fields": SPA_FIELDS},
    "ICPO": {"latex": ICPO_LATEX, "fields": ICPO_FIELDS},
    "PI": {"latex": PI_LATEX, "fields": PI_FIELDS},
    "PL": {"latex": PL_LATEX, "fields": PL_FIELDS},
    "SPEC": {"latex": SPEC_LATEX, "fields": SPEC_FIELDS},
}
''')
