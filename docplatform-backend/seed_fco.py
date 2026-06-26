"""
Seed FCO (Full Corporate Offer) template for Ronsons Trading FZ-LLC.
Creates Company, Product, DocumentType, Template, TemplateVersion, and DocumentSchema.
Run:  .venv\Scripts\python.exe seed_fco.py
"""
import asyncio
from app.database import AsyncSessionLocal, engine
from app.models import (
    Base, Company, Product, DocumentType, Template, TemplateVersion,
    DocumentSchema, SchemaField,
)

# ---------------------------------------------------------------------------
# LaTeX / Jinja2 FCO template (7 pages, professional layout)
# ---------------------------------------------------------------------------
FCO_LATEX = r"""
\documentclass[a4paper,11pt]{article}
\usepackage[top=3.5cm,bottom=3.8cm,left=2cm,right=2cm]{geometry}
\usepackage{xcolor}
\usepackage{array}
\usepackage{fancyhdr}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{parskip}
\usepackage{graphicx}
\usepackage{lmodern}
\usepackage{enumitem}
\usepackage{multirow}
\usepackage{helvet}
\usepackage{eso-pic}
\renewcommand{\familydefault}{\sfdefault}

\definecolor{goldcolor}{RGB}{180,140,50}
\definecolor{marooncolor}{RGB}{110,25,25}

\AddToShipoutPictureBG{%
  \AtPageUpperLeft{%
    \raisebox{-90pt}{%
      \includegraphics[width=\paperwidth,height=90pt,keepaspectratio=false]{header_logo.jpg}%
    }%
  }%
}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\setlength{\headheight}{90pt}
\setlength{\headsep}{6pt}
\setlength{\topmargin}{-72pt}
\setlength{\voffset}{0pt}

\fancyhead[C]{}

\fancyfoot[L]{%
  \footnotesize
  Address : Compass Building, Al Shohada Road, Al Hamara,\\
  Industrial Zone-FZ, Ras Al Khaimah, United Arab Emirates%
}
\fancyfoot[R]{%
  \footnotesize
  Website: www.ronsonstrading.com\\
  Email: ceo@ronsonstrading.com\\
  Tele: +1-604-613-2109%
}
\fancyfoot[C]{\footnotesize\thepage}
\renewcommand{\footrule}{{\color{marooncolor}\hrule width\headwidth height 0.8pt}\vskip 3pt}
\renewcommand{\footrulewidth}{0.8pt}

\begin{document}
\setlength{\parindent}{0pt}

\begin{center}
  {\Large\textbf{\underline{FULL CORPORATE OFFER FOR \VAR{product_name}}}}
\end{center}

\vspace{0.3cm}

\noindent\textbf{Date: \VAR{fco_date}} \hfill \textbf{\VAR{reference_no}}

\vspace{0.5cm}

\noindent\textbf{To}

\vspace{0.2cm}

\noindent\textbf{Company Name:} \VAR{buyer_company}\\
\textbf{Address:} \VAR{buyer_address}\\
\textbf{Website:} \VAR{buyer_website}\\
\textbf{Email:} \VAR{buyer_email}\\
\textbf{Phone Number:} \VAR{buyer_phone}

\vspace{0.4cm}

\noindent\textbf{Dear Sir,}

\vspace{0.3cm}

\noindent We, \textbf{\VAR{seller_company}}, hereby formally confirm our intent and capability to supply \textbf{\VAR{product_name}}. We affirm that our company is fully prepared, willing, and able to sell the product strictly in accordance with the specifications, quantities, pricing, and commercial terms outlined in this \textbf{Full Corporate Offer (FCO).} This declaration is issued with full corporate authority and complete responsibility on behalf of our company.

\vspace{0.4cm}

\begin{center}{\large\textbf{\color{marooncolor}QUANTITY \& PRICING FOR TRIAL SHIPMENT}}\end{center}
\vspace{0.1cm}
\begin{center}
\begin{tabular}{|>{\bfseries}p{5.5cm}|p{9.5cm}|}
\hline
Trial Container & \VAR{trial_container} \\ \hline
Price & \VAR{trial_price} \\ \hline
Trial Shipment Value & \VAR{trial_shipment_value} \\ \hline
Trial Quantity in MT & \VAR{trial_quantity_mt} \\ \hline
Loading Capacity & \VAR{loading_capacity} \\ \hline
Loading Port & \VAR{loading_port} \\ \hline
Destination Port & \VAR{destination_port} \\ \hline
Delivery Time & \VAR{delivery_time} \\ \hline
\end{tabular}
\end{center}

\vspace{0.3cm}

\begin{center}{\large\textbf{\color{marooncolor}QUANITY \& PRICING FOR YEARLY CONTRACT SHIPMENT}}\end{center}
\vspace{0.1cm}
\begin{center}
\begin{tabular}{|>{\bfseries}p{5.5cm}|p{9.5cm}|}
\hline
Quantity & \VAR{contract_quantity} \\ \hline
Price & \VAR{contract_price} \\ \hline
Monthly Shipment Value & \VAR{monthly_shipment_value} \\ \hline
Annual Contract Value & \VAR{annual_contract_value} \\ \hline
Contract Duration & \VAR{contract_duration} \\ \hline
Loading Capacity & \VAR{contract_loading_capacity} \\ \hline
Annual Contract Quantity & \VAR{annual_contract_quantity} \\ \hline
Loading Port & \VAR{contract_loading_port} \\ \hline
Destination Port & \VAR{contract_destination_port} \\ \hline
Delivery Time & \VAR{contract_delivery_time} \\ \hline
\end{tabular}
\end{center}

\newpage

\begin{center}{\large\textbf{\color{marooncolor}PRODUCT SPECIFICATION}}\end{center}
\vspace{0.1cm}
\begin{center}
\begin{tabular}{|>{\bfseries}p{5cm}|p{10cm}|}
\hline
\multicolumn{1}{|>{\bfseries\centering\arraybackslash}p{5cm}|}{CATEGORY} & \multicolumn{1}{>{\bfseries\centering\arraybackslash}p{10cm}|}{SPECIFICATION} \\ \hline
Product Name & \VAR{product_name} \\ \hline
Grade & \VAR{spec_grade} \\ \hline
Origin & \VAR{spec_origin} \\ \hline
Origin / Certification & \VAR{spec_certification} \\ \hline
Processing & \VAR{spec_processing} \\ \hline
Appearance & \VAR{spec_appearance} \\ \hline
Odor & \VAR{spec_odor} \\ \hline
Bones & \VAR{spec_bones} \\ \hline
Blood / Blood Stains & \VAR{spec_blood_stains} \\ \hline
Moisture Content & \VAR{spec_moisture} \\ \hline
Damage & \VAR{spec_damage} \\ \hline
Chicken Paw Pad & \VAR{spec_paw_pad} \\ \hline
Weight per Piece & \VAR{spec_weight_per_piece} \\ \hline
Length per Piece & \VAR{spec_length_per_piece} \\ \hline
Packaging & \VAR{spec_packaging} \\ \hline
Inner Packing & \VAR{spec_inner_packing} \\ \hline
Carton Weight & \VAR{spec_carton_weight} \\ \hline
Freezing Temperature & \VAR{spec_freezing_temp} \\ \hline
Storage Temperature & \VAR{spec_storage_temp} \\ \hline
Transportation Temperature & \VAR{spec_transport_temp} \\ \hline
Freezing Process & \VAR{spec_freezing_process} \\ \hline
Shelf Life & \VAR{spec_shelf_life} \\ \hline
Packaging & \VAR{spec_packaging_note} \\ \hline
\end{tabular}
\end{center}

\vspace{0.3cm}

\begin{center}{\large\textbf{\color{marooncolor}PRODUCT DISCHARGE}}\end{center}
\vspace{0.1cm}
\begin{itemize}[leftmargin=1.5em, itemsep=2pt, topsep=2pt]
\item The shipment shall begin within 15-20 days after receipt and confirmation of the payment instrument in seller's Bank, after the contract is signed.
\item The Date of bill of Lading shall be considered the date of delivery.
\item Seller is responsible for all supervision, fees and/ or levies at the port of loading.
\item Not later than 72 hours from the completion of loading, the seller's agent shall email the buyer and inform the vessel's sailing date and the expected time of arrival at the port of destination.
\item All port of loading charges are for the account of the seller and all port of discharge charges are for the account of the buyer.
\end{itemize}

\newpage

\begin{center}
  {\large\textbf{\color{marooncolor}COMMERCIAL TERMS}}\\[4pt]
  {\small\color{marooncolor}(This is our basis payment terms but still it should be editable)}
\end{center}
\vspace{0.2cm}

\begin{center}{\large\textbf{\color{marooncolor}TRIAL SHIPMENT}}\end{center}
\vspace{0.1cm}
\noindent The Buyer will provide irrevocable, operative, and transferable DLC (MT700) for trial containers. The Buyer shall make 100\% payment at the loading port against presentation of shipping documents via TT (MT 103). The Seller shall ship the goods as per the agreed Proforma Invoice and, upon completion of loading at the port of shipment, present copies of the shipping documents, including but not limited to the Bill of Lading, Commercial Invoice, Packing List, Health Certificate, and other required export documents, to the Buyer. Full payment shall be remitted by the Buyer immediately upon confirmation of loading and presentation of documents. Release of the original shipping documents shall be made only after receipt of 100\% payment through normal banking channels via TT (MT103).

\vspace{0.3cm}
\begin{center}{\large\textbf{\color{marooncolor}MONTHLY SHIPMENT}}\end{center}
\vspace{0.1cm}
\noindent Buyer will open an irrevocable, operative, and transferable DLC (MT700) for the value of one month shipment quantity against the proforma invoice \& SPA, issued and confirmed by world top 100 Banks valid for 365 + 1 days (or 180 days x 2 subject to the issuing bank's rule). Upon completion of loading and issuance of the Bill of Lading, the Seller shall provide copies of the commercial invoice, Bill of Lading, Packing List, and other relevant shipping documents to the Buyer. The Buyer shall remit 100\% payment immediately upon confirmation of the above mentioned shipping documents. Payment shall be effected via MT103 / TT bank-to-bank SWIFT transfer. Release of the original Bill of Lading and full set of original shipping documents shall be made only after confirmation of full payment through normal banking channels.

\vspace{0.3cm}
\begin{center}{\large\textbf{\color{marooncolor}PAYMENT VIA TELEGRAPHIC TRANSFER (TT/MT103)}}\end{center}
\vspace{0.1cm}
\noindent The Buyer shall effect payment for shipments by way of Telegraphic Transfer (TT/MT103) upon receipt of confirmation from the Seller's nominated bank via SWIFT that the original shipping documents have been duly submitted and are held in custody by the bank. The Seller shall, prior to such confirmation, provide the Buyer with scanned/digital copies of all relevant shipping documents for advance review and verification. The Buyer will still be providing DLC MT700 as a security financial instrument for contract shipment.

\vspace{0.3cm}
\begin{center}{\large\textbf{\color{marooncolor}DOCUMENTARY LETTER OF CREDIT (DLC/MT700)}}\end{center}
\vspace{0.1cm}
\noindent The DLC (MT700) shall serve as a supporting financial instrument for the purpose of providing transactional assurance and security to both parties. For the avoidance of doubt, the DLC shall not constitute the primary mode of payment. Actual settlement for each shipment shall be effected exclusively via TT/MT103.

\vspace{0.3cm}
\begin{center}{\large\textbf{\color{marooncolor}TELEX RELEASE}}\end{center}
\vspace{0.1cm}
\noindent The Seller shall arrange telex release of the cargo upon receipt of full payment, unless otherwise mutually agreed.

\newpage

\begin{center}{\large\textbf{\underline{\color{marooncolor}PRODUCT DOCUMENTATION}}}\end{center}
\vspace{0.2cm}
\noindent A full set of the following documents which will be legitimate for shipment from Brazil will be presented.
\vspace{0.1cm}
\begin{itemize}[leftmargin=1.5em, itemsep=3pt, topsep=2pt]
\item Full set of clean on -- board marine bill of lading made out to order and blank endorsed, 1/3 clearly marked `Freight Prepaid'' in 1 original
\item Commercial Invoice issued by the seller indicating the contract number, DLC/SBLC number, Description of the goods, gross / net weights of the goods in 1 Original.
\item Packaging list 1 originals showing contract no., seal no., container no., gross / net weight, B/L no., date. Quantity loaded and loading port.
\item Certificate of origin issued by the relevant authority of the country of origin of Brazil in 1 original
\item Certificate of Quality and quantity issued by CCIC Brazil, 1 original
\item Veterinary health certificate issued by veterinary office for the record of China entry- Exit inspection and quarantine in 1 originals
\item Insurance policy/ certificate in 1 original for 110\% of the invoice value, covering ocean marine transportation all risk.
\item Commodity bilingual English- Chinese label samples in 1 original.
\item Slaughterhouse SIF certificate in 1 copy
\item Export / shipper certificate of GACC Registration in 1 Copy
\item HALAL certificate in 1 original
\end{itemize}

\vspace{0.3cm}
\begin{center}
  {\large\textbf{\color{marooncolor}PROCEDURES}}\\[4pt]
  {\small\color{marooncolor}(This is our basis procedure but still it should be editable)}
\end{center}
\vspace{0.1cm}
\begin{itemize}[leftmargin=1.5em, itemsep=3pt, topsep=2pt]
\item The Buyer issues the \textbf{LOI (Letter of Intent)} to the Seller.
\item The Seller issues the \textbf{FCO (Full Corporate Offer)} to the Buyer.
\item Upon acceptance, the Buyer signs, seals, and returns the FCO.
\item The Buyer issues the \textbf{ICPO (Irrevocable Corporate Purchase Order).}
\item The Seller issues the \textbf{SPA (Sales and Purchase Agreement).}
\item The Buyer provides \textbf{POF (Proof of Funds)} by \textbf{BCL (Bank Comfort Letter).}
\item Upon signing and sealing of the SPA, the Seller issues the Proforma Invoice (PI).
\item The Buyer's bank issues an irrevocable, operative, and transferable \textbf{DLC (MT700),} covering the agreed shipment quantity in accordance with the SPA and payment terms. The DLC shall be issued and confirmed by a Top 100 World Bank and remain valid as per agreed contract terms.
\item The Seller arranges inspection for quality and quantity through CCIC Brazil at the Seller's expense, completes loading, and prepares the shipping documents.
\item Upon completion of loading and issuance of the Bill of Lading, the Seller provides copies of shipping documents to the Buyer, including but not limited to the Bill of Lading, Commercial Invoice, Packing List, Health Certificate, and other relevant export documents.
\item The Buyer remits 100\% payment immediately upon confirmation of loading and presentation of shipping documents via TT / MT103 bank-to-bank SWIFT transfer.
\item Release of the original Bill of Lading and full set of original shipping documents shall be made only after confirmation of 100\% payment through normal banking channels.
\item The Seller permits the Buyer or the Buyer's appointed representative to witness the loading process at the loading warehouse, at the Buyer's expense.
\item The Buyer shall be responsible for customs clearance, unloading at destination, and any penalties arising from delayed unloading. The Buyer shall notify the Seller in writing of the appointed clearing agent details at the time of payment confirmation.
\end{itemize}

\newpage

\noindent
\begin{tabular}{|>{\bfseries}p{3cm}|p{5.2cm}|>{\bfseries}p{3cm}|p{4.2cm}|}
\hline
\multicolumn{2}{|>{\centering\arraybackslash}p{7.5cm}|}{\textbf{\color{marooncolor}SELLER DETAILS}} & \multicolumn{2}{>{\centering\arraybackslash}p{7.3cm}|}{\textbf{\color{marooncolor}SELLER BANKING DETAILS}} \\
\hline
Company Name & Ronsons Trading FZ-LLC & Bank Name & MASHREQ \\ \hline
Address & Compass Building, Al Shohada Road, Al Hamara, Industrial Zone-FZ, Ras Al Khaimah, United Arab Emirates & Address & Beside Al Hooth Hypermarket, Al Muntasir RD, Al Nakheel, Ras Al Khaimah, United Arab Emirates \\ \hline
Contact Person & Mr. Hirdey Batth & Account Name & RONSONS TRADING FZ-LLC. \\ \hline
Email & ceo@ronsonstrading.com & Account Number & 019101772389 \\ \hline
Website & www.ronsonstrading.com & IBAN & AE380330000019101772389 \\ \hline
WhatsApp & +1 (604) 613-2109 \newline +971 50 838 0262 & Swift Code & BOMLAEAD \\ \hline
\end{tabular}

\vspace{0.6cm}

\begin{center}{\large\textbf{\underline{\color{marooncolor}BUYER COMPANY INFORMATION}}}\end{center}
\vspace{0.1cm}
\begin{center}
\begin{tabular}{|>{\bfseries}p{4cm}|p{11cm}|}
\hline
Company Name & \VAR{buyer_company} \\ \hline
Address & \VAR{buyer_address} \\ \hline
Contact Person & \VAR{buyer_contact_person} \\ \hline
Email Address & \VAR{buyer_email} \\ \hline
Country & \VAR{buyer_country} \\ \hline
Phone No. & \VAR{buyer_phone} \\ \hline
\end{tabular}
\end{center}

\newpage

\begin{center}{\large\textbf{\underline{\color{marooncolor}BUYER BANK INFORMATION}}}\end{center}
\vspace{0.2cm}
\begin{center}
\begin{tabular}{|>{\bfseries}p{4cm}|p{11cm}|}
\hline
Bank Name & \VAR{buyer_bank_name} \\ \hline
Bank Address & \VAR{buyer_bank_address} \\ \hline
Bank Swift Code & \VAR{buyer_bank_swift} \\ \hline
Account Name & \VAR{buyer_account_name} \\ \hline
Account Number & \VAR{buyer_account_number} \\ \hline
Bank Officer/Email & \VAR{buyer_bank_officer_email} \\ \hline
\end{tabular}
\end{center}

\vspace{0.5cm}

\noindent\textbf{Bank Charges:} All banking Charges from Buyer's Bank shall be borne by the buyer, and all banking charges incurred at Seller's Financier's Bank will be borne by the Seller Financier's.

\vspace{0.3cm}

\noindent\textbf{Note:} No contact with the Seller's or Buyer's bank(s) shall be made without the explicit written permission of the Seller or Buyer. In the event that an alternate bank account is to be used, the Seller and Buyer shall notify each other in writing of the new bank coordinates. Both parties are required to inform each other in advance before forwarding any financial instructions or correspondence to the bank.

\vspace{0.3cm}

\noindent\textbf{Please Note:} A final SPA will be signed between end seller and \textbf{\VAR{buyer_company}} once this FCO is accepted, signed and sealed by the buyer.

\vspace{0.4cm}

\noindent\textbf{VALIDITY OF OFFER}\\
This FCO remains valid until \textbf{\VAR{validity}}

\newpage

\begin{center}{\large\textbf{\underline{AUTHORIZED SIGNATURES}}}\end{center}
\vspace{0.8cm}

\noindent\textbf{\underline{FOR AND ON BEHALF OF \VAR{seller_company} (SELLER)}}

\vspace{0.6cm}

\noindent\includegraphics[width=6cm,keepaspectratio]{signature_stamp.png}\\[4pt]
\rule{7cm}{0.4pt}\\[4pt]
\textbf{\VAR{signatory_name}}\\
\textbf{\VAR{signatory_title}}\\
\textbf{Date: \VAR{signing_date}}

\vspace{2.5cm}

\noindent\textbf{\underline{FOR AND ON BEHALF OF \VAR{buyer_company} (BUYER)}}

\vspace{2.5cm}

\noindent\rule{7cm}{0.4pt}\\[4pt]
\textbf{Mr.}\\
\textbf{Title}\\
\textbf{Date:}

\end{document}
"""

