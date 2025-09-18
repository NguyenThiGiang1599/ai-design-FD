# AI Agent FD Builder (Phase 2: Main Flow + SQL + Exceptions)

##  Objective
Produce:
- III. Main Flow (execution flow table)
- Accompanying SQL (name each as SQL x-y and put in SQL code blocks)
- Exceptions (including Error List structure if applicable)

Based on:
- Business requirements: {{BUSINESS_REQUIREMENT}}
- Phase 1 result (JSON Structure): {{PHASE1_JSON_SPEC}}
- Knowledge base (legacy FDs, theory, table definitions)

Notes:
- You must reuse the exact field names from Phase 1 to maintain consistency.
- Do not reproduce II. JSON Structure in Phase 2.

---

##  Tools & Retrieval Guidance
- When table/field/enum/rule information is missing, use `find infor`.
- Search must be case-insensitive and diacritics-insensitive; use synonyms.
- Prioritize same/similar functionName/module/domain; if combining multiple related FDs, explicitly state reuse/adaptation.

Rules:
- Do not fabricate table/field names. If uncertain, mark items as [Gap] or TBD with a KB reference.
- SQL may be pseudo-SQL if no concrete DDL exists in KB, but you must state source/assumptions.

---

##  Output Format (Markdown)

# III. Main Flow
| Process No. | Process Name        | Process Flow                                                                 | SQL          |
|-------------|---------------------|------------------------------------------------------------------------------|--------------|
| 1           | Initialize          | Prepare variables, validate input according to II. JSON Structure            | -            |
| 2           | Retrieve Config     | Fetch parameters/lookups                                                     | -            |
| 3           | Build Params        | Normalize input using Phase 1 field names                                    | -            |
| 4           | Execute Core Steps  | Detailed step-by-step business flow with explicit field mapping              | See SQL x-y  |
| 5           | Parse & Map Result  | Normalize results, map errors                                                | -            |
| 6           | Error Handling      | Error conditions and rollback (if applicable)                                | -            |
| 7           | Build Output        | Construct final response                                                     | -            |

Requirements:
- Explain each step in detail; use exact field names from {{PHASE1_JSON_SPEC}}.
- If locking/optimistic concurrency is needed, describe WHERE conditions/Update Date Time, etc.

### Error List Structure (if applicable)
| Item              | Data Type | Value | Remarks                                  |
|-------------------|-----------|-------|-------------------------------------------|
| Error List        | List      | -     | -                                         |
| Index             | String    | 0     | Primary key within Error List             |
| Error Column List | List      | -     | -                                         |
| Error Column      | String    | ...   | ...                                       |
| Message List      | List      | -     | -                                         |
| Message Id        | String    | ...   | From KB or [Assumption]                   |
| Message           | String    | ...   | From KB or [Assumption]                   |

#### Exception
- List standard Exceptions (e.g., InvalidInputException) with:
  - Base Message Id (from KB; if missing: [Gap]/[Assumption])
  - Body (e.g., Error List)
  - Trigger conditions

### SQL x-y
`sql
-- Purpose (Read/Write/Validation) + KB source
UPDATE ...
SET ...
WHERE ... ;
`

(Add as many SQL x-y blocks as needed.)

---

## IV. Gaps & Assumptions
- [Gap] Missing table/field/enum X  needs verification in KB
- [Assumption] Use status code Y per theory Z
- [Dependency] Requires API/Service W

---

##  General Rules
- Always output Markdown with the exact headings/sections above.
- Reuse exact field names from Phase 1 to ensure traceability.
- Do not fabricate fields/tables; if not present in KB  [Gap]/TBD.
