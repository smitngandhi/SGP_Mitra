# ChatbotWidget Notification Test Scenarios

## Test Case 1: Basic Notification Functionality
**Scenario**: User sends message while widget is closed
**Steps**:
1. Widget starts closed
2. User opens widget and sends a message
3. User closes widget before bot responds
4. Bot responds while widget is closed
**Expected**: Red notification badge appears with count "1"

## Test Case 2: Multiple Unread Messages
**Scenario**: Multiple bot responses while widget closed
**Steps**:
1. Widget is closed
2. Bot sends 3 responses (simulated)
3. Check notification badge
**Expected**: Badge shows "3"

## Test Case 3: Badge Limit Display
**Scenario**: More than 9 unread messages
**Steps**:
1. Widget is closed
2. Bot sends 12 responses
**Expected**: Badge shows "9+"

## Test Case 4: Clear Notifications on Open
**Scenario**: Opening widget clears notifications
**Steps**:
1. Widget closed with 5 unread messages (badge shows "5")
2. User clicks to open widget
**Expected**: Badge disappears, unread count resets to 0

## Test Case 5: No Notifications When Widget Open
**Scenario**: Bot responds while widget is open
**Steps**:
1. Widget is open
2. User sends message
3. Bot responds while widget remains open
**Expected**: No notification badge appears

## Test Case 6: Error Message Notifications
**Scenario**: Error responses trigger notifications
**Steps**:
1. Widget is closed
2. API error occurs (simulated network failure)
3. Error message is added to chat
**Expected**: Notification badge increments by 1

## Implementation Verification Checklist
- [x] Added unreadCount state
- [x] Track bot messages when widget closed
- [x] Display notification badge on floating button
- [x] Clear notifications when opening widget
- [x] Handle error messages in notification count
- [x] Badge shows "9+" for counts > 9
- [x] Badge has proper styling (red, animated)
