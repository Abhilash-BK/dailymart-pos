# 🛒 DailyMart POS – Grocery Store Billing & Inventory Management System

DailyMart POS is a full-stack Point of Sale (POS) web application designed to simplify grocery store billing, product inventory management, and sales tracking.

The application provides a centralized dashboard where store owners and employees can manage products, process customer purchases, monitor stock levels, and maintain sales records.

## ✨ Features

### 📊 Dashboard
- Overview of store operations.
- Quick access to billing, inventory, and sales history.

### 🧾 Billing Management
- Add products to the shopping cart.
- Automatically calculate subtotal, discount, and final amount.
- Support for Cash, UPI, and Card payments.
- Generate and print customer receipts.
- Automatically update stock after checkout.

### 📦 Inventory Management
- Add, edit, and delete products.
- Manage product names, categories, units, prices, and stock quantities.
- Store product information in MongoDB.
- Maintain inventory updates across sessions.

### 📈 Sales History
- View previous transactions.
- Track receipt numbers, purchased items, and payment details.

### 🔐 Authentication & Employee Management
- Secure login and employee registration.
- Email OTP verification.
- Employee approval and rejection by admin.
- Role-based access for administrators and employees.

### 🎨 User Interface
- Responsive dashboard.
- Clean interface with theme support.
- Easy navigation between application modules.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs |
| Email | Nodemailer, Gmail SMTP |
| API | REST API |
| Deployment | Vercel (Frontend), Render (Backend) |
| Version Control | Git, GitHub |

## 📁 Project Structure

```text
dailymart-pos/
│
├── src/
│   ├── App.jsx
│   ├── api.js
│   └── ...
│
├── server/
│   ├── config/
│   │   └── mailer.js
│   ├── middleware/
│   │   └── authenticateToken.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── scripts/
│   │   └── createAdmin.js
│   ├── server.js
│   └── package.json
│
├── index.html
├── package.json
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Abhilash-BK/dailymart-pos.git
cd dailymart-pos
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_APP_PASSWORD=your_gmail_app_password
```

Use your own credentials. Never commit `.env` to GitHub.

### 5. Start the backend

From the `server` directory:

```bash
npm run dev
```

Backend runs locally at:

```text
http://localhost:5000
```

### 6. Start the frontend

Open another terminal in the main project directory:

```bash
npm run dev
```

Frontend runs locally at:

```text
http://localhost:5173
```

## 🌐 Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

**Live Frontend:** https://dailymart-pos-one.vercel.app/

Backend deployment and production API connectivity are being configured.

## 🔒 Security

- JWT-based authentication.
- Password hashing with bcryptjs.
- Email OTP verification.
- Admin-controlled employee approval.
- Environment variables for sensitive credentials.
- Backend authentication middleware.

## 🚀 Future Improvements

- Barcode scanning for faster billing.
- Low-stock alerts.
- Advanced sales analytics and reports.
- Export invoices and sales reports.
- Customer management.
- Improved mobile experience.

## 👨‍💻 Developer

**Abhilash Kuttabade**

GitHub: [@Abhilash-BK](https://github.com/Abhilash-BK)

---

⭐ If you find this project useful, consider giving it a star!