# ---------------------------------------------------------------------------
# Schema fields for the dynamic form
# ---------------------------------------------------------------------------
FIELDS = [
    # Reference & Date
    dict(key="reference_no", label="FCO Reference No.", field_type="text", required=True, order=1, default_value="RT/FCO/2025/001"),
    dict(key="fco_date", label="FCO Date", field_type="date", required=True, order=2),

    # Buyer Information
    dict(key="buyer_company", label="Buyer Company Name", field_type="text", required=True, order=3),
    dict(key="buyer_address", label="Buyer Address", field_type="textarea", required=True, order=4),
    dict(key="buyer_website", label="Buyer Website", field_type="text", required=False, order=5),
    dict(key="buyer_email", label="Buyer Email", field_type="text", required=False, order=6),
    dict(key="buyer_phone", label="Buyer Phone Number", field_type="text", required=False, order=7),
    dict(key="buyer_country", label="Buyer Country", field_type="text", required=True, order=8),
    dict(key="buyer_contact_person", label="Buyer Contact Person", field_type="text", required=True, order=9),

    # Trial Shipment
    dict(key="trial_container", label="Trial Container Quantity", field_type="text", required=True, order=10, default_value="10 Containers"),
    dict(key="trial_price", label="Trial Price", field_type="text", required=True, order=11, default_value="USD 1,350 Per MT CIF"),
    dict(key="trial_shipment_value", label="Trial Shipment Value", field_type="text", required=True, order=12, default_value="USD 364,500"),
    dict(key="trial_quantity_mt", label="Trial Quantity in MT", field_type="text", required=True, order=13, default_value="270 MT"),
    dict(key="loading_capacity", label="Loading Capacity (Trial)", field_type="text", required=True, order=14, default_value="27 MT per 40ft Reefer"),
    dict(key="loading_port", label="Loading Port", field_type="text", required=True, order=15, default_value="Brazil"),
    dict(key="destination_port", label="Destination Port", field_type="text", required=True, order=16),
    dict(key="delivery_time", label="Delivery Time", field_type="text", required=True, order=17, default_value="30-45 Days"),

    # Yearly Contract Shipment
    dict(key="contract_quantity", label="Contract Quantity (Monthly)", field_type="text", required=True, order=18, default_value="100 Containers"),
    dict(key="contract_price", label="Contract Price", field_type="text", required=True, order=19, default_value="USD 1,300 Per MT CIF"),
    dict(key="monthly_shipment_value", label="Monthly Shipment Value", field_type="text", required=True, order=20, default_value="USD 3,510,000"),
    dict(key="annual_contract_value", label="Annual Contract Value", field_type="text", required=True, order=21, default_value="USD 42,120,000"),
    dict(key="contract_duration", label="Contract Duration", field_type="text", required=True, order=22, default_value="12 Months"),
    dict(key="contract_loading_capacity", label="Loading Capacity (Contract)", field_type="text", required=True, order=23, default_value="27 MT per 40ft Reefer"),
    dict(key="annual_contract_quantity", label="Annual Contract Quantity", field_type="text", required=True, order=24, default_value="32,400 MT"),
    dict(key="contract_loading_port", label="Contract Loading Port", field_type="text", required=True, order=25, default_value="Brazil"),
    dict(key="contract_destination_port", label="Contract Destination Port", field_type="text", required=True, order=26),
    dict(key="contract_delivery_time", label="Contract Delivery Time", field_type="text", required=True, order=27, default_value="Monthly Shipments"),

    # Product Specification
    dict(key="spec_grade", label="Grade", field_type="text", required=True, order=28, default_value="Grade A"),
    dict(key="spec_origin", label="Origin", field_type="text", required=True, order=29, default_value="Brazil"),
    dict(key="spec_certification", label="Origin / Certification", field_type="text", required=True, order=30, default_value="SIF Approved, Halal"),
    dict(key="spec_processing", label="Processing", field_type="text", required=True, order=31, default_value="IQF (Individually Quick Frozen)"),
    dict(key="spec_appearance", label="Appearance", field_type="text", required=True, order=32, default_value="Clean, no yellow skin, no feathers, no black pads or ammonia burns"),
    dict(key="spec_odor", label="Odor", field_type="text", required=True, order=33, default_value="No bad smell"),
    dict(key="spec_bones", label="Bones", field_type="text", required=True, order=34, default_value="Less than 2% broken bones"),
    dict(key="spec_blood_stains", label="Blood / Blood Stains", field_type="text", required=True, order=35, default_value="Washed and clean, no blood stains"),
    dict(key="spec_moisture", label="Moisture Content", field_type="text", required=True, order=36, default_value="Less than 3%"),
    dict(key="spec_damage", label="Damage", field_type="text", required=True, order=37, default_value="No bruises, no black flaws"),
    dict(key="spec_paw_pad", label="Chicken Paw Pad", field_type="text", required=True, order=38, default_value="Retained and undamaged"),
    dict(key="spec_weight_per_piece", label="Weight per Piece", field_type="text", required=True, order=39, default_value="35g - 45g+"),
    dict(key="spec_length_per_piece", label="Length per Piece", field_type="text", required=True, order=40, default_value="10cm - 15cm"),
    dict(key="spec_packaging", label="Packaging", field_type="text", required=True, order=41, default_value="10kg - 15kg or 20kg carton boxes"),
    dict(key="spec_inner_packing", label="Inner Packing", field_type="text", required=True, order=42, default_value="2x 5kg polybags per 10kg carton"),
    dict(key="spec_carton_weight", label="Carton Weight", field_type="text", required=True, order=43, default_value="10kg Net Weight"),
    dict(key="spec_freezing_temp", label="Freezing Temperature", field_type="text", required=True, order=44, default_value="Blasted at -40°C"),
    dict(key="spec_storage_temp", label="Storage Temperature", field_type="text", required=True, order=45, default_value="-18°C"),
    dict(key="spec_transport_temp", label="Transportation Temperature", field_type="text", required=True, order=46, default_value="-18°C"),
    dict(key="spec_freezing_process", label="Freezing Process", field_type="text", required=True, order=47, default_value="BQF / IQF"),
    dict(key="spec_shelf_life", label="Shelf Life", field_type="text", required=True, order=48, default_value="12-24 Months from production date"),
    dict(key="spec_packaging_note", label="Packaging Note", field_type="text", required=True, order=49, default_value="Standard export packing"),

    # Buyer Bank Information
    dict(key="buyer_bank_name", label="Buyer Bank Name", field_type="text", required=True, order=50),
    dict(key="buyer_bank_address", label="Buyer Bank Address", field_type="text", required=True, order=51),
    dict(key="buyer_bank_swift", label="Buyer Bank SWIFT Code", field_type="text", required=True, order=52),
    dict(key="buyer_account_name", label="Buyer Account Name", field_type="text", required=True, order=53),
    dict(key="buyer_account_number", label="Buyer Account Number", field_type="text", required=True, order=54),
    dict(key="buyer_bank_officer_email", label="Bank Officer Email", field_type="text", required=False, order=55),

    # Validity & Signatory
    dict(key="validity", label="Offer Validity", field_type="text", required=True, order=56, default_value="7 Days from Issuance"),
    dict(key="signatory_name", label="Signatory Name", field_type="text", required=True, order=57, default_value="Hirdey Batth"),
    dict(key="signatory_title", label="Signatory Title", field_type="text", required=True, order=58, default_value="Managing Director"),
    dict(key="signing_date", label="Signing Date", field_type="date", required=True, order=59),
]

# Static template context
STATIC_CONTEXT = {
    "seller_company": "Ronsons Trading FZ-LLC",
    "product_name": "Frozen Chicken Paws",
}

async def main():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        company = Company(
            name="Ronsons Trading FZ-LLC",
            code="RONSONS",
            branding=STATIC_CONTEXT,
        )
        product = Product(name="Frozen Chicken Paws", code="FCP", unit="MT")
        doctype = DocumentType(
            name="FCO",
            code="FCO",
            description="Full Corporate Offer",
        )
        db.add_all([company, product, doctype])
        await db.flush()

        tpl = Template(
            name="Ronsons Frozen Chicken Paws FCO",
            company_id=company.id,
            product_id=product.id,
            document_type_id=doctype.id,
        )
        db.add(tpl)
        await db.flush()

        db.add(TemplateVersion(template_id=tpl.id, version=1, latex_source=FCO_LATEX))
        schema = DocumentSchema(template_id=tpl.id, version=1)
        db.add(schema)
        await db.flush()

        for f in FIELDS:
            db.add(SchemaField(schema_id=schema.id, **f))

        await db.commit()
        print(f"Seeded FCO template.  company_id={company.id}  template_id={tpl.id}")

if __name__ == "__main__":
    asyncio.run(main())
