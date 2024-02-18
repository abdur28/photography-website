// // This function preloads images after all resources are loaded
// window.onload = function() {
//   var images = document.querySelectorAll('img[src]');
//   images.forEach(function(img) {
//       img.src = img.getAttribute('src');
//   });
// };

// This function gradually fades in the photos after DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  const body = document.querySelector("body");
  body.classList.remove("opacity-0");
  body.classList.add("opacity-100");
  
  // Gradually fade in each photo with a delay
  const photos = document.querySelectorAll('img');
  let delay = 0;
  photos.forEach((photo) => {
      setTimeout(() => {
          photo.classList.remove("opacity-0");
          photo.classList.add("opacity-100");
      }, delay);
      delay += 400; // Increment delay for each photo
  });
});

