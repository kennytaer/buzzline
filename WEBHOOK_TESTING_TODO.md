# Twilio Webhook Testing TODO

## Prerequisites
- [ ] Deploy application to a domain (Cloudflare Pages, Vercel, etc.)
- [ ] Get public webhook URL: `https://your-domain.com/webhook/twilio`

## Twilio Dashboard Configuration

### 1. SMS Status Callbacks
- [ ] Go to Twilio Console → Phone Numbers → Manage → Active Numbers
- [ ] Select your SMS phone number
- [ ] In "Messaging" section, set "A message comes in" webhook to: `https://your-domain.com/webhook/twilio`
- [ ] Set HTTP method to POST
- [ ] In "Status Callback URL" field, enter: `https://your-domain.com/webhook/twilio`

### 2. SMS Response Handling  
- [ ] Ensure "A message comes in" webhook is configured (same URL as above)
- [ ] Test by sending SMS to your Twilio number with "STOP" message
- [ ] Check logs to verify opt-out detection works

## Testing Scenarios

### Test Opt-out Detection
1. **Setup Test Contact**
   - [ ] Upload CSV with test contact including your phone number
   - [ ] Verify contact appears in dashboard

2. **Send Test SMS Campaign** 
   - [ ] Create SMS campaign targeting test contact
   - [ ] Send campaign
   - [ ] Verify SMS received on your phone

3. **Test Opt-out Response**
   - [ ] Reply to SMS with "STOP"
   - [ ] Check webhook logs for opt-out detection
   - [ ] Verify contact marked as opted out in dashboard
   - [ ] Test other opt-out keywords: UNSUBSCRIBE, QUIT, CANCEL

### Test Delivery Status Tracking
- [ ] Send SMS campaign to valid number
- [ ] Check webhook logs for delivery status updates
- [ ] Send SMS to invalid number  
- [ ] Verify error handling in webhook logs

### Test Edge Cases
- [ ] SMS response that's not an opt-out (regular reply)
- [ ] Multiple opt-out messages from same number
- [ ] Opt-out from number not in contact database
- [ ] Malformed webhook payloads

## Monitoring & Debugging

### Webhook Logs
- [ ] Monitor server logs for webhook calls
- [ ] Verify all Twilio webhook fields are parsed correctly
- [ ] Check error handling for malformed requests

### Database Updates  
- [ ] Verify contacts are marked as opted out
- [ ] Check opt-out events are logged in analytics
- [ ] Ensure cross-organization contact search works

### Twilio Console Verification
- [ ] Check Twilio logs for webhook delivery status
- [ ] Verify webhook responds with 200 status
- [ ] Monitor for webhook retry attempts (indicates failures)

## Security Considerations (Future)
- [ ] Implement Twilio webhook signature verification
- [ ] Add rate limiting to webhook endpoint
- [ ] Validate webhook origin IP addresses

## Performance Testing
- [ ] Test webhook with high volume of SMS responses
- [ ] Monitor KV store performance during contact searches
- [ ] Verify webhook response time stays under Twilio timeout limits

## Documentation
- [ ] Document webhook URL for team
- [ ] Create troubleshooting guide for webhook issues
- [ ] Document opt-out keyword list and customization options