# ⚙️ TruvaPay Backend API
**The Engine behind Secure Escrow Payments.**
*Developed for the Enyata × Interswitch Buildathon 2026.*

---

## 🚀 Live API Endpoint
The server is successfully deployed and running on Render:
👉 **[https://truvapay-api.onrender.com](https://truvapay-api.onrender.com)**

---

## 🛠️ Technical Overview
This is a Node.js and Express.js RESTful API designed to handle the core logic of the TruvaPay Escrow system.

### **Key Functionalities:**
* **Deal Management:** Creating and retrieving secure deals with unique IDs.
* **Interswitch Integration:** Initializing payment requests and handling transaction callbacks.
* **Escrow Logic:** Managing the status of funds (Pending -> Funded -> Delivered -> Completed).
* **CORS Protection:** Configured to allow secure communication with the [TruvaPay Frontend](https://dami-ann.github.io/truvapay/).

### **Tech Stack:**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Payments:** Interswitch Webpay API

---

## 📂 Project Structure
* `server.js`: The entry point of the application.
* `models/`: Database schemas for Deals and Transactions.
* `routes/`: API endpoints for payment and deal logic.

---

## 🧪 Submission Note
This backend works in tandem with the frontend repository. Due to the instability of the provided Interswitch test credentials, the API is configured to log transaction attempts for debugging during the judging phase.

**Lead Developer:** Dami-Ann
