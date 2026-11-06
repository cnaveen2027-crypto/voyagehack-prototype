import { jsPDF } from 'jspdf';
import { BookingRecord, Itinerary, Trip, UserProfile } from '../types/travel';

export function downloadBookingVoucherPdf(booking: BookingRecord, user: UserProfile) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent Line
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('VOYAGEMIND AI', 18, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Your Personal AI Travel Agent • Official Travel Voucher', 18, 25);
  doc.text('Explore Anywhere. Plan Everything. Travel Smarter.', 18, 31);

  // Status Badge on Right
  doc.setFillColor(34, 197, 94); // emerald-500
  doc.roundedRect(pageWidth - 65, 14, 48, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SIMULATED BOOKING', pageWidth - 61, 22);

  // Voucher Info Container
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 52, pageWidth - 30, 36, 3, 3, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text('BOOKING REFERENCE', 22, 62);
  doc.text('ISSUE DATE', 85, 62);
  doc.text('BOOKING TYPE', 145, 62);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(booking.referenceNumber, 22, 71);

  doc.setFontSize(11);
  doc.text(new Date(booking.bookedAt).toLocaleDateString(), 85, 71);
  doc.text(booking.type.toUpperCase(), 145, 71);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Present this digital voucher or reference upon check-in/boarding.', 22, 81);

  // Main Reservation Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 96, pageWidth - 30, 85, 3, 3, 'FD');

  // Card Header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 96, pageWidth - 30, 14, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RESERVATION SPECIFICATIONS', 22, 105);

  let currentY = 120;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Item / Service:', 22, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(booking.title, 65, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Service Provider:', 22, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(booking.provider, 65, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Travel Dates:', 22, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(booking.dates, 65, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Destination / Station:', 22, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(booking.location, 65, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Lead Traveler(s):', 22, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(booking.travelerNames.join(', '), 65, currentY);

  currentY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Paid / Allocated:', 22, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`${booking.currency} ${booking.totalAmount.toLocaleString()}`, 65, currentY);

  // Simulated Barcode / Tech Strip
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 190, pageWidth - 30, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 190, pageWidth - 30, 26, 'S');

  // Simulated barcode lines
  doc.setFillColor(30, 41, 59);
  let bx = 25;
  for (let i = 0; i < 38; i++) {
    const w = (i % 3 === 0 ? 1.8 : 0.8) + (i % 5 === 0 ? 0.7 : 0);
    doc.rect(bx, 194, w, 12, 'F');
    bx += w + 1.2;
  }
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`* ${booking.referenceNumber} * VOYAGEMIND-TOKEN-AUTHENTICATED`, 25, 212);

  // Important Terms & Notice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('IMPORTANT CONDITIONS & SIMULATION DISCLOSURE:', 15, 226);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const terms = [
    '• This voucher is a simulated booking confirmation generated for travel itinerary planning & budgeting.',
    '• Dynamic options, estimates, and recovery solutions are powered by VoyageMind AI.',
    '• For actual airline boarding passes or hotel keys, present personal identification and final merchant checkout.',
    '• 24/7 VoyageMind Adaptive Journey Recovery support is active for this trip schedule.'
  ];
  let ty = 232;
  terms.forEach(t => {
    doc.text(t, 15, ty);
    ty += 5;
  });

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 275, pageWidth - 15, 275);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('VoyageMind AI Travel Platform • Generated for ' + user.name, 15, 281);
  doc.text('Page 1 of 1', pageWidth - 30, 281);

  doc.save(`VoyageMind_Voucher_${booking.referenceNumber}.pdf`);
}

export function downloadItineraryPdf(itinerary: Itinerary, trip: Trip, user: UserProfile) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 40, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('VOYAGEMIND AI ITINERARY', 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`${itinerary.destination} • ${itinerary.durationDays} Days Comprehensive Travel Plan`, 15, 26);
  doc.text(`Prepared for ${user.name} • Dates: ${trip.departureDate} to ${trip.returnDate}`, 15, 32);

  // Overview box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 48, pageWidth - 30, 26, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TRIP OVERVIEW', 20, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const splitOverview = doc.splitTextToSize(itinerary.overview, pageWidth - 42);
  doc.text(splitOverview, 20, 62);

  let y = 80;

  // Days
  itinerary.days.forEach((day, index) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(15, y, pageWidth - 30, 9, 1.5, 1.5, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`DAY ${day.dayNumber}: ${day.theme.toUpperCase()}`, 18, y + 6);

    y += 14;

    // Morning
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`Morning: ${day.morning.title}`, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${day.morning.locationName} (${day.morning.duration}) - Est. ${itinerary.currency} ${day.morning.estimatedCost}`, 18, y + 4);

    y += 10;

    // Afternoon
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(`Afternoon: ${day.afternoon.title}`, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${day.afternoon.locationName} (${day.afternoon.duration}) - Est. ${itinerary.currency} ${day.afternoon.estimatedCost}`, 18, y + 4);
    if (day.afternoon.culinaryRecommendation) {
      doc.setFont('helvetica', 'italic');
      doc.text(`Dining Tip: ${day.afternoon.culinaryRecommendation.dish} at ${day.afternoon.culinaryRecommendation.restaurant}`, 18, y + 8);
      y += 4;
    }

    y += 10;

    // Evening
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(147, 51, 234);
    doc.text(`Evening: ${day.evening.title}`, 18, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${day.evening.locationName} - Est. ${itinerary.currency} ${day.evening.estimatedCost}`, 18, y + 4);

    y += 10;

    // Transit & Cost
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Transit: ${day.localTransportMode} (${day.approxTravelTime}) • Day Total: ~${itinerary.currency} ${day.totalEstimatedDayCost}`, 18, y);

    y += 10;
  });

  doc.save(`VoyageMind_Itinerary_${itinerary.destination.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
