# Non-Functional Requirements (excerpt)
- **Latency (scan round-trip)**: target <= 300 ms
- **Availability**: 99.9%
- **Auditability**: Enabled
- **Security**: JWT-based auth; role-based access (Clerk, Operator, Admin)
- **Observability**: logs, metrics, traces; error budget for scanning workflow
