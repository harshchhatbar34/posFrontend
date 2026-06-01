# Remove Socket.IO and Transition to API Polling

This plan outlines the steps to remove Socket.IO from the backend and rely entirely on standard REST API endpoints for the frontend to poll every 5 seconds.

## User Review Required
> [!IMPORTANT]
> Removing Socket.IO means the frontend will no longer receive instant push notifications. The frontend will now be fully responsible for polling the existing GET APIs (e.g., `GET /api/kitchen`, `GET /api/orders`) every 5 seconds to fetch updates. Please confirm this is acceptable.

## Open Questions
- Is there any specific real-time Socket.IO feature that might not translate well to 5-second polling (e.g., instant notifications on specific order item status changes) that you want to address differently?

## Proposed Changes

### Configuration
#### [MODIFY] package.json
- Remove `socket.io` from `dependencies`.

### Server Initialization
#### [MODIFY] src/server.ts
- Remove `initializeSocket` import.
- Remove `initializeSocket(httpServer)` call.
- Remove Socket.IO console logs.

### Sockets Directory
#### [DELETE] src/sockets/socket.ts
- Completely remove the file as it's no longer needed.

### API Routes
We will remove all `emit...` function calls and their imports from the following API routes:

#### [MODIFY] src/app/api/orders/route.ts
- Remove `emitOrderNew`.

#### [MODIFY] src/app/api/orders/[id]/status/route.ts
- Remove `emitOrderUpdate` and `emitOrderServed`.

#### [MODIFY] src/app/api/orders/[id]/payment/route.ts
- Remove `emitDashboardUpdate`.

#### [MODIFY] src/app/api/order-items/[id]/status/route.ts
- Remove `emitKitchenUpdate` and `emitOrderUpdate`.

#### [MODIFY] src/app/api/inventory/[id]/stock/route.ts
- Remove `emitInventoryUpdate`.

#### [MODIFY] src/app/api/inventory/[id]/usage/route.ts
- Remove `emitInventoryUpdate`.

## Verification Plan
### Automated Tests
- Run `npm run build` to ensure there are no TypeScript or build errors after removing the socket module.
### Manual Verification
- Start the server using `npm run dev:custom`.
- Verify the server starts successfully without Socket.IO.
- Ensure that making POST/PUT requests to the modified APIs still successfully updates the database and returns a 200/201 response.
