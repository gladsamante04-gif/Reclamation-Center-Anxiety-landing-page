/* ============================================================
   BOOKING LINK — one place to set it for every page.
   When you have your booking link (Calendly, Wix Bookings, etc.),
   paste it between the quotes below. Example:
     var BOOKING_URL = "https://calendly.com/reclamationcenter/intake";
   Until then, every "Book Now" button falls back to the
   Get Started form so visitors never hit a dead button.
   ============================================================ */
var BOOKING_URL = "";

(function(){
  if (!BOOKING_URL) return; // no link yet — buttons keep their fallback
  document.querySelectorAll('.js-book').forEach(function(a){
    a.href = BOOKING_URL;
    a.target = '_blank';
    a.rel = 'noopener';
  });
})();
