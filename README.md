# My Library — ชั้นหนังสือส่วนตัว

เว็บแอปสำหรับบันทึกหนังสือที่เรามีและหนังสือที่อยากได้ พร้อมประวัติการเข้าใช้งาน
ทำงานร่วมกันระหว่าง frontend (React + Vite) และ backend (Express + PostgreSQL)

## โครงสร้างโปรเจกต์

```
my-library/
├─ backend/    # REST API (Express + PostgreSQL)
└─ frontend/   # UI (React 19 + Vite)
```

## สิ่งที่ต้องมี

- Node.js 20+
- PostgreSQL (ค่าเริ่มต้นเชื่อมต่อที่ `localhost:5432`)

## 1. ตั้งค่า backend

```bash
cd backend
npm install
```

สร้างไฟล์ `.env` (ดูตัวอย่างใน `.env.example`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=my_library
```

สร้างฐานข้อมูล ตาราง และ index (ถ้าเป็นฐานข้อมูลโครงสร้างเก่า สคริปต์จะย้ายข้อมูลให้อัตโนมัติ)

```bash
npm run db:init
```

เริ่มเซิร์ฟเวอร์

```bash
npm run dev
```

API จะทำงานที่ `http://localhost:5000`

## 2. ตั้งค่า frontend

```bash
cd frontend
npm install
npm run dev
```

เปิด `http://localhost:5173`

ถ้า API ไม่ได้อยู่ที่ `http://localhost:5000` ให้สร้างไฟล์ `.env` ใน `frontend/`

```env
VITE_API_URL=http://localhost:5000
```

## บัญชีตัวอย่าง

กดปุ่ม **“ลองใช้งานด้วยบัญชีตัวอย่าง”** หรือเข้าสู่ระบบด้วย

- ชื่อผู้ใช้: `demo`
- รหัสผ่าน: `demo1234`

บัญชีตัวอย่างมีหนังสือให้ลอง 10 เล่ม (มีอยู่แล้ว 6 เล่ม / อยากได้ 4 เล่ม)

## API หลัก

| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/demo` | เข้าสู่ระบบด้วยบัญชีตัวอย่าง |
| POST | `/api/auth/logout` | ออกจากระบบ |
| GET | `/api/auth/me` | ข้อมูลผู้ใช้ปัจจุบัน |
| GET | `/api/books` | รายการหนังสือของผู้ใช้ |
| POST | `/api/books` | เพิ่มหนังสือ |
| PATCH | `/api/books/:id` | แก้ไขหนังสือ |
| DELETE | `/api/books/:id` | ลบหนังสือ |
| GET | `/api/activity` | ประวัติการเข้าใช้งาน |
| GET | `/api/health` | ตรวจสอบสถานะเซิร์ฟเวอร์และฐานข้อมูล |

ทุก endpoint ยกเว้น auth/health ต้องส่ง header `Authorization: Bearer <token>`

## คำสั่งอื่น ๆ (frontend)

```bash
npm run build     # สร้างไฟล์ production ใน dist/
npm run preview   # ดูไฟล์ที่ build แล้ว
npm run lint      # ตรวจโค้ดด้วย ESLint
```
