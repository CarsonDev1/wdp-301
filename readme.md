Hướng dẫn Test API Library Management System với Postman
📋 Chuẩn bị

1. Thiết lập môi trường

Base URL: http://localhost:9999
API Docs: http://localhost:9999/api-docs

2. Tạo Collection trong Postman

Mở Postman
Tạo Collection mới: "Library Management API"
Tạo Environment với variables:

base_url: http://localhost:9999
admin_token: (sẽ lấy sau khi login)
user_token: (sẽ lấy sau khi login)

3. Seed Data
   Chạy lệnh để tạo dữ liệu mẫu:
   bashnode seed.js
   🔐 1. AUTHENTICATION API
   1.1 Login Admin
   POST {{base_url}}/api/v1/auth/login
   Content-Type: application/json

{
"studentId": "ADMIN001",
"password": "admin123"
}
Response sẽ trả về token - copy token này vào Environment variable admin_token
1.2 Login Student
POST {{base_url}}/api/v1/auth/login
Content-Type: application/json

{
"studentId": "SV001",
"password": "SV001"
}
Copy token vào Environment variable user_token
1.3 Get User by ID
GET {{base_url}}/api/v1/auth/getUserById/[USER_ID]
Authorization: Bearer {{user_token}}
1.4 Import Users from Excel (Admin only)
POST {{base_url}}/api/v1/auth/import
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data

Body: form-data

-   Key: file, Type: File, Value: [Excel file]
    📚 2. BOOKS API
    2.1 Get All Books (Public)
    GET {{base_url}}/api/v1/books
    2.2 Search Books
    GET {{base_url}}/api/v1/books?query=JavaScript&page=1&limit=5
    GET {{base_url}}/api/v1/books?category=[CATEGORY_ID]&available=true
    GET {{base_url}}/api/v1/books?author=Nguyen&sortBy=publishYear&sortOrder=desc
    2.3 Get Book by ID
    GET {{base_url}}/api/v1/books/[BOOK_ID]
    2.4 Create Book (Admin only)
    POST {{base_url}}/api/v1/books
    Authorization: Bearer {{admin_token}}
    Content-Type: application/json

{
"title": "React.js Handbook",
"isbn": "978-0-444444-44-4",
"author": "John Doe",
"publisher": "Tech Publisher",
"publishYear": 2024,
"description": "Complete guide to React.js",
"price": 300000,
"image": "https://via.placeholder.com/300x400?text=React+Book",
"categories": ["[CATEGORY_ID]"],
"bookshelf": "[BOOKSHELF_ID]",
"quantity": 5
}
2.5 Update Book (Admin only)
PUT {{base_url}}/api/v1/books/[BOOK_ID]
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"title": "React.js Handbook - Updated",
"price": 350000,
"quantity": 7
}
2.6 Delete Book (Admin only)
DELETE {{base_url}}/api/v1/books/[BOOK_ID]
Authorization: Bearer {{admin_token}}
2.7 Update Book Inventory (Admin only)
PUT {{base_url}}/api/v1/books/[BOOK_ID]/inventory
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"total": 10,
"available": 8,
"borrowed": 2,
"damaged": 0,
"lost": 0
}
📖 3. BORROW REQUESTS (User)
3.1 Create Borrow Request
POST {{base_url}}/api/v1/books/borrow/request
Authorization: Bearer {{user_token}}
Content-Type: application/json

{
"bookId": "[BOOK_ID]",
"isReadOnSite": false,
"notes": "Need this book for my assignment"
}
3.2 Get User's Borrow Requests
GET {{base_url}}/api/v1/books/borrow/requests
Authorization: Bearer {{user_token}}
3.3 Get User's Borrow History
GET {{base_url}}/api/v1/books/history/user?page=1&limit=10&status=borrowed
Authorization: Bearer {{user_token}}
3.4 Cancel Borrow Request
DELETE {{base_url}}/api/v1/books/borrow/cancel/[REQUEST_ID]
Authorization: Bearer {{user_token}}
⭐ 4. REVIEWS API
4.1 Create Review (User - must have returned the book)
POST {{base_url}}/api/v1/books/review
Authorization: Bearer {{user_token}}
Content-Type: application/json

{
"bookId": "[BOOK_ID]",
"rating": 5,
"comment": "Great book! Very helpful for learning JavaScript."
}
4.2 Update Review
PUT {{base_url}}/api/v1/books/review/[REVIEW_ID]
Authorization: Bearer {{user_token}}
Content-Type: application/json

