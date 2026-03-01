# Cập nhật: Hệ thống Quản lý Subscription Expired và Xóa Tự động

## Tổng quan các tính năng mới

Hệ thống đã được nâng cấp với các tính năng sau:

### 1. **Chặn SHOPOWNER và STAFF khi subscription expired**

- Khi `is_expired = true`, SHOPOWNER và STAFF không thể truy cập bất kỳ API nào liên quan đến shop
- **EXCEPTION**: Vẫn cho phép truy cập API `/subscriptions` để có thể renew
- Hiển thị message chi tiết với số ngày đã expired và số ngày còn lại trước khi bị xóa

### 2. **Gửi thông báo cho SHOPOWNER khi shop expired**

- Khi cron job phát hiện shop expired, tự động gửi notification cho SHOPOWNER
- Thông báo bao gồm: Tên shop, gói subscription, và cảnh báo về việc xóa sau 14 ngày

### 3. **Chặn đăng ký shop mới khi có shop expired**

- User không thể tạo shop mới nếu đang có shop expired (trong khoảng 14 ngày)
- Bắt buộc phải gia hạn shop hiện tại hoặc chờ đến khi shop bị xóa

### 4. **Tự động xóa shop sau 14 ngày expired**

- Cron job chạy mỗi ngày lúc 02:00 để kiểm tra và xóa
- Xóa cascade tất cả dữ liệu liên quan:
  - Tất cả STAFF (users có `owner_manager_id` trùng với SHOPOWNER)
  - Shop subscription và subscription payments
  - Tất cả dữ liệu shop: orders, inventory, customers, merchandise, shifts, etc.
  - Reset SHOPOWNER về trạng thái ban đầu (không shop, role về USER hoặc null)

---

## Chi tiết các thay đổi

### 1. SubscriptionExpiredGuard (Đã cập nhật)

**File**: [src/modules/auth/guard/subscription-expired.guard.ts](d:\1_SWD392\ManageApp-Backend\src\modules\auth\guard\subscription-expired.guard.ts)

#### Thay đổi:

```typescript
// Cho phép các API subscription và auth để user có thể renew
const path = request.route?.path || request.url;
if (path && (path.includes('/subscriptions') || path.includes('/auth'))) {
  return true;
}
```

#### Message khi bị chặn:

```
Subscription của shop đã hết hạn vào 28/02/2026 (5 ngày trước).
Vui lòng gia hạn gói PREMIUM để tiếp tục sử dụng.
Lưu ý: Shop sẽ bị xóa vĩnh viễn sau 9 ngày nữa nếu không gia hạn.
```

---

### 2. Validation khi tạo shop mới

