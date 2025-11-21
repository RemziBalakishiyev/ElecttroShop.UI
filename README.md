# TV Store Admin Panel

Modern and fully functional admin panel - inventory management system built with React, TypeScript, and Tailwind CSS 4.

## 🚀 Features

### Authentication
- ✅ **Login** - Email and password authentication
- ✅ **Forgot Password** - Password recovery
- ✅ **Enter OTP** - OTP code verification
- ✅ **Reset Password** - Set new password
- ✅ JWT Token Authentication (Access Token + Refresh Token)
- ✅ Auto Token Refresh
- ✅ Protected Routes

### Inventory Management
- ✅ **All Items** - Complete items list
- ✅ **Add Item** - Add new items
- ✅ **Filter** - Filter by store and location
- ✅ **Search** - Search functionality
- ✅ **Pagination** - Page navigation
- ✅ **Table Sorting** - Sortable table columns

### UI Components
- ✅ Modern and responsive design
- ✅ Dark/Light theme support
- ✅ Reusable components (Button, Input, Select, Modal, Table, Pagination)
- ✅ Form validation (Formik + Yup)
- ✅ File upload functionality
- ✅ Date picker

## 🛠️ Technologies

- **Frontend Framework:** React 19.2.0
- **Language:** TypeScript 5.9.3
- **Styling:** Tailwind CSS 4.1.16
- **Build Tool:** Vite 7.1.7
- **Routing:** React Router DOM 7.9.6
- **State Management:** 
  - React Query (@tanstack/react-query) 5.62.0
  - Context API
- **Form Handling:** Formik 2.4.6
- **Validation:** Yup 1.4.0
- **HTTP Client:** Axios 1.7.9
- **Icons:** Lucide React 0.552.0

## 📦 Installation

### Requirements
- Node.js 18+ 
- npm or yarn

### Steps

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/tvstore-admin.git
cd tvstore-admin
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:5173
```

## 🏗️ Build

For production build:

```bash
npm run build
```

Build files will be generated in the `dist/` folder.

## 📁 Project Structure

```
tvstore-admin/
├── src/
│   ├── components/          # Reusable components
│   │   ├── commons/         # Common components
│   │   └── modals/          # Modal components
│   ├── core/                # Core functionality
│   │   ├── api/             # API client and endpoints
│   │   ├── config/           # Configuration files
│   │   ├── context/          # React Context
│   │   ├── hooks/            # Custom hooks
│   │   ├── providers/        # Context providers
│   │   ├── types/            # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── layouts/              # Layout components
│   ├── modules/              # Feature modules
│   │   └── auth/             # Authentication module
│   ├── pages/                # Page components
│   └── utils/                # General utility functions
├── public/                   # Static files
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔧 Configuration

### API Configuration

API base URL and endpoints are defined in `src/core/config/api.config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: "https://localhost:44312",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REFRESH_TOKEN: "/api/auth/refresh-token",
    },
  },
};
```

### Environment Variables

Create `.env` file (if needed):

```env
VITE_API_BASE_URL=https://localhost:44312
```

## 🔐 Authentication Flow

1. User logs in with email and password
2. JWT access token and refresh token are received from API
3. Tokens are stored in localStorage
4. Access token is sent in `Authorization` header with every request
5. If token expires, new access token is obtained using refresh token
6. If refresh token also expires, user is redirected to login page

## 📝 API Documentation

### Login Endpoint

**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresAt": "2024-01-01T12:00:00Z",
  "user": {
    "id": "guid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": 1,
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

## 🎨 UI Components

### Button
```tsx
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

### Input
```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Modal
```tsx
<Modal open={isOpen} onClose={handleClose} title="Modal Title">
  <p>Modal content</p>
</Modal>
```

## 🧪 Testing

```bash
npm run lint
```

## 📄 License

This project is private.

## 👥 Authors

- Development Team

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Contact

Open an issue for questions.

---

**Note:** This project is in development stage. Please test all features before using in production.
