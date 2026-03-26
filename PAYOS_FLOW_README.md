# PayOS Flow README

Tai lieu nay giai thich toan bo flow PayOS trong backend hien tai, kem mapping den code de ban de trace va debug.

## 1) Tong quan flow

Flow hien tai co 4 buoc lon:

1. User tao shop subscription (sub_shop_id)
2. User goi API tao thanh toan PayOS
3. Backend tao payment pending trong DB + goi PayOS de lay checkoutUrl/qrCode
4. Sau khi thanh toan thanh cong, PayOS goi webhook -> backend verify signature -> cap nhat payment success -> kich hoat shop

## 2) Cac endpoint PayOS

Nam trong `SubscriptionController`:

- `POST /subscriptions/payments/payos`
  - Tao payment PayOS cho dang ky moi
- `POST /subscriptions/payments/payos/webhook`
  - Webhook public de PayOS goi ve
- `GET /subscriptions/payments/payos/callback`
  - Callback redirect user ve frontend
- `POST /subscriptions/renew/payos`
  - Tao payment PayOS cho gia han

Code:
- `src/modules/subscriptions/subscription.controller.ts`

## 3) Bien moi truong can co

Trong `.env`:

- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`
- `PAYOS_ENDPOINT` (hien dang de `https://api-merchant.payos.vn/v2`)
- `PAYOS_REDIRECT_URL`

Ghi chu:
- Doi key sandbox that cua merchant ban.
- Sau khi sua `.env`, phai restart server.

## 4) Giai thich code PayOS service

File: `src/modules/payos/payos.service.ts`

### 4.1 Constructor
Doc config tu env:
- clientId
- apiKey
- checksumKey
- endpoint
- redirectUrl

### 4.2 createPayment(...)
Lam cac viec:

1. Tao `returnUrl`, `cancelUrl` tu `PAYOS_REDIRECT_URL`
2. Tao `paymentData`
3. Tao `signature` qua `generateCreatePaymentSignature(...)`
4. Goi `postRequest('/payment-requests', body)`

### 4.3 generateCreatePaymentSignature(...)
Day la cho de sai nhat.

Code dang ky theo chuoi canonical:
- `amount=...&cancelUrl=...&description=...&orderCode=...&returnUrl=...`

Sau do HMAC-SHA256 voi `PAYOS_CHECKSUM_KEY`.

### 4.4 verifySignature(...)
Dung cho webhook:
- sort key theo alphabet
- noi `key=value` bang `&`
- HMAC SHA256
- so sanh voi `signature` PayOS gui

### 4.5 postRequest(...)
- Goi HTTPS POST
- Neu HTTP >= 400: nem loi chi tiet
- Neu body khong parse duoc JSON: nem loi raw body

## 5) Giai thich code business trong shop-subscription service

File: `src/modules/shop-subscriptions/shop-subscription.service.ts`

### 5.1 createPayosSubscriptionPayment(subShopId, userId)

1. Check `shopSubscription` ton tai
2. Check chua co payment success truoc do
3. Tao record payment `pending`, `method='PAYOS'`
4. Tao `orderCode` (dang random tu timestamp + payment id)
5. Tao `description` qua `buildPayosDescription(...)` (toi da 25 ky tu)
6. Goi `payosService.createPayment(...)`
7. Neu fail: rollback xoa payment pending
8. Neu thanh cong: tra `checkoutUrl`, `qrCode`, `orderCode`

### 5.2 renewPayosSubscription(userId)

Tuong tu dang ky moi, nhung:

1. Bat buoc user la `SHOPOWNER`
2. Lay `shopSubscription` hien tai theo `shop_id`
3. Check khong co pending payment
4. Tao payment pending va goi PayOS

### 5.3 handlePayosWebhook(webhookData)

1. Verify signature
2. Check `status === 'PAID'`
3. Tim payment pending moi nhat theo `method='PAYOS'`
4. Goi `updateSubscriptionPaymentStatus(payment.id)`

### 5.4 updateSubscriptionPaymentStatus(paymentId)

1. Check payment ton tai va dang `pending`
2. Update payment -> `success`
3. Goi `processSuccessfulPayment(paymentId)`

### 5.5 processSuccessfulPayment(paymentId)

Neu la lan thanh toan dau:
- Gan role SHOPOWNER
- Gan shop_id
- Bat `shop.is_active = true`

Neu la gia han:
- Tang `number_of_renewals`
- Tinh lai `end_date`
- Set `is_expired = false`
- Dam bao shop active

### 5.6 buildPayosDescription(...)

Tra ve chuoi ngan:
- Dang ky moi: `TT-<package>-S<shopId>`
- Gia han: `GH-<package>-S<shopId>`

Va cat toi da 25 ky tu de tranh loi:
- `description: Mo ta toi da 25 ki tu`

## 6) Cac loi ban da gap va y nghia

### Loi 1: Endpoint not found (404)
Nguyen nhan:
- Sai `PAYOS_ENDPOINT` (v1/v2)

Huong xu ly:
- Dung endpoint dung theo account docs
- Hien tai da de `v2`

### Loi 2: signature khong hop le
Nguyen nhan:
- Canonical string ky khong dung
- Checksum key sai

Huong xu ly:
- Da sua ham ky create payment
- Kiem tra lai key sandbox

### Loi 3: description toi da 25 ky tu
Nguyen nhan:
- Description dai hon rule PayOS

Huong xu ly:
- Da them `buildPayosDescription(...)`

## 7) Checklist test Postman (ngan)

1. Login lay JWT
2. Tao shop subscription lay `sub_shop_id`
3. Goi `POST /subscriptions/payments/payos`
4. Mo `checkoutUrl` de thanh toan
5. Gia lap webhook hoac cho PayOS goi webhook
6. Check DB: payment -> success, shop active

## 8) Luu y quan trong (kien truc hien tai)

Hien tai webhook dang tim `payment pending moi nhat` theo method PAYOS.

Dieu nay co rui ro neu nhieu user thanh toan cung luc.

De chinh xac hon, nen luu mapping `orderCode <-> paymentId` vao DB (vd them cot `gateway_order_code` trong `subscription_payments`) va tim nguoc theo orderCode tu webhook.

## 9) File lien quan

- `src/modules/payos/payos.service.ts`
- `src/modules/payos/payos.module.ts`
- `src/modules/subscriptions/subscription.controller.ts`
- `src/modules/shop-subscriptions/shop-subscription.service.ts`
- `src/modules/shop-subscriptions/shop-subscription.module.ts`
- `.env`

## 10) Lenh check nhanh

- Build:
  - `npm run build`
- Chay dev:
  - `npm run dev`

Neu dev fail, xem log o terminal va doi chieu theo muc 6.
