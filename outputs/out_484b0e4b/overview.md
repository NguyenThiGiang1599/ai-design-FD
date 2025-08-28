# FHM WMS Hackathon — WMS Inbound Design (v0.2.0)

**Scope**: Generate a baseline Design Pack for the Inbound process of a Warehouse Management System (WMS).
- Warehouses: 5
- Concurrent users (est.): 200
- Integrations: SAP S/4 (IDoc ASN, GR), Zebra Printer (GS1-128)

**Goals**
- Standardize flows and ensure end-to-end traceability
- Provide web app for clerks and handheld Android app for operators

**Assumptions & Gaps**
(See `assumptions.md` for details.)

## RAG snippets (top hits)
### wms_glossary.md (score=0.127)\n# WMS Glossary (excerpt)
- **ASN**: Advanced Shipping Notice
- **LPN**: License Plate Number (carton/pallet id)
- **Putaway**: Move received items from staging to bin
- **GRN**: Goods Receipt Note (confirmation to ERP)\n\n### inbound.md (score=0.085)\n# Inbound Basics (excerpt)
1) Receive ASN from ERP, create Expected Receipt
2) Dock scheduling and check-in
3) Unload and scan LPN/SKU, print labels if needed
4) Quality check / discrepancy handling
5) Create Putaway tasks and move to storage bins
6) Confirm and send GRN back to ERP
