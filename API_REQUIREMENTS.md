# Dashboard Featured Brands API Tələbləri

## Təsvir
Dashboard səhifəsində iki brand göstərilməlidir. Hər brand üçün seçilmiş bir featured məhsul göstərilir. Bu məhsullar admin panelindən idarə edilir.

---

## Lazımi API Endpoint-ləri

### 1. Dashboard üçün Featured Brands və Məhsulları Gətirmək

**Endpoint:** `GET /api/dashboard/featured-brands`

**Authentication:** Tələb olunur (JWT Token)

**Response (200 OK):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": [
    {
      "brandId": "guid",
      "brandName": "Sony",
      "brandSlug": "sony",
      "featuredProduct": {
        "id": "guid",
        "name": "Playstation 5",
        "description": "Incredibly powerful CPUs, GPUs, and an SSD with integrated I/O will redefine your PlayStation experience.",
        "price": 1500.00,
        "finalPrice": 1350.00,
        "finalDiscountPercent": 10,
        "currency": "AZN",
        "imageUrl": "/api/images/guid",
        "categoryName": "Gaming Consoles"
      }
    },
    {
      "brandId": "guid",
      "brandName": "Apple",
      "brandSlug": "apple",
      "featuredProduct": {
        "id": "guid",
        "name": "Macbook Air",
        "description": "The new 15-inch Macbook Air with Liquid Retina display. Supercharged by M2 chip.",
        "price": 2999.00,
        "finalPrice": 2799.00,
        "finalDiscountPercent": 6.67,
        "currency": "AZN",
        "imageUrl": "/api/images/guid",
        "categoryName": "Laptops"
      }
    }
  ]
}
```

**Qeyd:** 
- Maksimum 2 brand qaytarılır
- Hər brand üçün yalnız bir featured məhsul qaytarılır
- Əgər brand üçün featured məhsul seçilməyibsə, `featuredProduct` null ola bilər

---

### 2. Brand üçün Featured Məhsul Seçmək

**Endpoint:** `POST /api/brands/{brandId}/featured-product`

**Authentication:** Tələb olunur (JWT Token)

**Path Parameters:**
| Parametr | Tip | Təsvir |
|----------|-----|--------|
| `brandId` | Guid | Brand ID-si |

**Request Body:**
```json
{
  "productId": "guid"
}
```

**Request Body Parametrləri:**
| Parametr | Tip | Tələb olunur | Təsvir |
|----------|-----|--------------|--------|
| `productId` | Guid | **Bəli** | Featured olaraq seçiləcək məhsul ID-si |

**Response (200 OK):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

**Qeyd:**
- Hər brand üçün yalnız bir məhsul featured ola bilər
- Yeni məhsul featured olaraq seçildikdə, əvvəlki featured məhsul avtomatik olaraq çıxarılır
- Məhsul həmin brand-a aid olmalıdır

---

### 3. Brand üçün Featured Məhsulu Silmək

**Endpoint:** `DELETE /api/brands/{brandId}/featured-product`

**Authentication:** Tələb olunur (JWT Token)

**Path Parameters:**
| Parametr | Tip | Təsvir |
|----------|-----|--------|
| `brandId` | Guid | Brand ID-si |

**Response (200 OK):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

---

### 4. Featured Brands Siyahısını Gətirmək (Admin Panel üçün)

**Endpoint:** `GET /api/brands/featured`

**Authentication:** Tələb olunur (JWT Token)

**Response (200 OK):**
```json
{
  "isSuccess": true,
  "isFailure": false,
  "value": [
    {
      "brandId": "guid",
      "brandName": "Sony",
      "brandSlug": "sony",
      "featuredProduct": {
        "id": "guid",
        "name": "Playstation 5",
        "price": 1500.00,
        "currency": "AZN",
        "imageUrl": "/api/images/guid"
      },
      "isActive": true
    },
    {
      "brandId": "guid",
      "brandName": "Apple",
      "brandSlug": "apple",
      "featuredProduct": {
        "id": "guid",
        "name": "Macbook Air",
        "price": 2999.00,
        "currency": "AZN",
        "imageUrl": "/api/images/guid"
      },
      "isActive": true
    }
  ]
}
```

**Qeyd:** Bu endpoint admin panelində bütün featured brands-ləri idarə etmək üçün istifadə olunur.

---

### 5. Brand-ı Featured Brands Siyahısına Əlavə Etmək

**Endpoint:** `POST /api/brands/{brandId}/featured`

**Authentication:** Tələb olunur (JWT Token)

**Path Parameters:**
| Parametr | Tip | Təsvir |
|----------|-----|--------|
| `brandId` | Guid | Featured siyahısına əlavə ediləcək brand ID-si |

**Response (200 OK):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

**Qeyd:**
- Maksimum 2 brand featured ola bilər
- Əgər artıq 2 brand featured-dırsa, error qaytarılmalıdır
- Ya da köhnə brand-lərdən biri avtomatik olaraq çıxarılmalıdır (bu məntiqə görə)

---

### 6. Brand-ı Featured Brands Siyahısından Çıxarmaq

**Endpoint:** `DELETE /api/brands/{brandId}/featured`

**Authentication:** Tələb olunur (JWT Token)

**Path Parameters:**
| Parametr | Tip | Təsvir |
|----------|-----|--------|
| `brandId` | Guid | Featured siyahısından çıxarılacaq brand ID-si |

**Response (200 OK):**
```json
{
  "isSuccess": true,
  "isFailure": false
}
```

---

## Error Handling

### Xüsusi Error Kodları

- `Brand.NotFound` - Brand tapılmadı
- `Product.NotFound` - Məhsul tapılmadı
- `Brand.FeaturedLimitReached` - Artıq 2 featured brand var (maksimum limit)
- `Brand.ProductNotFromBrand` - Seçilən məhsul bu brand-a aid deyil
- `Brand.AlreadyFeatured` - Brand artıq featured-dır

### Validasiya Xətaları

```json
{
  "isSuccess": false,
  "isFailure": true,
  "error": {
    "code": "Validation.Failed",
    "message": "Bir və ya bir neçə validasiya xətası baş verdi",
    "type": 2,
    "errors": [
      {
        "code": "Validation.ProductId",
        "message": "Məhsul ID-si boş ola bilməz",
        "property": "ProductId"
      }
    ]
  }
}
```

---

## Database Strukturu (Təklif)

### Brand Table
- `Id` (Guid, PK)
- `Name` (string)
- `Slug` (string)
- ... (digər field-lər)

### BrandFeaturedProduct Table (Yeni)
- `Id` (Guid, PK)
- `BrandId` (Guid, FK -> Brand)
- `ProductId` (Guid, FK -> Product)
- `IsActive` (bool)
- `CreatedAt` (DateTime)
- `UpdatedAt` (DateTime)

**Unique Constraint:** `BrandId` - Hər brand üçün yalnız bir active featured product

### BrandFeatured Table (Yeni) - Dashboard üçün
- `Id` (Guid, PK)
- `BrandId` (Guid, FK -> Brand)
- `DisplayOrder` (int) - 1 və ya 2
- `IsActive` (bool)
- `CreatedAt` (DateTime)
- `UpdatedAt` (DateTime)

**Unique Constraint:** 
- `DisplayOrder` - 1-2 arası unikal olmalıdır
- Maksimum 2 active record

---

## İstifadə Nümunələri

### JavaScript/TypeScript

```javascript
// Dashboard üçün featured brands gətirmək
const response = await fetch('https://your-api-domain.com/api/dashboard/featured-brands', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
if (data.isSuccess) {
  const featuredBrands = data.value;
  // featuredBrands[0] - İlk brand və məhsulu
  // featuredBrands[1] - İkinci brand və məhsulu
}

// Brand üçün featured məhsul seçmək
const response = await fetch(
  `https://your-api-domain.com/api/brands/${brandId}/featured-product`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      productId: 'product-guid-here'
    })
  }
);
```

---

## Qeydlər

1. **Maksimum Limit:** Dashboard-da maksimum 2 featured brand göstərilir
2. **Featured Product:** Hər brand üçün yalnız bir featured məhsul ola bilər
3. **Validation:** Məhsul həmin brand-a aid olmalıdır
4. **Display Order:** Brand-lər display order-ə görə sıralanır (1, 2)
5. **Admin Panel:** Admin panelindən brand və məhsul idarə edilir

---

**Son Yenilənmə:** 2025-01-XX
**API Versiya:** v1


