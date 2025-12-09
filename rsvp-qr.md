# RSVP QR Code for Milan 26'

This QR code should be displayed at each station for students to scan when they want to RSVP for their tickets.

## QR Code URL
```
http://localhost:3000/rsvp?source=station_qr
```

## How to Generate the QR Code

You can use any QR code generator with the URL above, or use an online QR code generator.

## Station Setup Instructions

1. Print this QR code and display it prominently at each station
2. Ensure the QR code is large enough to scan easily (at least 5cm x 5cm)
3. Place it where students can easily access it when they arrive at the station
4. Make sure the lighting is adequate for camera scanning

## Student Flow

1. Student logs into their account
2. Clicks the "RSVP" button on their ticket
3. Camera opens in the app
4. Student scans this QR code
5. Student gets redirected to RSVP confirmation page
6. Student confirms they are ready to pick up their physical ticket
7. Student gets added to the operator's print queue

## QR Code Image

For production, generate a QR code image using the URL above and display it at stations.

---

**Note:** This QR code is specific to the Milan 26' event management system and should only be used during the event.