{
"rating": 4,
"comment": "Updated: Good book but could be better."
}
4.3 Delete Review
DELETE {{base_url}}/api/v1/books/review/[REVIEW_ID]
Authorization: Bearer {{user_token}}
🏷️ 5. CATEGORIES API
5.1 Get All Categories (Public)
GET {{base_url}}/api/v1/categories
5.2 Get Category by ID
GET {{base_url}}/api/v1/categories/[CATEGORY_ID]
5.3 Get Category Statistics
GET {{base_url}}/api/v1/categories/stats
Authorization: Bearer {{user_token}}
5.4 Create Category (Admin only)
POST {{base_url}}/api/v1/categories
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"name": "Tâm lý học",
"description": "Sách về tâm lý học và phát triển bản thân"
}
5.5 Update Category (Admin only)
PUT {{base_url}}/api/v1/categories/[CATEGORY_ID]
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"name": "Tâm lý học ứng dụng",
"description": "Sách tâm lý học ứng dụng trong cuộc sống"
}
5.6 Delete Category (Admin only)
DELETE {{base_url}}/api/v1/categories/[CATEGORY_ID]
Authorization: Bearer {{admin_token}}
📚 6. BOOKSHELVES API
6.1 Get All Bookshelves (Public)
GET {{base_url}}/api/v1/bookshelves
6.2 Get Bookshelf by ID
GET {{base_url}}/api/v1/bookshelves/[BOOKSHELF_ID]
6.3 Get Bookshelf Statistics
GET {{base_url}}/api/v1/bookshelves/stats
Authorization: Bearer {{user_token}}
6.4 Create Bookshelf (Admin only)
POST {{base_url}}/api/v1/bookshelves
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"code": "K-05",
"name": "Kệ Tâm lý học",
"description": "Kệ sách về tâm lý học",
"location": "Tầng 2, Khu D"
}
6.5 Update Bookshelf (Admin only)
PUT {{base_url}}/api/v1/bookshelves/[BOOKSHELF_ID]
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"name": "Kệ Tâm lý học ứng dụng",
"location": "Tầng 3, Khu D"
}
6.6 Delete Bookshelf (Admin only)
DELETE {{base_url}}/api/v1/bookshelves/[BOOKSHELF_ID]
Authorization: Bearer {{admin_token}}
6.7 Move Books Between Bookshelves (Admin only)
POST {{base_url}}/api/v1/bookshelves/move-books
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"fromBookshelfId": "[SOURCE_BOOKSHELF_ID]",
"toBookshelfId": "[DESTINATION_BOOKSHELF_ID]",
"bookIds": ["[BOOK_ID_1]", "[BOOK_ID_2]"]
}
👨‍💼 7. BORROW MANAGEMENT (Admin/Staff)
7.1 Get All Borrow Requests
GET {{base_url}}/api/v1/admin/borrow-requests?page=1&limit=10
Authorization: Bearer {{admin_token}}

# Filter examples:

GET {{base_url}}/api/v1/admin/borrow-requests?status=pending
GET {{base_url}}/api/v1/admin/borrow-requests?isOverdue=true
GET {{base_url}}/api/v1/admin/borrow-requests?userId=[USER_ID]
7.2 Approve Borrow Request
POST {{base_url}}/api/v1/admin/borrow-requests/[REQUEST_ID]/approve
Authorization: Bearer {{admin_token}}
7.3 Decline Borrow Request
POST {{base_url}}/api/v1/admin/borrow-requests/[REQUEST_ID]/decline
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"reason": "Book is currently under maintenance"
}
7.4 Process Book Return
POST {{base_url}}/api/v1/admin/borrow-requests/[REQUEST_ID]/return
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"condition": "good",
"notes": "Book returned in good condition"
}

# For damaged book:

{
"condition": "damaged",
"notes": "Book has water damage on pages 50-60"
}

# For lost book:

{
"condition": "lost",
"notes": "Student reported book as lost"
}
7.5 Extend Borrow Period
POST {{base_url}}/api/v1/admin/borrow-requests/[REQUEST_ID]/extend
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"days": 14
}
7.6 Get Borrow Statistics
GET {{base_url}}/api/v1/admin/borrow-requests/statistics
Authorization: Bearer {{admin_token}}

# With date filter:

GET {{base_url}}/api/v1/admin/borrow-requests/statistics?fromDate=2024-01-01&toDate=2024-12-31
💰 8. FINES API
8.1 Get All Fines (Admin/Staff)
GET {{base_url}}/api/v1/fines?page=1&limit=10
Authorization: Bearer {{admin_token}}

# Filter examples:

GET {{base_url}}/api/v1/fines?paid=false
GET {{base_url}}/api/v1/fines?userId=[USER_ID]
GET {{base_url}}/api/v1/fines?reason=overdue
8.2 Get User's Fines
GET {{base_url}}/api/v1/fines/my-fines
Authorization: Bearer {{user_token}}

# Filter by payment status:

GET {{base_url}}/api/v1/fines/my-fines?paid=false
8.3 Get Fine by ID
GET {{base_url}}/api/v1/fines/[FINE_ID]
Authorization: Bearer {{admin_token}}
8.4 Create Manual Fine (Admin/Staff)
POST {{base_url}}/api/v1/fines
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"userId": "[USER_ID]",
"borrowRecordId": "[BORROW_RECORD_ID]",
"reason": "overdue",
"amount": 50000,
"note": "Book returned 10 days late"
}
8.5 Mark Fine as Paid (Admin/Staff)
POST {{base_url}}/api/v1/fines/[FINE_ID]/pay
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
"paymentMethod": "cash",
"note": "Paid in cash at library counter"
}
8.6 Delete Fine (Admin only)
DELETE {{base_url}}/api/v1/fines/[FINE_ID]
Authorization: Bearer {{admin_token}}
8.7 Get Fine Statistics
GET {{base_url}}/api/v1/fines/statistics
Authorization: Bearer {{admin_token}}

# With date filter:

GET {{base_url}}/api/v1/fines/statistics?fromDate=2024-01-01&toDate=2024-12-31
