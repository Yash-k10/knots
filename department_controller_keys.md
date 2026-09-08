# SBJIT Department Controller & Central Admin Verification Keys (High Security)

This file contains the strong, high-entropy cryptographic security keys required during the registration of **Department Controllers** and **Central Administrators**.

---

## 🏛️ Department Controller Verification Keys

Each department has a designated cryptographically strong access key. A user registering as a **Controller** must supply both their college email (`@sbjit.edu.in`) and the authorized key corresponding to their department:

| Department | Cryptographic Access Key / ID | Role Scope |
|---|---|---|
| **First Year** | `SBJIT-CTRL-FY-9Q5W-3E1R-8T2Y-4U7I` | Manages First-Year departmental events, clubs & activities |
| **CSE** | `SBJIT-CTRL-CSE-8F3A-7E2D-9B4C-1A05` | Manages CSE departmental events, clubs & activities |
| **CSE(AIML)** | `SBJIT-CTRL-AIML-4K9P-2X7M-5Q8W-3N1V` | Manages CSE(AIML) departmental events, clubs & activities |
| **CSE(AIDS)** | `SBJIT-CTRL-AIDS-7B2N-9X4M-1Q8W-6V3Z` | Manages CSE(AIDS) departmental events, clubs & activities |
| **IT** | `SBJIT-CTRL-IT-6R2T-8Y5U-1I4O-7P9E` | Manages IT departmental events, clubs & activities |
| **ETC** | `SBJIT-CTRL-ETC-3Z8X-9C1V-7B4N-2M6Q` | Manages ETC departmental events, clubs & activities |
| **EE** | `SBJIT-CTRL-EE-5W9E-1R4T-8Y2U-6I3O` | Manages EE departmental events, clubs & activities |
| **ME** | `SBJIT-CTRL-ME-7A3S-9D1F-4G8H-2J6K` | Manages ME departmental events, clubs & activities |
| **BCA** | `SBJIT-CTRL-BCA-2L8K-4J1H-7G9F-5D3S` | Manages BCA departmental events, clubs & activities |
| **MCA** | `SBJIT-CTRL-MCA-8N3V-6X9P-2M1W-4Q7Y` | Manages MCA departmental events, clubs & activities |
| **MBA** | `SBJIT-CTRL-MBA-1H4J-9K2L-6F8D-5S3A` | Manages MBA departmental events, clubs & activities |

---

## 🛡️ Central Administrator Master Key

For high-level management registering as **Central Admin**:

| Management Role | Master Security Key | Role Scope |
|---|---|---|
| **Central Admin** | `SBJIT-SUPER-ADMIN-9X8K-4M2P-7Q1W-5V3Z-9842` | Platform-wide administrative and moderation controls |

---

## ⚙️ How It Works
1. When selecting **Management $\rightarrow$ Controller** during registration, selecting a department reveals the **Department Controller Secret Key** field.
2. The backend verifies this key alongside email OTP verification.
3. Once validated, the verified ID/key is permanently stored in the database with the user profile for verification and audit tracking.