**Method**: `createSubscriptionShop()` trong [shop-subscription.service.ts](d:\1_SWD392\ManageApp-Backend\src\modules\shop-subscriptions\shop-subscription.service.ts#L19-L92)

#### Logic:

```typescript
// Kiểm tra xem user có shop subscription đã expired nhưng chưa bị xóa không
const existingExpiredShop = await this.prisma.shopSubscription.findFirst({
  where: {
    shop: {
      users: {
        some: { id: userId },
      },
    },
    is_expired: true,
  },
  include: { shop: true },
});

if (existingExpiredShop) {
  // Tính số ngày đã expired
  const daysExpired = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));

  throw new BadRequestException(
    `Bạn không thể đăng ký shop mới vì đang có shop "${shop.shop_name}" đã hết hạn ${daysExpired} ngày trước. ` +
      `Shop này sẽ bị xóa vĩnh viễn sau ${14 - daysExpired} ngày. ` +
      `Vui lòng gia hạn shop hiện tại hoặc chờ đến khi shop bị xóa để đăng ký shop mới.`,
  );
}
```

---

### 3. Notification khi shop expired

**Method**: `checkAndUpdateExpiredSubscriptions()` trong [shop-subscription.service.ts](d:\1_SWD392\ManageApp-Backend\src\modules\shop-subscriptions\shop-subscription.service.ts#L125-L178)

#### Logic gửi notification:

```typescript
// Sau khi update is_expired = true
for (const shopSub of expiredShops) {
  const shopOwner = shopSub.shop.users.find(
    (u) => u.owner_manager_id === null && u.shop_id === shopSub.shop_id,
  );

  if (shopOwner) {
    console.log(
      `📧 [NOTIFICATION] User ${shopOwner.username} (ID: ${shopOwner.id}): ` +
        `Shop "${shopSub.shop.shop_name}" đã hết hạn gói ${shopSub.subscription.package_code}. ` +
        `Vui lòng gia hạn trong vòng 14 ngày để tránh bị xóa vĩnh viễn.`,
    );
    // TODO: Implement email service hoặc in-app notification
  }
}
```

**Note**: Hiện tại đang log ra console. Cần implement email service hoặc notification service để gửi thực sự.

---

### 4. Xóa shop sau 14 ngày expired

**Method**: `deleteExpiredShopsAfter14Days()` trong [shop-subscription.service.ts](d:\1_SWD392\ManageApp-Backend\src\modules\shop-subscriptions\shop-subscription.service.ts#L219-L419)

#### Các bước xóa (Cascade):

1. **Tìm tất cả shop đã expired > 14 ngày**

```typescript
const fourteenDaysAgo = new Date();
fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

const expiredShopSubscriptions = await this.prisma.shopSubscription.findMany({
  where: {
    is_expired: true,
    end_date: { lte: fourteenDaysAgo },
  },
  include: {
    shop: { include: { users: true } },
    subscription_payments: true,
  },
});
```

2. **Xóa tất cả STAFF users**

```typescript
const staffUsers = await this.prisma.user.findMany({
  where: { owner_manager_id: shopOwner.id },
});

for (const staff of staffUsers) {
  await this.prisma.profile.deleteMany({
    where: { user_id: staff.id },
  });
  await this.prisma.user.delete({
    where: { id: staff.id },
  });
}
```

3. **Xóa subscription payments**

```typescript
await this.prisma.subscriptionPayment.deleteMany({
  where: { sub_shop_id: shopSub.id },
});
```

4. **Xóa shop subscription**

```typescript
await this.prisma.shopSubscription.delete({
  where: { id: shopSub.id },
});
```

5. **Xóa tất cả dữ liệu shop** (theo thứ tự):
   - Shift staffs
   - Order items và payments
   - Orders
   - Shifts
   - Merchandise redemptions
   - Merchandises
   - Inventory traits
   - Inventory items
   - Inventories
   - Shop categories
   - Customers

6. **Reset SHOPOWNER về trạng thái ban đầu**

```typescript
await this.prisma.user.update({
  where: { id: shopOwner.id },
  data: {
    shop_id: null,
    role_id: defaultRoleId, // USER role hoặc null
    owner_manager_id: null,
  },
});
```

7. **Xóa shop**

```typescript
await this.prisma.shop.delete({
  where: { id: shopId },
});
```

---

### 5. API Endpoints mới

#### DELETE /subscriptions/maintenance/cleanup-expired-shops

**Mô tả**: Xóa các shop đã expired hơn 14 ngày (Admin hoặc CronJob)

**Auth**: Admin only

**Response**:

```json
{
  "deleted": 2,
  "message": "Đã xóa 2 shop đã expired hơn 14 ngày cùng tất cả dữ liệu liên quan"
}
```

**Controller**: [subscription.controller.ts](d:\1_SWD392\ManageApp-Backend\src\modules\subscriptions\subscription.controller.ts#L176-L188)

---

### 6. Cron Jobs mới

#### Cron Job: Delete Expired Shops After 14 Days

**Schedule**: Mỗi ngày lúc 02:00 (Asia/Ho_Chi_Minh timezone)

**Code**: [subscription.cron.ts](d:\1_SWD392\ManageApp-Backend\src\modules\subscriptions\subscription.cron.ts#L69-L86)

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM, {
  name: 'delete-expired-shops-after-14-days',
  timeZone: 'Asia/Ho_Chi_Minh',
})
async handleDeleteExpiredShopsAfter14Days() {
  this.logger.log('🗑️  Bắt đầu xóa các shop đã expired hơn 14 ngày...');

  try {
    const result = await this.shopSubscriptionService.deleteExpiredShopsAfter14Days();
    if (result.deleted > 0) {
      this.logger.log(`✅ ${result.message}`);
    } else {
      this.logger.log('✓ Không có shop nào cần xóa');
    }
  } catch (error) {
    this.logger.error('❌ Lỗi khi xóa expired shops:', error);
  }
}
```

---

## Flows hoàn chỉnh

### Flow 1: Shop expired và bị chặn

```
1. Cron job chạy lúc 00:00 → Phát hiện shop hết hạn
   ↓
2. Set is_expired = true
   ↓
3. Gửi notification cho SHOPOWNER:
   "📧 User shopowner123: Shop Coffee Haven đã hết hạn gói PREMIUM.
    Vui lòng gia hạn trong vòng 14 ngày để tránh bị xóa vĩnh viễn."
   ↓
4. SHOPOWNER/STAFF cố truy cập API shop → 403 Forbidden
   "Subscription của shop đã hết hạn vào 28/02/2026 (1 ngày trước).
    Vui lòng gia hạn gói PREMIUM để tiếp tục sử dụng.
    Lưu ý: Shop sẽ bị xóa vĩnh viễn sau 13 ngày nữa nếu không gia hạn."
   ↓
5. SHOPOWNER vẫn có thể truy cập /subscriptions để renew
```

### Flow 2: User cố tạo shop mới khi có shop expired

```
1. User đang có shop "Coffee Haven" đã expired 3 ngày
   ↓
2. User thử tạo shop mới: POST /subscriptions/shops
   {
     "subscription_id": 2,
     "shop_name": "New Shop"
   }
   ↓
3. Hệ thống reject → 400 Bad Request
   "Bạn không thể đăng ký shop mới vì đang có shop Coffee Haven (ID: 10)
    đã hết hạn 3 ngày trước. Shop này sẽ bị xóa vĩnh viễn sau 11 ngày.
    Vui lòng gia hạn shop hiện tại hoặc chờ đến khi shop bị xóa để đăng ký shop mới."
```

### Flow 3: Xóa shop sau 14 ngày

```
1. Shop expired ngày 01/03/2026
   ↓
2. Ngày 15/03/2026, cron job chạy lúc 02:00
   ↓
3. Xóa tất cả STAFF users của shop
   ↓
4. Xóa subscription payments
   ↓
5. Xóa shop subscription
   ↓
6. Xóa tất cả dữ liệu shop (orders, inventory, customers, etc.)
   ↓
7. Reset SHOPOWNER:
   - shop_id = null
   - role_id = USER role (hoặc null)
   - owner_manager_id = null
   ↓
8. Xóa shop
   ↓
9. Log: "✅ Hoàn tất xóa shop Coffee Haven"
   ↓
10. SHOPOWNER giờ có thể đăng ký shop mới
```

### Flow 4: Renew trong thời gian 14 ngày

```
1. Shop expired, SHOPOWNER bị chặn API
   ↓
2. SHOPOWNER renew: POST /subscriptions/renew
   {
     "method": "BANK_TRANSFER"
   }
   ↓
3. Payment created với status "pending"
   ↓
4. SHOPOWNER thanh toán
   ↓
5. Confirm payment: PUT /subscriptions/payments/:id/status
   ↓
6. Hệ thống tự động:
   - Tăng number_of_renewals
   - Update end_date mới
   - Set is_expired = false
   - Shop is_active = true
   ↓
7. SHOPOWNER và STAFF có thể truy cập API lại bình thường
```

---

## Testing

### Test Case 1: Shop expired, SHOPOWNER bị chặn

```bash
# Manually set shop expired
UPDATE shop_subscriptions
SET is_expired = true, end_date = '2026-02-25'
WHERE id = 1;

# Try to access shop API
GET http://localhost:3000/products
Authorization: Bearer <shopowner_token>

# Expected: 403 Forbidden
{
  "statusCode": 403,
  "message": "Subscription của shop đã hết hạn vào 25/02/2026 (5 ngày trước). Vui lòng gia hạn gói PREMIUM để tiếp tục sử dụng. Lưu ý: Shop sẽ bị xóa vĩnh viễn sau 9 ngày nữa nếu không gia hạn.",
  "error": "Forbidden"
}

# Try to access subscription API (should work)
GET http://localhost:3000/subscriptions
Authorization: Bearer <shopowner_token>

# Expected: 200 OK
```

### Test Case 2: Chặn tạo shop mới khi có shop expired

```bash
# User đã có shop expired
POST http://localhost:3000/subscriptions/shops
Authorization: Bearer <user_token>
{
  "subscription_id": 2,
  "shop_name": "New Shop"
}

# Expected: 400 Bad Request
{
  "statusCode": 400,
  "message": "Bạn không thể đăng ký shop mới vì đang có shop \"Coffee Haven\" (ID: 10) đã hết hạn 3 ngày trước. Shop này sẽ bị xóa vĩnh viễn sau 11 ngày. Vui lòng gia hạn shop hiện tại hoặc chờ đến khi shop bị xóa để đăng ký shop mới.",
  "error": "Bad Request"
}
```

### Test Case 3: Xóa shop sau 14 ngày

```bash
# Set shop expired 15 days ago
UPDATE shop_subscriptions
SET is_expired = true, end_date = '2026-02-14'
WHERE id = 1;

# Manually trigger cleanup (as admin)
DELETE http://localhost:3000/subscriptions/maintenance/cleanup-expired-shops
Authorization: Bearer <admin_token>

# Expected: 200 OK
{
  "deleted": 1,
  "message": "Đã xóa 1 shop đã expired hơn 14 ngày cùng tất cả dữ liệu liên quan"
}

# Verify shop, users, and data are deleted
SELECT * FROM shops WHERE id = 1; -- Empty
SELECT * FROM users WHERE shop_id = 1; -- Empty
SELECT * FROM shop_subscriptions WHERE shop_id = 1; -- Empty
```

### Test Case 4: SHOPOWNER reset về trạng thái ban đầu

```bash
# After shop is deleted
SELECT id, username, shop_id, role_id, owner_manager_id
FROM users
WHERE id = <shopowner_id>;

# Expected:
# shop_id = null
# role_id = USER role (hoặc null)
# owner_manager_id = null

# User can now create new shop
POST http://localhost:3000/subscriptions/shops
Authorization: Bearer <user_token>
{
  "subscription_id": 1,
  "shop_name": "New Shop 2"
}

# Expected: 201 Created
```

---

## Maintenance Commands

### Manual trigger các cron jobs:

```bash
# Check và update expired subscriptions
POST http://localhost:3000/subscriptions/maintenance/check-expired
Authorization: Bearer <admin_token>

# Delete shops expired hơn 14 ngày
DELETE http://localhost:3000/subscriptions/maintenance/cleanup-expired-shops
Authorization: Bearer <admin_token>

# Delete unpaid shops sau 1 giờ
DELETE http://localhost:3000/subscriptions/maintenance/cleanup-unpaid-shops
Authorization: Bearer <admin_token>
```

---

## Console Logs

Khi xóa shop, console sẽ hiển thị:

```
🗑️  Xóa shop "Coffee Haven" (ID: 10) đã expired hơn 14 ngày...
   ✓ Đã xóa 3 staff users
   ✓ Đã reset user shopowner123 về trạng thái ban đầu
   ✅ Hoàn tất xóa shop "Coffee Haven"
```

Khi gửi email thông báo expired:

```
📧 Gửi email thông báo expired cho user shopowner123 (shopowner@example.com)
📧 Email thông báo subscription expired đã được gửi đến shopowner@example.com
```

---

## Email Configuration

### Environment Variables Required

Thêm vào file `.env`:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
APP_URL=http://localhost:3000
```

**Lưu ý**:

- `EMAIL_PASSWORD` phải là App Password của Gmail, không phải password thường
- Hướng dẫn tạo App Password: https://support.google.com/accounts/answer/185833
- `APP_URL` là URL của frontend để link đến trang renew

### Email Template Preview

**Subject**: ⚠️ Subscription của shop "Coffee Haven" đã hết hạn

**Content**:

```
⚠️ Subscription Đã Hết Hạn

Xin chào,

Subscription của shop Coffee Haven (gói PREMIUM) đã hết hạn vào ngày 28/02/2026.

⏰ Lưu ý quan trọng:
Shop của bạn sẽ bị xóa vĩnh viễn sau 14 ngày kể từ ngày hết hạn nếu không gia hạn.
Tất cả dữ liệu bao gồm sản phẩm, đơn hàng, khách hàng sẽ bị xóa và không thể khôi phục.

Những gì bị ảnh hưởng:
❌ Shop của bạn đã bị tạm ngưng hoạt động
❌ Bạn và nhân viên không thể truy cập các tính năng quản lý shop
❌ Khách hàng không thể thực hiện giao dịch

[Gia Hạn Ngay] (Button)
```

Khi gửi email thông báo expired:

```
📧 Gửi email thông báo expired cho user shopowner123 (shopowner@example.com)
📧 Email thông báo subscription expired đã được gửi đến shopowner@example.com
```

---

## Email Configuration

### Environment Variables Required

Thêm vào file `.env`:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
APP_URL=http://localhost:3000
```

**Lưu ý**:

- `EMAIL_PASSWORD` phải là App Password của Gmail, không phải password thường
- Hướng dẫn tạo App Password: https://support.google.com/accounts/answer/185833
- `APP_URL` là URL của frontend để link đến trang renew

### Email Template Preview

![Email Preview]

**Subject**: ⚠️ Subscription của shop "Coffee Haven" đã hết hạn

**Content**:

```
⚠️ Subscription Đã Hết Hạn

Xin chào,

Subscription của shop Coffee Haven (gói PREMIUM) đã hết hạn vào ngày 28/02/2026.

⏰ Lưu ý quan trọng:
Shop của bạn sẽ bị xóa vĩnh viễn sau 14 ngày kể từ ngày hết hạn nếu không gia hạn.
Tất cả dữ liệu bao gồm sản phẩm, đơn hàng, khách hàng sẽ bị xóa và không thể khôi phục.

Những gì bị ảnh hưởng:
❌ Shop của bạn đã bị tạm ngưng hoạt động
❌ Bạn và nhân viên không thể truy cập các tính năng quản lý shop
❌ Khách hàng không thể thực hiện giao dịch

[Gia Hạn Ngay] (Button)
```

---

## Notes quan trọng

1. **Thời gian 14 ngày là hard-coded**: Nếu muốn thay đổi, cần update trong code
2. **Notification chỉ log console**: Cần implement email service thực sự
3. **Xóa cascade phức tạp**: Cẩn thận khi test trên production
4. **SHOPOWNER có thể renew ngay cả khi expired**: Không bị chặn API `/subscriptions`
5. **Sau khi xóa, user có thể tạo shop mới**: Shop_id và role được reset

---

## Files đã thay đổi

1. ✅ [subscription-expired.guard.ts](d:\1_SWD392\ManageApp-Backend\src\modules\auth\guard\subscription-expired.guard.ts) - Guard chặn API khi expired
2. ✅ [shop-subscription.service.ts](d:\1_SWD392\ManageApp-Backend\src\modules\shop-subscriptions\shop-subscription.service.ts) - Logic xóa shop, validation, và gửi email
3. ✅ [subscription.controller.ts](d:\1_SWD392\ManageApp-Backend\src\modules\subscriptions\subscription.controller.ts) - Endpoint cleanup
4. ✅ [subscription.cron.ts](d:\1_SWD392\ManageApp-Backend\src\modules\subscriptions\subscription.cron.ts) - Cron job xóa shop
5. ✅ [email.service.ts](d:\1_SWD392\ManageApp-Backend\src\modules\email\email.service.ts) - Method gửi email thông báo expired
6. ✅ [shop-subscription.module.ts](d:\1_SWD392\ManageApp-Backend\src\modules\shop-subscriptions\shop-subscription.module.ts) - Import EmailModule

---

## TODO: Cải tiến trong tương lai

- [x] ~~Implement email service để gửi notification thực sự~~ ✅ Hoàn thành
- [ ] Thêm in-app notification cho SHOPOWNER
- [ ] Thêm warning notification trước 3 ngày, 7 ngày expired
- [ ] Email reminder trước khi shop bị xóa (ngày 7, 12, 13)
- [ ] Thêm config để thay đổi thời gian 14 ngày (trong database hoặc env)
- [ ] Thêm soft delete cho shop (backup trước khi xóa vĩnh viễn)
- [ ] Thêm API để admin restore shop đã bị xóa (trong vòng 30 ngày)
- [ ] Thêm logging chi tiết vào database (audit log)
- [ ] Thêm retry mechanism cho việc xóa (nếu có lỗi)
- [ ] Thêm SMS notification (optional)
